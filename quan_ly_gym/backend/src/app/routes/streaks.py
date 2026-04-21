from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import date, timedelta
from ..database import get_db
from ..models.user import User
from ..models.streak import MemberStreak, CheckInLog
from ..middleware.auth import get_current_user

router = APIRouter(prefix="/api/streaks", tags=["Streaks"])

STREAK_BONUSES = {3: 5, 7: 15, 14: 30, 30: 50}
BASE_POINTS = 10


def _check_streak_reset(db: Session, streak: MemberStreak):
    """If last check-in was more than 1 day ago, reset streak."""
    if not streak.LastCheckInDate:
        return
    today = date.today()
    diff = (today - streak.LastCheckInDate).days
    if diff > 1:
        streak.CurrentStreak = 0


@router.post("/checkin")
def checkin(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Member: check in for today."""
    today = date.today()

    # Check if already checked in today
    existing = db.query(CheckInLog).filter(
        CheckInLog.UserID == current_user.UserID,
        CheckInLog.CheckInDate == today,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bạn đã check-in hôm nay rồi!")

    # Get or create streak
    streak = db.query(MemberStreak).filter(
        MemberStreak.UserID == current_user.UserID
    ).first()
    if not streak:
        streak = MemberStreak(UserID=current_user.UserID, CurrentStreak=0, LongestStreak=0, TotalPoints=0)
        db.add(streak)
        db.flush()

    # Check if streak continues or resets
    _check_streak_reset(db, streak)

    # Increment streak
    streak.CurrentStreak += 1
    streak.LastCheckInDate = today
    if streak.CurrentStreak > streak.LongestStreak:
        streak.LongestStreak = streak.CurrentStreak

    # Calculate points
    points = BASE_POINTS
    bonus = STREAK_BONUSES.get(streak.CurrentStreak, 0)
    points += bonus
    streak.TotalPoints += points

    # Create log
    log = CheckInLog(
        UserID=current_user.UserID,
        CheckInDate=today,
        Points=points,
        StreakDay=streak.CurrentStreak,
    )
    db.add(log)
    db.commit()

    bonus_msg = f" (+{bonus} bonus chuỗi {streak.CurrentStreak} ngày!)" if bonus else ""
    return {
        "message": f"Check-in thành công! +{points} điểm{bonus_msg}",
        "points": points,
        "currentStreak": streak.CurrentStreak,
        "longestStreak": streak.LongestStreak,
        "totalPoints": streak.TotalPoints,
    }


@router.get("/my")
def my_streak(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current user's streak info."""
    streak = db.query(MemberStreak).filter(
        MemberStreak.UserID == current_user.UserID
    ).first()

    if not streak:
        return {
            "currentStreak": 0,
            "longestStreak": 0,
            "totalPoints": 0,
            "lastCheckIn": None,
            "checkedInToday": False,
        }

    _check_streak_reset(db, streak)
    db.commit()

    today = date.today()
    checked_today = db.query(CheckInLog).filter(
        CheckInLog.UserID == current_user.UserID,
        CheckInLog.CheckInDate == today,
    ).first() is not None

    # Recent history (last 7 days)
    week_ago = today - timedelta(days=6)
    recent = db.query(CheckInLog).filter(
        CheckInLog.UserID == current_user.UserID,
        CheckInLog.CheckInDate >= week_ago,
    ).order_by(CheckInLog.CheckInDate.desc()).all()

    return {
        "currentStreak": streak.CurrentStreak,
        "longestStreak": streak.LongestStreak,
        "totalPoints": streak.TotalPoints,
        "lastCheckIn": streak.LastCheckInDate.isoformat() if streak.LastCheckInDate else None,
        "checkedInToday": checked_today,
        "recentHistory": [
            {
                "date": r.CheckInDate.isoformat(),
                "points": r.Points,
                "streakDay": r.StreakDay,
            }
            for r in recent
        ],
    }


@router.get("/leaderboard")
def leaderboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Top 10 members by streak points."""
    top = (
        db.query(MemberStreak, User)
        .join(User, MemberStreak.UserID == User.UserID)
        .filter(User.IsDeleted == 0)
        .order_by(desc(MemberStreak.TotalPoints))
        .limit(10)
        .all()
    )
    return [
        {
            "rank": i + 1,
            "userId": s.UserID,
            "name": u.FullName,
            "totalPoints": s.TotalPoints,
            "currentStreak": s.CurrentStreak,
            "longestStreak": s.LongestStreak,
        }
        for i, (s, u) in enumerate(top)
    ]
