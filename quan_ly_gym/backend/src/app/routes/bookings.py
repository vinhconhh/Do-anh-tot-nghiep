from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
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
    bookings = db.query(Booking).order_by(Booking.StartTime.desc()).all()
    result = []
    for b in bookings:
        result.append({
            "BookingID": b.BookingID,
            "MemberID": b.MemberID,
            "MemberName": b.member.FullName if b.member else None,
            "PTID": b.PTID,
            "PTName": b.pt.FullName if b.pt else None,
            "StartTime": b.StartTime.isoformat() if b.StartTime else None,
            "EndTime": b.EndTime.isoformat() if b.EndTime else None,
            "Status": b.Status,
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
