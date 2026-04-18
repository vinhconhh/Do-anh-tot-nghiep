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

    return {
        "aiQuota": profile.AIQuota if profile else 0,
        "aiUsed": ai_used,
        "sessionsCompleted": 0,
        "totalSchedules": total_schedules,
        "streak": 0,
        "weight": latest_metric.Weight if latest_metric else (profile.Weight if profile else None),
    }
