from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional

from ..database import get_db
from ..models.user import User
from ..models.booking import Booking
from ..models.member_pt_relation import MemberPTRelation
from ..middleware.auth import get_current_user, require_roles

router = APIRouter(prefix="/api/bookings", tags=["Bookings"])


@router.get("")
def list_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    bookings = (
        db.query(Booking)
        .options(
            joinedload(Booking.member).joinedload(User.member_profile),
            joinedload(Booking.pt).joinedload(User.pt_profile),
        )
        .order_by(Booking.StartTime.desc())
        .all()
    )
    result = []
    for b in bookings:
        m = b.member
        p = b.pt
        m_profile = m.member_profile if m else None
        p_profile = p.pt_profile if p else None
        
        result.append({
            "id": b.BookingID,
            "memberId": b.MemberID,
            "memberName": m.FullName if m else "Unknown",
            "memberEmail": m.Email if m else "",
            "memberAge": 25,
            "memberGender": "Nam",
            "memberGoal": m_profile.Goal if m_profile else "",
            "ptId": b.PTID,
            "ptName": p.FullName if p else "Đề xuất",
            "ptSpecialty": p_profile.Specialty if p_profile else "",
            "createdAt": b.StartTime.strftime("%d/%m/%Y %H:%M") if b.StartTime else "",
            "status": b.Status.lower() if b.Status else "pending",
            "note": "Yêu cầu thuê PT từ hội viên"
        })
    return result

@router.get("/my")
def my_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    bookings = (
        db.query(Booking)
        .filter((Booking.MemberID == current_user.UserID) | (Booking.PTID == current_user.UserID))
        .order_by(Booking.StartTime.desc())
        .all()
    )
    result = []
    for b in bookings:
        result.append({
            "BookingID": b.BookingID,
            "MemberName": b.member.FullName if b.member else None,
            "PTName": b.pt.FullName if b.pt else None,
            "StartTime": b.StartTime.isoformat() if b.StartTime else None,
            "EndTime": b.EndTime.isoformat() if b.EndTime else None,
            "Status": b.Status,
        })
    return result

@router.put("/{booking_id}/status")
def update_booking_status(
    booking_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = db.query(Booking).filter(Booking.BookingID == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    booking.Status = status
    db.commit()
    db.refresh(booking)
    return {"message": "Success", "status": booking.Status}

class BookingCreate(BaseModel):
    memberId: int
    ptId: int
    startTime: datetime
    endTime: datetime

@router.get("/pt-relations")
def get_pt_relations(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "MANAGER", "RECEPTIONIST")),
):
    """Lấy danh sách các cặp PT - Hội viên đã được phân bổ để lên lịch."""
    relations = db.query(MemberPTRelation).filter(MemberPTRelation.Status == "Active").all()
    result = []
    for r in relations:
        m = r.member
        p = r.pt
        result.append({
            "RelationID": r.RelationID,
            "MemberID": r.MemberID,
            "MemberName": m.FullName if m else "Unknown",
            "PTID": r.PTID,
            "PTName": p.FullName if p else "Unknown",
            "AssignedAt": r.CreatedAt.isoformat() if r.CreatedAt else None,
        })
    return result

@router.post("")
def create_booking(
    req: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "MANAGER", "RECEPTIONIST", "PT")),
):
    """Tạo booking lịch tập giữa PT và Hội viên."""
    booking = Booking(
        MemberID=req.memberId,
        PTID=req.ptId,
        StartTime=req.startTime,
        EndTime=req.endTime,
        Status="Approved",
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return {"message": "Tạo lịch hẹn thành công!", "bookingId": booking.BookingID}

@router.post("/batch")
def create_batch_bookings(
    req_list: List[BookingCreate],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "MANAGER", "RECEPTIONIST", "PT")),
):
    """Tạo nhiều booking lịch tập cùng lúc (xếp lịch theo tuần)."""
    count = 0
    for req in req_list:
        booking = Booking(
            MemberID=req.memberId,
            PTID=req.ptId,
            StartTime=req.startTime,
            EndTime=req.endTime,
            Status="Approved",
        )
        db.add(booking)
        count += 1
    db.commit()
    return {"message": f"Tạo {count} lịch hẹn thành công!"}
