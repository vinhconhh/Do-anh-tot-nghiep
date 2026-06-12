"""
Routes cho module phân bài tập HLV → Member
  /api/pt-assignments
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from datetime import datetime, date
from typing import List, Optional
from pydantic import BaseModel

from ..database import get_db
from ..models.user import User
from ..models.profile import MemberProfile
from ..models.facility import GymExercise, AssignedExercise
from ..models.meal_plan import MealPlan, AssignedMeal
from ..models.member_pt_relation import MemberPTRelation
from ..middleware.auth import get_current_user

router = APIRouter(prefix="/api/pt-assignments", tags=["PT Assignments"])


# ─── Schemas ───
class AssignmentItem(BaseModel):
    exerciseId: int
    sets: int = 3
    reps: int = 12
    duration: Optional[int] = None
    weight: Optional[float] = None
    note: Optional[str] = ""


class BatchAssignBody(BaseModel):
    memberId: int
    assignedDate: str          # "YYYY-MM-DD"
    exercises: List[AssignmentItem]

class MealAssignmentItem(BaseModel):
    mealPlanId: int
    note: Optional[str] = ""

class BatchAssignMealBody(BaseModel):
    memberId: int
    assignedDate: str
    meals: List[MealAssignmentItem]


# ─── Helpers ───
def _get_pt_client_ids(db: Session, pt_id: int) -> set:
    """Lấy danh sách MemberID mà PT này được gán."""
    rows = db.query(MemberPTRelation.MemberID).filter(
        MemberPTRelation.PTID == pt_id,
        MemberPTRelation.Status == "Active",
    ).distinct().all()
    return {r[0] for r in rows}


def _require_pt(current_user: User = Depends(get_current_user)):
    role = current_user.role.RoleCode.upper()
    if role != "PT":
        raise HTTPException(status_code=403, detail="Chỉ HLV mới có quyền thực hiện.")
    return current_user


# ─── Endpoints ───

@router.get("/my-clients")
def my_clients(
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_pt),
):
    """PT: lấy danh sách client đã approved, kèm trình độ."""
    requests = (
        db.query(MemberPTRelation)
        .options(joinedload(MemberPTRelation.member))
        .filter(
            MemberPTRelation.PTID == current_user.UserID,
            MemberPTRelation.Status == "Active",
        )
        .order_by(MemberPTRelation.CreatedAt.desc())
        .all()
    )
    # Deduplicate by MemberID (keep latest)
    seen = set()
    result = []
    for r in requests:
        if r.MemberID in seen:
            continue
        seen.add(r.MemberID)
        m = r.member
        result.append({
            "memberId": r.MemberID,
            "memberName": m.FullName if m else "Unknown",
            "memberEmail": m.Email if m else "",
            "goal": m.member_profile.Goal if (m and m.member_profile) else "",
            "experienceLevel": "new",
            "bodyNote": "",
            "connectedSince": r.CreatedAt.strftime("%d/%m/%Y") if r.CreatedAt else "",
        })
    return result


@router.get("/client/{member_id}/profile")
def client_profile(
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_pt),
):
    """PT: xem thông tin tiến độ tập luyện của 1 client."""
    # Verify ownership
    client_ids = _get_pt_client_ids(db, current_user.UserID)
    if member_id not in client_ids:
        raise HTTPException(status_code=403, detail="Bạn không phải HLV của hội viên này.")

    # Member profile
    profile = db.query(MemberProfile).filter(MemberProfile.UserID == member_id).first()
    # Count completed sessions (from LogWorkouts)
    from ..models.log import LogWorkout
    sessions = db.query(func.count(LogWorkout.LogID)).filter(
        LogWorkout.UserID == member_id
    ).scalar() or 0

    # Count schedules
    from ..models.workout import Schedule
    schedules = db.query(func.count(Schedule.ScheduleID)).filter(
        Schedule.UserID == member_id
    ).scalar() or 0

    # Count assigned exercises completed
    completed = db.query(func.count(AssignedExercise.AssignmentID)).filter(
        AssignedExercise.MemberID == member_id,
        AssignedExercise.PTID == current_user.UserID,
        AssignedExercise.Status == "Completed",
    ).scalar() or 0

    return {
        "memberId": member_id,
        "goal": profile.Goal if profile else "",
        "weight": profile.Weight if profile else 0,
        "height": profile.Height if profile else 0,
        "sessionsCompleted": sessions,
        "totalSchedules": schedules,
        "exercisesCompleted": completed,
        "streak": profile.CurrentStreak if profile else 0,
        "longestStreak": profile.LongestStreak if profile else 0,
        "totalPoints": 0,
    }


@router.get("/client/{member_id}/exercises")
def client_exercises(
    member_id: int,
    assigned_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_pt),
):
    """PT: xem bài tập đã phân cho 1 client."""
    # Verify ownership
    client_ids = _get_pt_client_ids(db, current_user.UserID)
    if member_id not in client_ids:
        raise HTTPException(status_code=403, detail="Bạn không phải HLV của hội viên này.")

    q = db.query(AssignedExercise).options(
        joinedload(AssignedExercise.exercise)
    ).filter(
        AssignedExercise.PTID == current_user.UserID,
        AssignedExercise.MemberID == member_id,
    )
    if assigned_date:
        q = q.filter(AssignedExercise.AssignedDate == assigned_date)

    items = q.order_by(AssignedExercise.CreatedAt.desc()).all()
    return [_format_assignment(a) for a in items]


@router.post("")
def assign_exercises(
    body: BatchAssignBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_pt),
):
    """PT: phân bài tập cho client (batch)."""
    # Verify ownership
    client_ids = _get_pt_client_ids(db, current_user.UserID)
    if body.memberId not in client_ids:
        raise HTTPException(status_code=403, detail="Bạn không phải HLV của hội viên này.")

    try:
        target_date = date.fromisoformat(body.assignedDate)
    except ValueError:
        raise HTTPException(status_code=400, detail="Ngày không hợp lệ. Định dạng: YYYY-MM-DD")

    if not body.exercises:
        raise HTTPException(status_code=400, detail="Danh sách bài tập trống.")

    created = []
    for item in body.exercises:
        # Verify exercise exists
        ex = db.query(GymExercise).filter(
            GymExercise.ExerciseID == item.exerciseId,
            GymExercise.IsDeleted == 0,
        ).first()
        if not ex:
            continue

        assignment = AssignedExercise(
            PTID=current_user.UserID,
            MemberID=body.memberId,
            ExerciseID=item.exerciseId,
            Sets=item.sets,
            Reps=item.reps,
            Duration=item.duration,
            Weight=item.weight,
            Note=item.note,
            MediaURL=None, # Tạm để null, có thể mở rộng schema request sau
            AssignedDate=target_date,
            Status="Active",
        )
        db.add(assignment)
        created.append(assignment)

    db.commit()
    for a in created:
        db.refresh(a)

    return {
        "message": f"Đã phân {len(created)} bài tập thành công!",
        "count": len(created),
    }


@router.delete("/{assignment_id}")
def delete_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_pt),
):
    """PT: xóa bài tập đã phân."""
    obj = db.query(AssignedExercise).filter(
        AssignedExercise.AssignmentID == assignment_id,
        AssignedExercise.PTID == current_user.UserID,
    ).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài tập đã phân.")
    db.delete(obj)
    db.commit()
    return {"message": "Đã xóa bài tập"}

@router.get("/client/{member_id}/meals")
def client_meals(
    member_id: int,
    assigned_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_pt),
):
    """PT: xem thực đơn đã phân cho 1 client."""
    client_ids = _get_pt_client_ids(db, current_user.UserID)
    if member_id not in client_ids:
        raise HTTPException(status_code=403, detail="Bạn không phải HLV của hội viên này.")

    q = db.query(AssignedMeal).options(
        joinedload(AssignedMeal.meal_plan)
    ).filter(
        AssignedMeal.PTID == current_user.UserID,
        AssignedMeal.MemberID == member_id,
    )
    if assigned_date:
        q = q.filter(AssignedMeal.AssignedDate == assigned_date)

    items = q.order_by(AssignedMeal.CreatedAt.desc()).all()
    return [_format_meal_assignment(a) for a in items]

@router.post("/meals")
def assign_meals(
    body: BatchAssignMealBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_pt),
):
    """PT: phân thực đơn cho client (batch)."""
    client_ids = _get_pt_client_ids(db, current_user.UserID)
    if body.memberId not in client_ids:
        raise HTTPException(status_code=403, detail="Bạn không phải HLV của hội viên này.")

    try:
        target_date = date.fromisoformat(body.assignedDate)
        target_datetime = datetime.combine(target_date, datetime.min.time())
    except ValueError:
        raise HTTPException(status_code=400, detail="Ngày không hợp lệ. Định dạng: YYYY-MM-DD")

    if not body.meals:
        raise HTTPException(status_code=400, detail="Danh sách thực đơn trống.")

    created = []
    for item in body.meals:
        mp = db.query(MealPlan).filter(MealPlan.PlanID == item.mealPlanId).first()
        if not mp:
            continue

        assignment = AssignedMeal(
            PTID=current_user.UserID,
            MemberID=body.memberId,
            MealPlanID=item.mealPlanId,
            Note=item.note,
            AssignedDate=target_datetime,
            Status="Active",
        )
        db.add(assignment)
        created.append(assignment)

    db.commit()
    for a in created:
        db.refresh(a)

    return {
        "message": f"Đã phân {len(created)} thực đơn thành công!",
        "count": len(created),
    }

@router.delete("/meals/{assignment_id}")
def delete_meal_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_pt),
):
    """PT: xóa thực đơn đã phân."""
    obj = db.query(AssignedMeal).filter(
        AssignedMeal.AssignmentID == assignment_id,
        AssignedMeal.PTID == current_user.UserID,
    ).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Không tìm thấy thực đơn đã phân.")
    db.delete(obj)
    db.commit()
    return {"message": "Đã xóa thực đơn"}


@router.get("/my-exercises")
def my_exercises(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Member: lấy bài tập được phân cho hôm nay (hoặc Active)."""
    today = date.today()
    items = (
        db.query(AssignedExercise)
        .options(joinedload(AssignedExercise.exercise).joinedload(GymExercise.gym_equipment))
        .filter(
            AssignedExercise.MemberID == current_user.UserID,
            AssignedExercise.AssignedDate == today,
        )
        .order_by(AssignedExercise.CreatedAt.asc())
        .all()
    )
    return [_format_assignment(a, include_video=True) for a in items]


@router.get("/my-meals")
def my_meals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Member: lấy thực đơn được phân cho hôm nay."""
    today = date.today()
    items = (
        db.query(AssignedMeal)
        .options(joinedload(AssignedMeal.meal_plan))
        .filter(
            AssignedMeal.MemberID == current_user.UserID,
            AssignedMeal.AssignedDate == today,
        )
        .order_by(AssignedMeal.CreatedAt.asc())
        .all()
    )
    return [_format_meal_assignment(a) for a in items]


@router.put("/{assignment_id}/complete")
def complete_exercise(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Member: đánh dấu bài tập hoàn thành."""
    obj = db.query(AssignedExercise).filter(
        AssignedExercise.AssignmentID == assignment_id,
        AssignedExercise.MemberID == current_user.UserID,
    ).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài tập.")
    obj.Status = "Completed"
    db.commit()
    return {"message": "Đã hoàn thành bài tập! 💪"}


@router.put("/meals/{assignment_id}/complete")
def complete_meal(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Member: đánh dấu thực đơn hoàn thành."""
    obj = db.query(AssignedMeal).filter(
        AssignedMeal.AssignmentID == assignment_id,
        AssignedMeal.MemberID == current_user.UserID,
    ).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Không tìm thấy thực đơn.")
    obj.Status = "Completed"
    db.commit()
    return {"message": "Đã hoàn thành thực đơn! 🥗"}


# ─── Serializer ───
def _format_assignment(a: AssignedExercise, include_video: bool = False) -> dict:
    ex = a.exercise
    d = {
        "assignmentId": a.AssignmentID,
        "exerciseId": a.ExerciseID,
        "exerciseName": ex.Name if ex else "",
        "assignmentName": ex.AssignmentName if ex else "",
        "type": ex.Type if ex else "",
        "targetMuscle": ex.TargetMuscle if ex else "",
        "sets": a.Sets,
        "reps": a.Reps,
        "duration": a.Duration,
        "weight": a.Weight,
        "note": a.Note,
        "mediaURL": a.MediaURL,
        "assignedDate": a.AssignedDate.isoformat() if a.AssignedDate else "",
        "status": a.Status,
    }
    if include_video and ex:
        d["videoURL"] = ex.VideoURL
        d["equipmentName"] = ex.gym_equipment.Name if ex.gym_equipment else None
    return d

def _format_meal_assignment(a: AssignedMeal) -> dict:
    mp = a.meal_plan
    return {
        "assignmentId": a.AssignmentID,
        "mealPlanId": a.MealPlanID,
        "mealPlanName": mp.Name if mp else "",
        "category": mp.Category if mp else "",
        "calories": mp.Calories if mp else 0,
        "note": a.Note,
        "assignedDate": a.AssignedDate.isoformat() if a.AssignedDate else "",
        "status": a.Status,
    }


# ─── Training Progress (PT views student check-ins) ───

@router.get("/training-progress")
def training_progress(
    member_id: Optional[int] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_pt),
):
    """PT: xem tiến độ tập luyện của tất cả học viên dựa trên check-in."""
    try:
        from ..models.streak import CheckInLog
    except ImportError:
        return []

    client_ids = _get_pt_client_ids(db, current_user.UserID)
    if not client_ids:
        return []

    try:
        q = (
            db.query(CheckInLog)
            .filter(CheckInLog.PTID == current_user.UserID)
            .order_by(CheckInLog.CheckInDate.desc())
        )

        if member_id:
            if member_id not in client_ids:
                raise HTTPException(status_code=403, detail="Bạn không phải HLV của hội viên này.")
            q = q.filter(CheckInLog.UserID == member_id)

        if date_from:
            try:
                q = q.filter(CheckInLog.CheckInDate >= date.fromisoformat(date_from))
            except ValueError:
                pass
        if date_to:
            try:
                q = q.filter(CheckInLog.CheckInDate <= date.fromisoformat(date_to))
            except ValueError:
                pass

        checkins = q.limit(200).all()
    except Exception:
        return []

    result = []
    for c in checkins:
        member = db.query(User).filter(User.UserID == c.UserID).first()

        day_exercises = (
            db.query(AssignedExercise)
            .options(joinedload(AssignedExercise.exercise))
            .filter(
                AssignedExercise.MemberID == c.UserID,
                AssignedExercise.PTID == current_user.UserID,
                AssignedExercise.AssignedDate == c.CheckInDate,
                AssignedExercise.Status == "Completed",
            )
            .all()
        )

        exercises_detail = []
        for ex_a in day_exercises:
            ex = ex_a.exercise
            exercises_detail.append({
                "exerciseName": ex.Name if ex else "",
                "assignmentName": ex.AssignmentName if ex else "",
                "sets": ex_a.Sets,
                "reps": ex_a.Reps,
                "weight": ex_a.Weight,
                "targetMuscle": ex.TargetMuscle if ex else "",
            })

        result.append({
            "logId": c.LogID,
            "memberId": c.UserID,
            "memberName": member.FullName if member else "Unknown",
            "checkInDate": c.CheckInDate.isoformat() if c.CheckInDate else "",
            "exercisesCompleted": c.ExercisesCompleted or 0,
            "totalSets": c.TotalSets or 0,
            "rpe": c.RPE,
            "streakDay": c.StreakDay or 0,
            "points": c.Points or 0,
            "exercises": exercises_detail,
        })

    return result


@router.get("/training-progress/summary")
def training_progress_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_pt),
):
    """PT: tổng hợp tiến độ tập luyện của tất cả học viên."""
    try:
        from ..models.streak import CheckInLog
    except ImportError:
        return {"totalCheckins": 0, "weekCheckins": 0, "avgRPE": 0, "totalClients": 0, "activeClients": 0, "topStudents": []}
    from datetime import timedelta

    client_ids = _get_pt_client_ids(db, current_user.UserID)
    if not client_ids:
        return {
            "totalCheckins": 0,
            "weekCheckins": 0,
            "avgRPE": 0,
            "totalClients": 0,
            "activeClients": 0,
            "topStudents": [],
        }

    try:
        all_checkins = db.query(CheckInLog).filter(
            CheckInLog.PTID == current_user.UserID
        ).all()
    except Exception:
        all_checkins = []

    total_checkins = len(all_checkins)

    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    week_checkins = len([c for c in all_checkins if c.CheckInDate and c.CheckInDate >= week_start])

    rpe_values = [c.RPE for c in all_checkins if c.RPE is not None]
    avg_rpe = round(sum(rpe_values) / len(rpe_values), 1) if rpe_values else 0

    active_user_ids = set(c.UserID for c in all_checkins if c.CheckInDate and c.CheckInDate >= week_start)

    from collections import Counter
    student_counts = Counter(c.UserID for c in all_checkins)
    top_ids = student_counts.most_common(5)
    top_students = []
    for uid, count in top_ids:
        u = db.query(User).filter(User.UserID == uid).first()
        top_students.append({
            "memberId": uid,
            "memberName": u.FullName if u else "Unknown",
            "totalCheckins": count,
        })

    return {
        "totalCheckins": total_checkins,
        "weekCheckins": week_checkins,
        "avgRPE": avg_rpe,
        "totalClients": len(client_ids),
        "activeClients": len(active_user_ids),
        "topStudents": top_students,
    }

