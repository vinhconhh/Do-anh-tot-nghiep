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
from ..models.pt_request import PTRequest
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


# ─── Helpers ───
def _get_pt_client_ids(db: Session, pt_id: int) -> set:
    """Lấy danh sách MemberID mà PT này đã Approved."""
    rows = db.query(PTRequest.MemberID).filter(
        PTRequest.PTID == pt_id,
        PTRequest.Status == "Approved",
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
        db.query(PTRequest)
        .options(joinedload(PTRequest.member))
        .filter(
            PTRequest.PTID == current_user.UserID,
            PTRequest.Status == "Approved",
        )
        .order_by(PTRequest.CreatedAt.desc())
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
            "goal": r.MemberGoal or "",
            "experienceLevel": r.ExperienceLevel or "new",
            "bodyNote": r.BodyNote or "",
            "connectedSince": r.RespondedAt.strftime("%d/%m/%Y") if r.RespondedAt else "",
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
        "assignedDate": a.AssignedDate.isoformat() if a.AssignedDate else "",
        "status": a.Status,
    }
    if include_video and ex:
        d["videoURL"] = ex.VideoURL
        d["equipmentName"] = ex.gym_equipment.Name if ex.gym_equipment else None
    return d


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

