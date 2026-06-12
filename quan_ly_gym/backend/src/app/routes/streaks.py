from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, cast, Date as SADate
from datetime import date, timedelta
from ..database import get_db
from ..models.user import User
from ..models.profile import MemberProfile
from ..models.facility import ClassEnrollment, GymClass
from ..middleware.auth import get_current_user

router = APIRouter(prefix="/api/streaks", tags=["Streaks"])


def _check_streak_reset(db: Session, profile: MemberProfile):
    """If last attendance was more than 1 day ago, reset streak."""
    if not profile.LastAttendanceDate:
        return
    today = date.today()
    diff = (today - profile.LastAttendanceDate).days
    if diff > 1:
        profile.CurrentStreak = 0


@router.post("/checkin")
def checkin(
    payload: dict = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Dummy endpoint since check-in is now handled automatically via class attendance."""
    profile = db.query(MemberProfile).filter(MemberProfile.UserID == current_user.UserID).first()
    if not profile:
        profile = MemberProfile(UserID=current_user.UserID, CurrentStreak=0, LongestStreak=0)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    _check_streak_reset(db, profile)
    db.commit()

    return {
        "message": "Điểm danh tự động qua lớp học nhóm!",
        "points": 0,
        "currentStreak": profile.CurrentStreak if profile.CurrentStreak is not None else 0,
        "longestStreak": profile.LongestStreak if profile.LongestStreak is not None else 0,
        "totalPoints": 0,
        "exercisesCompleted": 0,
        "totalSets": 0,
        "reportedToPT": False,
    }


@router.get("/my")
def my_streak(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current user's streak info."""
    profile = db.query(MemberProfile).filter(
        MemberProfile.UserID == current_user.UserID
    ).first()

    if not profile:
        return {
            "currentStreak": 0,
            "longestStreak": 0,
            "totalPoints": 0,
            "lastCheckIn": None,
            "checkedInToday": False,
            "recentHistory": [],
        }

    _check_streak_reset(db, profile)
    db.commit()

    today = date.today()
    checked_today = db.query(ClassEnrollment).join(
        GymClass, ClassEnrollment.ClassID == GymClass.ClassID
    ).filter(
        ClassEnrollment.MemberID == current_user.UserID,
        ClassEnrollment.AttendanceStatus == "Present",
        cast(GymClass.StartTime, SADate) == today
    ).first() is not None

    week_ago = today - timedelta(days=6)
    recent_enrolls = db.query(ClassEnrollment).join(
        GymClass, ClassEnrollment.ClassID == GymClass.ClassID
    ).filter(
        ClassEnrollment.MemberID == current_user.UserID,
        ClassEnrollment.AttendanceStatus == "Present",
        cast(GymClass.StartTime, SADate) >= week_ago,
    ).all()

    recent_history = []
    seen_dates = set()
    for re in recent_enrolls:
        d_str = re.gym_class.StartTime.date().isoformat()
        if d_str not in seen_dates:
            seen_dates.add(d_str)
            recent_history.append({
                "date": d_str,
                "points": 0,
                "streakDay": 0
            })

    return {
        "currentStreak": profile.CurrentStreak if profile.CurrentStreak is not None else 0,
        "longestStreak": profile.LongestStreak if profile.LongestStreak is not None else 0,
        "totalPoints": 0,
        "lastCheckIn": profile.LastAttendanceDate.isoformat() if profile.LastAttendanceDate else None,
        "checkedInToday": checked_today,
        "recentHistory": recent_history,
    }


@router.get("/leaderboard")
def leaderboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Top 10 members by longest streak."""
    top = (
        db.query(MemberProfile, User)
        .join(User, MemberProfile.UserID == User.UserID)
        .filter(User.IsDeleted == 0)
        .order_by(desc(MemberProfile.LongestStreak))
        .limit(10)
        .all()
    )
    return [
        {
            "rank": i + 1,
            "userId": s.UserID,
            "name": u.FullName,
            "totalPoints": 0,
            "currentStreak": s.CurrentStreak if s.CurrentStreak is not None else 0,
            "longestStreak": s.LongestStreak if s.LongestStreak is not None else 0,
        }
        for i, (s, u) in enumerate(top)
    ]
