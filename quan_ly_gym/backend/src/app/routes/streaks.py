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
    payload: dict = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Member: check in for today. Requires all assigned exercises to be completed."""
    from ..models.facility import AssignedExercise

    today = date.today()

    # Check if already checked in today
    existing = db.query(CheckInLog).filter(
        CheckInLog.UserID == current_user.UserID,
        CheckInLog.CheckInDate == today,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bạn đã check-in hôm nay rồi!")

    # Get today's assigned exercises
    today_exercises = (
        db.query(AssignedExercise)
        .filter(
            AssignedExercise.MemberID == current_user.UserID,
            AssignedExercise.AssignedDate == today,
        )
        .all()
    )

    # No exercises assigned → cannot check-in
    if len(today_exercises) == 0:
        raise HTTPException(
            status_code=400,
            detail="no_exercises"
        )

    # Check all exercises completed
    incomplete = [e for e in today_exercises if e.Status != "Completed"]
    if incomplete:
        names = [e.exercise.AssignmentName or e.exercise.Name if e.exercise else f"ID {e.ExerciseID}" for e in incomplete]
        raise HTTPException(
            status_code=400,
            detail=f"incomplete_exercises:{','.join(names)}"
        )

    # All exercises done — proceed with check-in
    exercises_completed = len(today_exercises)
    total_sets = sum(e.Sets or 0 for e in today_exercises)
    pt_id = today_exercises[0].PTID if today_exercises else None
    rpe = (payload or {}).get("rpe")

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

    # Create check-in log with exercise progress
    log = CheckInLog(
        UserID=current_user.UserID,
        CheckInDate=today,
        Points=points,
        StreakDay=streak.CurrentStreak,
        ExercisesCompleted=exercises_completed,
        TotalSets=total_sets,
        RPE=rpe,
        PTID=pt_id,
    )
    db.add(log)

    # Also save workout log (RPE) for backward compatibility
    from ..models.log import LogWorkout
    from sqlalchemy import cast, Date as SADate
    existing_log = (
        db.query(LogWorkout)
        .filter(
            LogWorkout.UserID == current_user.UserID,
            cast(LogWorkout.WorkoutDate, SADate) == today,
        )
        .first()
    )
    if existing_log:
        existing_log.RPE = rpe
    else:
        from datetime import datetime
        new_log = LogWorkout(
            UserID=current_user.UserID,
            WorkoutDate=datetime.utcnow(),
            RPE=rpe,
        )
        db.add(new_log)

    db.commit()

    bonus_msg = f" (+{bonus} bonus chuỗi {streak.CurrentStreak} ngày!)" if bonus else ""
    return {
        "message": f"Check-in thành công! +{points} điểm{bonus_msg}",
        "points": points,
        "currentStreak": streak.CurrentStreak,
        "longestStreak": streak.LongestStreak,
        "totalPoints": streak.TotalPoints,
        "exercisesCompleted": exercises_completed,
        "totalSets": total_sets,
        "reportedToPT": pt_id is not None,
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
