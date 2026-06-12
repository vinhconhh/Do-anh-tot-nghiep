from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
from ..database import get_db
from ..models.booking import CheckIn
from ..models.user import User
from ..models.profile import MemberProfile
from ..middleware.auth import get_current_user, require_roles

router = APIRouter(prefix="/api/checkins", tags=["CheckIns"])

@router.post("/user/{user_id}")
def check_in_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_roles("RECEPTIONIST", "ADMIN"))):
    user = db.query(User).filter(User.UserID == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")

    today = date.today()

    # Check if already checked in today
    existing_checkin = db.query(CheckIn).filter(
        CheckIn.UserID == user_id,
    ).all()
    
    # Filter in python to avoid timezone/date casting issues in SQL Server
    for chk in existing_checkin:
        if chk.CheckInTime and chk.CheckInTime.date() == today:
            raise HTTPException(status_code=400, detail="Người dùng này đã được điểm danh hôm nay rồi.")

    # Create CheckIn record
    new_checkin = CheckIn(UserID=user_id, CheckInTime=datetime.utcnow())
    db.add(new_checkin)

    # If the user is a MEMBER, update streaks in MemberProfile
    if user.role and user.role.RoleCode == "MEMBER":
        profile = db.query(MemberProfile).filter(MemberProfile.UserID == user_id).first()
        if profile:
            if profile.LastAttendanceDate == today:
                # Already handled by checkins check, but just in case
                pass
            else:
                if profile.LastAttendanceDate == today - timedelta(days=1):
                    profile.CurrentStreak = (profile.CurrentStreak or 0) + 1
                elif profile.LastAttendanceDate is None or profile.LastAttendanceDate < today - timedelta(days=1):
                    profile.CurrentStreak = 1
                
                profile.LongestStreak = max((profile.LongestStreak or 0), profile.CurrentStreak)
                profile.LastAttendanceDate = today

    db.commit()
    return {"message": "Điểm danh thành công!", "user_id": user_id, "name": user.FullName}


@router.get("/my-history")
def get_my_checkin_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    checkins = db.query(CheckIn).filter(CheckIn.UserID == current_user.UserID).order_by(CheckIn.CheckInTime.desc()).all()
    
    return [
        {
            "CheckInID": c.CheckInID,
            "CheckInTime": c.CheckInTime.isoformat() if c.CheckInTime else None,
            "BookingID": c.BookingID,
            "ScheduleID": c.ScheduleID
        }
        for c in checkins
    ]

@router.get("/today")
def get_todays_checkins(db: Session = Depends(get_db), current_user: User = Depends(require_roles("RECEPTIONIST", "ADMIN"))):
    today = date.today()
    from sqlalchemy import cast, Date
    checkins = db.query(CheckIn.UserID).filter(
        cast(CheckIn.CheckInTime, Date) == today
    ).all()
    
    # Return a list of UserIDs who checked in today
    return [c[0] for c in checkins]
