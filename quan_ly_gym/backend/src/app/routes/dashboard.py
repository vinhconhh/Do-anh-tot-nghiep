from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models.user import User, Role
from ..models.profile import MemberProfile
from ..models.finance import Transaction
from ..models.ai import AIRequest, AIResponse
from ..models.booking import Booking
from ..models.workout import Schedule
from ..models.log import BodyMetric
from ..middleware.auth import get_current_user
from datetime import datetime

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    member_role = db.query(Role).filter(Role.RoleCode == "MEMBER").first()
    pt_role = db.query(Role).filter(Role.RoleCode == "PT").first()

    total_members = 0
    total_trainers = 0
    if member_role:
        total_members = db.query(func.count(User.UserID)).filter(
            User.RoleID == member_role.RoleID, User.IsDeleted == 0
        ).scalar() or 0
    if pt_role:
        total_trainers = db.query(func.count(User.UserID)).filter(
            User.RoleID == pt_role.RoleID, User.IsDeleted == 0
        ).scalar() or 0

    total_revenue = db.query(func.coalesce(func.sum(Transaction.Amount), 0)).filter(
        Transaction.Status == "Paid"
    ).scalar() or 0

    ai_used = db.query(func.count(AIRequest.RequestID)).scalar() or 0

    pending_bookings = db.query(func.count(Booking.BookingID)).filter(
        Booking.Status == "Pending"
    ).scalar() or 0

    return {
        "totalMembers": total_members,
        "totalTrainers": total_trainers,
        "revenue": f"{float(total_revenue)/1_000_000:.1f}M đ" if total_revenue else "0đ",
        "aiUsed": ai_used,
        "aiTotal": 5000,
        "trainers": total_trainers,
        "pendingRequests": pending_bookings,
    }


@router.get("/revenue")
def get_revenue(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # revenue by month (last 6 months)
    from datetime import datetime, timedelta
    result = []
    now = datetime.utcnow()
    for i in range(5, -1, -1):
        d = now - timedelta(days=30 * i)
        month_start = d.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if d.month == 12:
            month_end = month_start.replace(year=d.year + 1, month=1)
        else:
            month_end = month_start.replace(month=d.month + 1)

        rev = db.query(func.coalesce(func.sum(Transaction.Amount), 0)).filter(
            Transaction.Status == "Paid",
            Transaction.CreatedAt >= month_start,
            Transaction.CreatedAt < month_end,
        ).scalar() or 0

        member_role = db.query(Role).filter(Role.RoleCode == "MEMBER").first()
        new_members = 0
        if member_role:
            new_members = db.query(func.count(User.UserID)).filter(
                User.RoleID == member_role.RoleID,
                User.IsDeleted == 0,
                User.CreatedAt >= month_start,
                User.CreatedAt < month_end,
            ).scalar() or 0

        result.append({
            "month": f"T{d.month}/{str(d.year)[-2:]}",
            "revenue": round(float(rev) / 1_000_000, 1),
            "newMembers": new_members,
        })
    return result


@router.get("/recent-members")
def get_recent_members(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    member_role = db.query(Role).filter(Role.RoleCode == "MEMBER").first()
    if not member_role:
        return []

    members = (
        db.query(User)
        .filter(User.RoleID == member_role.RoleID, User.IsDeleted == 0)
        .order_by(User.CreatedAt.desc())
        .limit(5)
        .all()
    )
    results = []
    for m in members:
        profile = db.query(MemberProfile).filter(MemberProfile.UserID == m.UserID).first()
        initials = "".join([w[0] for w in (m.FullName or "").split()[-2:]]).upper() or "--"
        results.append({
            "name": m.FullName,
            "email": m.Email,
            "initials": initials,
            "goal": profile.Goal if profile else None,
            "status": "active" if m.IsActive else "expired",
        })
    return results


@router.get("/member-stats")
def get_member_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Stats for the currently logged-in member."""
    profile = db.query(MemberProfile).filter(MemberProfile.UserID == current_user.UserID).first()
    ai_used = db.query(func.count(AIRequest.RequestID)).filter(
        AIRequest.UserID == current_user.UserID
    ).scalar() or 0
    total_schedules = db.query(func.count(Schedule.ScheduleID)).filter(
        Schedule.UserID == current_user.UserID
    ).scalar() or 0

    latest_metric = (
        db.query(BodyMetric)
        .filter(BodyMetric.UserID == current_user.UserID)
        .order_by(BodyMetric.MeasuredAt.desc())
        .first()
    )

    metrics = (
        db.query(BodyMetric)
        .filter(BodyMetric.UserID == current_user.UserID)
        .order_by(BodyMetric.MeasuredAt.asc())
        .limit(12)
        .all()
    )
    weight_chart = []
    for i, m in enumerate(metrics):
        weight_chart.append({
            "week": f"Lần {i+1}",
            "weight": m.Weight,
        })

    return {
        "aiQuota": profile.AIQuota if profile else 0,
        "aiUsed": ai_used,
        "sessionsCompleted": 0,
        "totalSchedules": total_schedules,
        "streak": 0,
        "weight": latest_metric.Weight if latest_metric else (profile.Weight if profile else None),
        "height": profile.Height if profile else None,
        "bodyFat": latest_metric.BodyFat if latest_metric else None,
        "referralCode": current_user.ReferralCode,
        "weightChart": weight_chart
    }

from pydantic import BaseModel
class BodyMetricsUpdate(BaseModel):
    weight: float = None
    fat: float = None
    height: float = None
    muscle: float = None

@router.post("/member-stats/metrics")
def update_member_metrics(
    metrics: BodyMetricsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = db.query(MemberProfile).filter(MemberProfile.UserID == current_user.UserID).first()
    if profile:
        if metrics.height is not None and metrics.height > 0:
            profile.Height = metrics.height
        if metrics.weight is not None and metrics.weight > 0:
            profile.Weight = metrics.weight
    
    # Calculate BMI
    bmi = None
    height_m = (profile.Height / 100) if profile and profile.Height and profile.Height > 0 else (metrics.height / 100 if metrics.height and metrics.height > 0 else None)
    if height_m and metrics.weight and metrics.weight > 0:
        bmi = metrics.weight / (height_m ** 2)

    new_metric = BodyMetric(
        UserID=current_user.UserID,
        Weight=metrics.weight,
        BodyFat=metrics.fat,
        BMI=bmi,
        MeasuredAt=datetime.utcnow()
    )
    db.add(new_metric)
    db.commit()
    
    return {"message": "Cập nhật chỉ số thành công"}


@router.get("/workout-log")
def get_workout_log(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lấy nhật ký tập luyện chi tiết của member hiện tại."""
    from ..models.log import LogWorkout, LogWorkoutDetail
    from ..models.exercise import Exercise

    logs = (
        db.query(LogWorkout)
        .filter(LogWorkout.UserID == current_user.UserID)
        .order_by(LogWorkout.WorkoutDate.desc())
        .limit(50)
        .all()
    )

    result = []
    for log in logs:
        date_str = log.WorkoutDate.strftime("%d/%m/%Y") if log.WorkoutDate else ""
        for detail in log.details:
            exercise_name = detail.exercise.TenBaiTap if detail.exercise else f"ID {detail.ExerciseID}"
            sets = detail.SetNumber or 0
            reps = detail.Reps or 0
            weight = detail.Weight or 0
            volume = round(sets * reps * weight, 1)
            result.append({
                "date": date_str,
                "exercise": exercise_name,
                "sets": sets,
                "reps": reps,
                "weight": weight,
                "volume": volume,
                "rpe": log.RPE,
            })

    return result


@router.post("/workout-log")
def save_workout_log(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lưu nhật ký buổi tập (RPE) cho member hiện tại."""
    from ..models.log import LogWorkout

    # Tìm log hôm nay
    today = datetime.utcnow().date()
    existing = (
        db.query(LogWorkout)
        .filter(
            LogWorkout.UserID == current_user.UserID,
            func.date(LogWorkout.WorkoutDate) == today,
        )
        .first()
    )

    rpe = payload.get("rpe")

    if existing:
        existing.RPE = rpe
        db.commit()
        return {"message": "Đã cập nhật RPE cho buổi tập hôm nay", "log_id": existing.LogID}
    else:
        new_log = LogWorkout(
            UserID=current_user.UserID,
            WorkoutDate=datetime.utcnow(),
            RPE=rpe,
        )
        db.add(new_log)
        db.commit()
        db.refresh(new_log)
        return {"message": "Đã lưu nhật ký buổi tập", "log_id": new_log.LogID}

@router.get("/member-report/list")
def member_report_list(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all members with summary stats for the report dropdown."""
    from ..models.log import LogWorkout
    from ..models.booking import CheckIn
    from ..models.streak import MemberStreak

    member_role = db.query(Role).filter(Role.RoleCode == "MEMBER").first()
    if not member_role:
        return []

    members = (
        db.query(User)
        .filter(User.RoleID == member_role.RoleID, User.IsDeleted == 0)
        .order_by(User.FullName)
        .all()
    )

    result = []
    for m in members:
        profile = db.query(MemberProfile).filter(MemberProfile.UserID == m.UserID).first()
        ai_used = db.query(func.count(AIRequest.RequestID)).filter(
            AIRequest.UserID == m.UserID
        ).scalar() or 0
        ai_total = profile.AIQuota if profile else 0

        # Sessions completed (LogWorkouts count)
        sessions = db.query(func.count(LogWorkout.LogID)).filter(
            LogWorkout.UserID == m.UserID
        ).scalar() or 0

        # Total scheduled
        total_scheduled = db.query(func.count(Schedule.ScheduleID)).filter(
            Schedule.UserID == m.UserID
        ).scalar() or 0

        completion = round((sessions / total_scheduled * 100) if total_scheduled > 0 else 0)

        # Streak
        streak = db.query(MemberStreak).filter(MemberStreak.UserID == m.UserID).first()

        # Latest body metric
        latest_metric = (
            db.query(BodyMetric)
            .filter(BodyMetric.UserID == m.UserID)
            .order_by(BodyMetric.MeasuredAt.desc())
            .first()
        )

        result.append({
            "id": str(m.UserID),
            "name": m.FullName,
            "email": m.Email,
            "goal": profile.Goal if profile else "",
            "height": profile.Height if profile else None,
            "weight": profile.Weight if profile else None,
            "aiUsed": ai_used,
            "aiTotal": ai_total,
            "sessions": sessions,
            "completion": completion,
            "streak": streak.CurrentStreak if streak else 0,
            "totalPoints": streak.TotalPoints if streak else 0,
            "bodyFat": latest_metric.BodyFat if latest_metric else None,
            "bmi": float(latest_metric.BMI) if latest_metric and latest_metric.BMI else None,
        })
    return result


@router.get("/member-report/{member_id}")
def member_report_detail(
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Detailed report for a specific member: weight chart, session chart, activities."""
    from ..models.log import LogWorkout, LogWorkoutDetail
    from ..models.booking import Booking
    from ..models.streak import CheckInLog
    from datetime import datetime, timedelta

    user = db.query(User).filter(User.UserID == member_id, User.IsDeleted == 0).first()
    if not user:
        return {"weightChart": [], "sessionChart": [], "activities": []}

    # Weight chart (body metrics over time)
    metrics = (
        db.query(BodyMetric)
        .filter(BodyMetric.UserID == member_id)
        .order_by(BodyMetric.MeasuredAt.asc())
        .limit(12)
        .all()
    )
    weight_chart = []
    for i, m in enumerate(metrics):
        weight_chart.append({
            "week": f"T{i+1}",
            "weight": m.Weight,
        })

    # Session chart: workouts per week (last 8 weeks)
    now = datetime.utcnow()
    session_chart = []
    for i in range(7, -1, -1):
        week_start = now - timedelta(weeks=i, days=now.weekday())
        week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
        week_end = week_start + timedelta(days=7)

        count = db.query(func.count(LogWorkout.LogID)).filter(
            LogWorkout.UserID == member_id,
            LogWorkout.WorkoutDate >= week_start,
            LogWorkout.WorkoutDate < week_end,
        ).scalar() or 0

        session_chart.append({
            "week": f"T{8-i}",
            "done": count,
        })

    # Activities - recent log workouts, bookings, AI requests, check-ins
    activities = []

    # Log workouts
    logs = (
        db.query(LogWorkout)
        .filter(LogWorkout.UserID == member_id)
        .order_by(LogWorkout.WorkoutDate.desc())
        .limit(10)
        .all()
    )
    for log in logs:
        activities.append({
            "date": log.WorkoutDate.strftime("%d/%m/%Y") if log.WorkoutDate else "",
            "action": "Hoàn thành buổi tập",
            "pt": "—",
            "ai": 0,
            "result": "✅ Hoàn thành",
        })

    # Bookings
    bookings = (
        db.query(Booking)
        .filter(Booking.MemberID == member_id)
        .order_by(Booking.StartTime.desc())
        .limit(10)
        .all()
    )
    for b in bookings:
        pt_user = db.query(User).filter(User.UserID == b.PTID).first()
        activities.append({
            "date": b.StartTime.strftime("%d/%m/%Y") if b.StartTime else "",
            "action": f"Buổi tập với PT",
            "pt": pt_user.FullName if pt_user else "—",
            "ai": 0,
            "result": b.Status or "—",
        })

    # AI Requests
    ai_reqs = (
        db.query(AIRequest)
        .filter(AIRequest.UserID == member_id)
        .order_by(AIRequest.CreatedAt.desc())
        .limit(10)
        .all()
    )
    for a in ai_reqs:
        resp = db.query(AIResponse).filter(AIResponse.RequestID == a.RequestID).first()
        activities.append({
            "date": a.CreatedAt.strftime("%d/%m/%Y") if a.CreatedAt else "",
            "action": f"Dùng AI: {(a.Prompt or '')[:50]}",
            "pt": "—",
            "ai": 1,
            "result": resp.Status if resp else "—",
        })

    # Check-in logs
    checkins = (
        db.query(CheckInLog)
        .filter(CheckInLog.UserID == member_id)
        .order_by(CheckInLog.CheckInDate.desc())
        .limit(10)
        .all()
    )
    for c in checkins:
        activities.append({
            "date": c.CheckInDate.strftime("%d/%m/%Y") if c.CheckInDate else "",
            "action": f"Check-in (chuỗi {c.StreakDay} ngày)",
            "pt": "—",
            "ai": 0,
            "result": f"+{c.Points} điểm",
        })

    # Sort by date descending
    activities.sort(key=lambda x: x["date"], reverse=True)

    return {
        "weightChart": weight_chart,
        "sessionChart": session_chart,
        "activities": activities[:20],
    }

