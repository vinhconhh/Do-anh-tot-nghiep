from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date as SADate
from datetime import datetime, date, timezone, timedelta
from ..database import get_db
from ..models.user import User, Role
from ..models.profile import MemberProfile
from ..models.ai import AIRequest, AIResponse
from ..models.booking import Booking
from ..models.workout import Schedule
from ..models.log import BodyMetric, LogWorkout
from ..middleware.auth import get_current_user
from ..models.pt_request import PTRequest
from ..models.profile import PTProfile

VN_TZ = timezone(timedelta(hours=7))

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

    ai_used = db.query(func.count(AIRequest.RequestID)).scalar() or 0

    pending_bookings = db.query(func.count(Booking.BookingID)).filter(
        Booking.Status == "Pending"
    ).scalar() or 0

    return {
        "totalMembers": total_members,
        "totalTrainers": total_trainers,
        "revenue": "0đ",
        "aiUsed": ai_used,
        "aiTotal": 0,
        "trainers": total_trainers,
        "pendingRequests": pending_bookings,
    }


@router.get("/revenue")
def get_revenue(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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
            "revenue": 0,
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

    members_with_profiles = (
        db.query(User, MemberProfile)
        .outerjoin(MemberProfile, User.UserID == MemberProfile.UserID)
        .filter(User.RoleID == member_role.RoleID, User.IsDeleted == 0)
        .order_by(User.CreatedAt.desc())
        .limit(5)
        .all()
    )
    
    results = []
    for m, profile in members_with_profiles:
        initials = "".join([w[0] for w in (m.FullName or "").split()[-2:]]).upper() or "--"
        
        pt_req = db.query(PTRequest).filter(
            PTRequest.MemberID == m.UserID,
            PTRequest.Status == "Approved"
        ).order_by(PTRequest.CreatedAt.desc()).first()
        
        pt_name = "—"
        if pt_req:
            pt_user = db.query(User).filter(User.UserID == pt_req.PTID).first()
            if pt_user:
                pt_name = pt_user.FullName

        results.append({
            "name": m.FullName,
            "email": m.Email,
            "initials": initials,
            "goal": profile.Goal if profile else None,
            "pt": pt_name,
            "status": "active" if m.IsActive else "expired",
        })
    return results


@router.get("/top-trainers")
def get_top_trainers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pt_role = db.query(Role).filter(Role.RoleCode == "PT").first()
    if not pt_role:
        return []

    pts = (
        db.query(User, PTProfile)
        .outerjoin(PTProfile, User.UserID == PTProfile.UserID)
        .filter(User.RoleID == pt_role.RoleID, User.IsDeleted == 0)
        .all()
    )

    from datetime import timedelta
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    results = []
    for pt, profile in pts:
        initials = "".join([w[0] for w in (pt.FullName or "").split()[-2:]]).upper() or "--"
        
        members_count = db.query(func.count(func.distinct(PTRequest.MemberID))).filter(
            PTRequest.PTID == pt.UserID,
            PTRequest.Status == "Approved"
        ).scalar() or 0
        
        sessions = db.query(func.count(Booking.BookingID)).filter(
            Booking.PTID == pt.UserID,
            Booking.StartTime >= month_start,
            Booking.Status == "Completed"
        ).scalar() or 0

        spec = []
        if profile and profile.Specialty:
            spec = [s.strip() for s in profile.Specialty.split(",")]
        else:
            spec = ["General"]

        rating = 5.0
        if profile and profile.TotalScore:
            rating = round((profile.TotalScore / 100) * 5.0, 1)

        results.append({
            "name": pt.FullName,
            "initials": initials,
            "spec": spec,
            "members": members_count,
            "sessions": sessions,
            "rating": rating,
        })
    
    results.sort(key=lambda x: (x["rating"], x["sessions"]), reverse=True)
    return results[:5]


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

    sessions_completed = db.query(func.count(LogWorkout.LogID)).filter(
        LogWorkout.UserID == current_user.UserID
    ).scalar() or 0

    streak_val = profile.CurrentStreak if profile and profile.CurrentStreak is not None else 0
    
    from ..models.facility import ClassEnrollment, GymClass
    today = date.today()
    checked_in_today = db.query(ClassEnrollment).join(
        GymClass, ClassEnrollment.ClassID == GymClass.ClassID
    ).filter(
        ClassEnrollment.MemberID == current_user.UserID,
        ClassEnrollment.AttendanceStatus == "Present",
        cast(GymClass.StartTime, SADate) == today
    ).first() is not None

    if not current_user.ReferralCode:
        import uuid
        current_user.ReferralCode = str(uuid.uuid4())[:8].upper()
        db.commit()

    return {
        "aiUsed": ai_used,
        "sessionsCompleted": sessions_completed,
        "totalSchedules": total_schedules,
        "streak": streak_val,
        "totalPoints": 0,
        "checkedInToday": checked_in_today,
        "weight": latest_metric.Weight if latest_metric else (profile.Weight if profile else None),
        "height": profile.Height if profile else None,
        "bodyFat": latest_metric.BodyFat if latest_metric else None,
        "muscle": latest_metric.Muscle if latest_metric else None,
        "referralCode": current_user.ReferralCode,
        "weightChart": weight_chart,
        "gender": current_user.Gender,
        "birthday": current_user.Birthday.isoformat() if current_user.Birthday else None,
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
        if metrics.height and metrics.height > 0:
            profile.Height = metrics.height
        if metrics.weight and metrics.weight > 0:
            profile.Weight = metrics.weight
    
    bmi = None
    height_to_use = metrics.height or (profile.Height if profile else None)
    if height_to_use and height_to_use > 0 and metrics.weight and metrics.weight > 0:
        bmi = metrics.weight / ((height_to_use / 100) ** 2)

    new_metric = BodyMetric(
        UserID=current_user.UserID,
        Weight=metrics.weight,
        BodyFat=metrics.fat,
        Muscle=metrics.muscle,
        Height=height_to_use,
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
        if log.WorkoutDate:
            utc_dt = log.WorkoutDate.replace(tzinfo=timezone.utc)
            vn_dt = utc_dt.astimezone(VN_TZ)
            date_str = vn_dt.strftime("%d/%m/%Y")
        else:
            date_str = ""
        for detail in log.details:
            exercise_name = (getattr(detail.exercise, 'AssignmentName', None) or getattr(detail.exercise, 'Name', None) or f"ID {detail.ExerciseID}") if detail.exercise else f"ID {detail.ExerciseID}"
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

    today = datetime.now(VN_TZ).date()
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
            WorkoutDate=datetime.now(VN_TZ),
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

        sessions = db.query(func.count(LogWorkout.LogID)).filter(
            LogWorkout.UserID == m.UserID
        ).scalar() or 0

        total_scheduled = db.query(func.count(Schedule.ScheduleID)).filter(
            Schedule.UserID == m.UserID
        ).scalar() or 0

        completion = round((sessions / total_scheduled * 100) if total_scheduled > 0 else 0)

        streak = profile

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
            "sessions": sessions,
            "completion": completion,
            "streak": streak.CurrentStreak if streak and streak.CurrentStreak is not None else 0,
            "totalPoints": 0,
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
    from ..models.log import LogWorkout, LogWorkoutDetail
    from ..models.booking import Booking
    from datetime import datetime, timedelta

    user = db.query(User).filter(User.UserID == member_id, User.IsDeleted == 0).first()
    if not user:
        return {"weightChart": [], "sessionChart": [], "activities": []}

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

    activities = []

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

    from ..models.facility import ClassEnrollment, GymClass
    checkins = (
        db.query(ClassEnrollment)
        .join(GymClass, ClassEnrollment.ClassID == GymClass.ClassID)
        .filter(
            ClassEnrollment.MemberID == member_id,
            ClassEnrollment.AttendanceStatus == "Present",
        )
        .order_by(GymClass.StartTime.desc())
        .limit(10)
        .all()
    )
    for c in checkins:
        activities.append({
            "date": c.gym_class.StartTime.strftime("%d/%m/%Y") if c.gym_class and c.gym_class.StartTime else "",
            "action": f"Điểm danh lớp nhóm: {c.gym_class.Name if c.gym_class else 'Lớp học'}",
            "pt": "—",
            "ai": 0,
            "result": "✅ Có mặt",
        })

    activities.sort(key=lambda x: x["date"], reverse=True)

    return {
        "weightChart": weight_chart,
        "sessionChart": session_chart,
        "activities": activities[:20],
    }

@router.get("/attendance-frequency")
def get_attendance_frequency(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Thống kê tần suất đến lớp của member dựa trên ClassEnrollment từ HLV điểm danh."""
    from ..models.facility import ClassEnrollment, GymClass

    enrollments = (
        db.query(ClassEnrollment, GymClass)
        .join(GymClass, ClassEnrollment.ClassID == GymClass.ClassID)
        .filter(
            ClassEnrollment.MemberID == current_user.UserID,
            GymClass.IsDeleted == 0,
        )
        .order_by(GymClass.StartTime.desc())
        .all()
    )

    class_map = {}
    for enroll, cls in enrollments:
        group_id = cls.ParentClassID if cls.ParentClassID else cls.ClassID

        instructor_name = "—"
        if cls.InstructorID:
            instructor = db.query(User).filter(User.UserID == cls.InstructorID).first()
            instructor_name = instructor.FullName if instructor else cls.InstructorName or "—"
        elif cls.InstructorName:
            instructor_name = cls.InstructorName

        if group_id not in class_map:
            class_map[group_id] = {
                "className": cls.Name,
                "instructorName": instructor_name,
                "total": 0,
                "present": 0,
                "absent": 0,
                "notRecorded": 0,
                "latestDate": cls.StartTime,
            }

        entry = class_map[group_id]
        entry["total"] += 1
        if enroll.AttendanceStatus == "Present":
            entry["present"] += 1
        elif enroll.AttendanceStatus == "Absent":
            entry["absent"] += 1
        else:
            entry["notRecorded"] += 1

        if cls.StartTime and (entry["latestDate"] is None or cls.StartTime > entry["latestDate"]):
            entry["latestDate"] = cls.StartTime

    result = []
    for group_id, data in class_map.items():
        attendance_rate = round(data["present"] / data["total"] * 100) if data["total"] > 0 else 0
        result.append({
            "classGroupId": group_id,
            "className": data["className"],
            "instructorName": data["instructorName"],
            "totalSessions": data["total"],
            "present": data["present"],
            "absent": data["absent"],
            "notRecorded": data["notRecorded"],
            "attendanceRate": attendance_rate,
            "latestDate": data["latestDate"].replace(tzinfo=timezone.utc).astimezone(VN_TZ).strftime("%d/%m/%Y") if data["latestDate"] else "—",
        })

    result.sort(key=lambda x: x["latestDate"], reverse=True)
    return result


@router.get("/trainer-report/{trainer_id}")
def trainer_report_detail(
    trainer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Detailed report for a specific trainer: session chart, activities."""
    from ..models.facility import AssignedExercise
    from ..models.pt_request import PTRequest
    from ..models.booking import Booking
    from datetime import datetime, timedelta

    user = db.query(User).filter(User.UserID == trainer_id, User.IsDeleted == 0).first()
    if not user:
        return {"sessionChart": [], "activities": []}

    now = datetime.utcnow()
    session_chart = []
    for i in range(7, -1, -1):
        week_start = now - timedelta(weeks=i, days=now.weekday())
        week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
        week_end = week_start + timedelta(days=7)

        count = db.query(func.count(Booking.BookingID)).filter(
            Booking.PTID == trainer_id,
            Booking.StartTime >= week_start,
            Booking.StartTime < week_end,
            Booking.Status == "Completed",
        ).scalar() or 0

        session_chart.append({
            "week": f"T{8-i}",
            "done": count,
        })

    activities = []

    assignments = (
        db.query(AssignedExercise)
        .filter(AssignedExercise.PTID == trainer_id)
        .order_by(AssignedExercise.CreatedAt.desc())
        .limit(10)
        .all()
    )
    for a in assignments:
        m = db.query(User).filter(User.UserID == a.MemberID).first()
        activities.append({
            "date": a.CreatedAt.strftime("%d/%m/%Y") if a.CreatedAt else "",
            "action": f"Phân bài tập cho {m.FullName if m else 'Hội viên'}",
            "member": m.FullName if m else "—",
            "result": a.Status or "—",
        })

    requests = (
        db.query(PTRequest)
        .filter(PTRequest.PTID == trainer_id)
        .order_by(PTRequest.CreatedAt.desc())
        .limit(10)
        .all()
    )
    for r in requests:
        m = db.query(User).filter(User.UserID == r.MemberID).first()
        activities.append({
            "date": r.CreatedAt.strftime("%d/%m/%Y") if r.CreatedAt else "",
            "action": f"Yêu cầu từ {m.FullName if m else 'Hội viên'}",
            "member": m.FullName if m else "—",
            "result": r.Status or "—",
        })

    bookings = (
        db.query(Booking)
        .filter(Booking.PTID == trainer_id)
        .order_by(Booking.StartTime.desc())
        .limit(10)
        .all()
    )
    for b in bookings:
        m = db.query(User).filter(User.UserID == b.MemberID).first()
        activities.append({
            "date": b.StartTime.strftime("%d/%m/%Y") if b.StartTime else "",
            "action": f"Buổi tập với {m.FullName if m else 'Hội viên'}",
            "member": m.FullName if m else "—",
            "result": b.Status or "—",
        })

    activities.sort(key=lambda x: x["date"], reverse=True)

    return {
        "sessionChart": session_chart,
        "activities": activities[:20],
    }
