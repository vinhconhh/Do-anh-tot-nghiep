from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from ..models.user import User
from ..models.booking import Booking
from ..middleware.auth import get_current_user

router = APIRouter(prefix="/api/bookings", tags=["Bookings"])


@router.get("")
def list_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Join with member and PT profiles to get more detail
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
            "memberAge": 25, # Placeholder or calculate from DOB if available
            "memberGender": "Nam", # Placeholder
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
    # Return bookings where user is either the member or the PT
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
