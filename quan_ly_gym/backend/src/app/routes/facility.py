"""
Routes / Controller cho 3 module:
  - Equipment        → /api/equipment
  - Exercise         → /api/gym-exercises
  - GymClass         → /api/classes  (with enrollment, PT sync, recurring & conflict check)
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func, and_
from typing import Optional, List
from datetime import datetime, date, timedelta, time as dt_time
import math

from ..database import get_db
from ..models.facility import GymEquipment, GymExercise, GymClass, ClassEnrollment, INTENSITY_MIN_GAP
from ..models.user import User, Role
from ..models.profile import PTProfile
from ..middleware.auth import get_current_user
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api", tags=["Facility"])


# ──────────────────────────────────────────
# Guards
# ──────────────────────────────────────────
def require_admin(current_user: User = Depends(get_current_user)):
    role = current_user.role.RoleCode.upper()
    if role not in ["ADMIN", "MANAGER"]:
        raise HTTPException(status_code=403, detail="Không có quyền thực hiện thao tác này.")
    return current_user


# ──────────────────────────────────────────
# Schemas (inline Pydantic)
# ──────────────────────────────────────────
class EquipmentCreate(BaseModel):
    Name:     str
    Category: Optional[str] = None
    Zone:     Optional[str] = None
    Quantity: Optional[int] = Field(default=1, ge=0)
    Status:   Optional[str] = "Hoạt động"

class EquipmentUpdate(BaseModel):
    Name:     Optional[str] = None
    Category: Optional[str] = None
    Zone:     Optional[str] = None
    Quantity: Optional[int] = Field(default=None, ge=0)
    Status:   Optional[str] = None


class ExerciseCreate(BaseModel):
    Name:         str
    AssignmentName: Optional[str] = None
    Type:         Optional[str] = None
    TargetMuscle: Optional[str] = None
    MetValue:     Optional[float] = 0.0
    EquipmentID:  Optional[int] = None
    VideoURL:     Optional[str] = None

class ExerciseUpdate(BaseModel):
    Name:         Optional[str] = None
    AssignmentName: Optional[str] = None
    Type:         Optional[str] = None
    TargetMuscle: Optional[str] = None
    MetValue:     Optional[float] = None
    EquipmentID:  Optional[int] = None
    VideoURL:     Optional[str] = None


class GymClassCreate(BaseModel):
    Name:           str
    InstructorID:   Optional[int] = None
    InstructorName: Optional[str] = None   # fallback nếu không chọn PT
    StudioRoom:     Optional[str] = None
    MaxCapacity:    Optional[int] = Field(default=20, ge=1)
    StartTime:      Optional[datetime] = None      # required for single class
    EndTime:        Optional[datetime] = None       # required for single class
    Intensity:      Optional[str] = "medium"        # "high", "medium", "low"
    # Recurring fields
    IsRecurring:        Optional[int] = 0
    RecurringDays:      Optional[str] = None        # "0,2,4" = Mon,Wed,Fri
    RecurringStartDate: Optional[date] = None
    RecurringEndDate:   Optional[date] = None
    TimeStart:          Optional[str] = None        # "08:00" for recurring
    TimeEnd:            Optional[str] = None        # "09:30" for recurring

class GymClassUpdate(BaseModel):
    Name:           Optional[str] = None
    InstructorID:   Optional[int] = None
    InstructorName: Optional[str] = None
    StudioRoom:     Optional[str] = None
    MaxCapacity:    Optional[int] = Field(default=None, ge=1)
    StartTime:      Optional[datetime] = None
    EndTime:        Optional[datetime] = None
    Intensity:      Optional[str] = None

class AddSessionPayload(BaseModel):
    """Thêm 1 buổi riêng lẻ vào lớp lặp lại."""
    SessionDate:    date
    TimeStart:      str              # "08:00"
    TimeEnd:        str              # "09:30"


# ──────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────
def _class_dict(c: GymClass, current_user_id: int = None, enrolled_ids: set = None) -> dict:
    instructor = c.instructor
    name = (instructor.FullName if instructor else None) or c.InstructorName or "Chưa phân công"
    pt_profile = instructor.pt_profile if instructor and hasattr(instructor, 'pt_profile') else None
    return {
        "ClassID":         c.ClassID,
        "Name":            c.Name,
        "InstructorID":    c.InstructorID,
        "InstructorName":  name,
        "InstructorSpecialty": pt_profile.Specialty if pt_profile else None,
        "StudioRoom":      c.StudioRoom,
        "MaxCapacity":     c.MaxCapacity,
        "CurrentEnrolled": c.CurrentEnrolled,
        "AvailableSlots":  max(0, (c.MaxCapacity or 0) - (c.CurrentEnrolled or 0)),
        "StartTime":       c.StartTime.isoformat() if c.StartTime else None,
        "EndTime":         c.EndTime.isoformat() if c.EndTime else None,
        "Intensity":       c.Intensity or "medium",
        "IsRecurring":     c.IsRecurring or 0,
        "RecurringDays":   c.RecurringDays,
        "ParentClassID":   c.ParentClassID,
        "IsEnrolled":      (current_user_id in enrolled_ids) if enrolled_ids is not None else None,
    }


def _parse_time(t_str: str) -> dt_time:
    """Parse 'HH:MM' string to time object."""
    parts = t_str.strip().split(":")
    return dt_time(int(parts[0]), int(parts[1]))


def _check_instructor_conflicts(
    db: Session,
    instructor_id: int,
    sessions: list,           # [{"start": datetime, "end": datetime}]
    intensity: str,
    exclude_class_id: int = None,
) -> list:
    """
    Check if an instructor has schedule conflicts or insufficient rest gaps.
    Returns list of conflict dicts: {"type": "overlap"|"gap", "session": ..., "existing": ..., "detail": ...}
    """
    if not instructor_id or not sessions:
        return []

    conflicts = []
    new_gap = INTENSITY_MIN_GAP.get(intensity, 20)

    for sess in sessions:
        sess_date = sess["start"].date()
        day_start = datetime.combine(sess_date, dt_time.min)
        day_end = day_start + timedelta(days=1)

        # Get all non-deleted classes for this instructor on this date
        q = db.query(GymClass).filter(
            GymClass.InstructorID == instructor_id,
            GymClass.IsDeleted == 0,
            GymClass.StartTime >= day_start,
            GymClass.StartTime < day_end,
        )
        if exclude_class_id:
            q = q.filter(GymClass.ClassID != exclude_class_id)
        existing_classes = q.order_by(GymClass.StartTime).all()

        for ex in existing_classes:
            ex_start = ex.StartTime
            ex_end = ex.EndTime
            new_start = sess["start"]
            new_end = sess["end"]

            # Direct time overlap check
            if new_start < ex_end and new_end > ex_start:
                conflicts.append({
                    "type": "overlap",
                    "session_start": new_start.isoformat(),
                    "session_end": new_end.isoformat(),
                    "existing_class": ex.Name,
                    "existing_start": ex_start.isoformat(),
                    "existing_end": ex_end.isoformat(),
                    "detail": f"Trùng giờ với lớp '{ex.Name}' ({ex_start.strftime('%H:%M')}–{ex_end.strftime('%H:%M')})",
                })
                continue

            # Rest gap check — use the higher intensity gap
            ex_gap = INTENSITY_MIN_GAP.get(ex.Intensity or "medium", 20)
            required_gap = max(new_gap, ex_gap)

            # New class is AFTER existing
            if new_start >= ex_end:
                actual_gap = (new_start - ex_end).total_seconds() / 60
                if actual_gap < required_gap:
                    conflicts.append({
                        "type": "gap",
                        "session_start": new_start.isoformat(),
                        "session_end": new_end.isoformat(),
                        "existing_class": ex.Name,
                        "existing_start": ex_start.isoformat(),
                        "existing_end": ex_end.isoformat(),
                        "detail": f"Quãng nghỉ chỉ {int(actual_gap)} phút sau lớp '{ex.Name}' (cần tối thiểu {required_gap} phút)",
                    })
            # New class is BEFORE existing
            elif new_end <= ex_start:
                actual_gap = (ex_start - new_end).total_seconds() / 60
                if actual_gap < required_gap:
                    conflicts.append({
                        "type": "gap",
                        "session_start": new_start.isoformat(),
                        "session_end": new_end.isoformat(),
                        "existing_class": ex.Name,
                        "existing_start": ex_start.isoformat(),
                        "existing_end": ex_end.isoformat(),
                        "detail": f"Quãng nghỉ chỉ {int(actual_gap)} phút trước lớp '{ex.Name}' (cần tối thiểu {required_gap} phút)",
                    })

    return conflicts


# ══════════════════════════════════════════════════════════════
# EQUIPMENT  /api/equipment
# ══════════════════════════════════════════════════════════════

@router.get("/equipment")
def list_equipment(
    category: Optional[str] = Query(None),
    status:   Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(GymEquipment)
    if category: q = q.filter(GymEquipment.Category == category)
    if status:   q = q.filter(GymEquipment.Status   == status)
    return q.order_by(GymEquipment.Name).all()


@router.get("/equipment/{equipment_id}")
def get_equipment(equipment_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    obj = db.query(GymEquipment).filter(GymEquipment.EquipmentID == equipment_id).first()
    if not obj: raise HTTPException(status_code=404, detail="Không tìm thấy thiết bị.")
    return obj


@router.post("/equipment", status_code=status.HTTP_201_CREATED)
def create_equipment(payload: EquipmentCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    obj = GymEquipment(**payload.model_dump())
    db.add(obj); db.commit(); db.refresh(obj)
    return obj


@router.put("/equipment/{equipment_id}")
def update_equipment(equipment_id: int, payload: EquipmentUpdate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    obj = db.query(GymEquipment).filter(GymEquipment.EquipmentID == equipment_id).first()
    if not obj: raise HTTPException(status_code=404, detail="Không tìm thấy thiết bị.")
    for k, v in payload.model_dump(exclude_unset=True).items(): setattr(obj, k, v)
    obj.UpdatedAt = datetime.utcnow(); db.commit(); db.refresh(obj)
    return obj


@router.delete("/equipment/{equipment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_equipment(equipment_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    obj = db.query(GymEquipment).filter(GymEquipment.EquipmentID == equipment_id).first()
    if not obj: raise HTTPException(status_code=404, detail="Không tìm thấy thiết bị.")
    db.delete(obj); db.commit()


# ══════════════════════════════════════════════════════════════
# GYM EXERCISES  /api/gym-exercises
# ══════════════════════════════════════════════════════════════

@router.get("/gym-exercises")
def list_exercises(
    search:        Optional[str] = Query(None),
    target_muscle: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    # Fix N+1 query with joinedload or explicitly querying equipment
    from sqlalchemy.orm import joinedload
    q = db.query(GymExercise).options(joinedload(GymExercise.gym_equipment)).filter(GymExercise.IsDeleted == 0)
    
    if search:
        like = f"%{search}%"
        q = q.filter(or_(GymExercise.Name.ilike(like), GymExercise.AssignmentName.ilike(like)))
    if target_muscle:
        q = q.filter(GymExercise.TargetMuscle.ilike(f"%{target_muscle}%"))
        
    total = q.count()
    items = q.order_by(GymExercise.Name).offset((page - 1) * size).limit(size).all()
    
    result = []
    for ex in items:
        result.append({
            "ExerciseID": ex.ExerciseID,
            "Name": ex.Name,
            "AssignmentName": ex.AssignmentName,
            "Type": ex.Type,
            "TargetMuscle": ex.TargetMuscle,
            "MetValue": ex.MetValue,
            "EquipmentID": ex.EquipmentID,
            "VideoURL": ex.VideoURL,
            "IsDeleted": ex.IsDeleted,
            "EquipmentName": ex.gym_equipment.Name if ex.gym_equipment else None
        })
    return {"total": total, "page": page, "size": size, "pages": math.ceil(total / size) if total else 1, "items": result}


@router.get("/gym-exercises/{exercise_id}")
def get_exercise(exercise_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    obj = db.query(GymExercise).filter(GymExercise.ExerciseID == exercise_id, GymExercise.IsDeleted == 0).first()
    if not obj: raise HTTPException(status_code=404, detail="Không tìm thấy bài tập.")
    d = {c.name: getattr(obj, c.name) for c in obj.__table__.columns}
    d["EquipmentName"] = obj.gym_equipment.Name if obj.gym_equipment else None
    d["VideoURL"] = obj.VideoURL
    return d


@router.post("/gym-exercises", status_code=status.HTTP_201_CREATED)
def create_exercise(payload: ExerciseCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    obj = GymExercise(**payload.model_dump()); db.add(obj); db.commit(); db.refresh(obj)
    d = {c.name: getattr(obj, c.name) for c in obj.__table__.columns}
    d["EquipmentName"] = obj.gym_equipment.Name if obj.gym_equipment else None
    return d


@router.put("/gym-exercises/{exercise_id}")
def update_exercise(exercise_id: int, payload: ExerciseUpdate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    obj = db.query(GymExercise).filter(GymExercise.ExerciseID == exercise_id, GymExercise.IsDeleted == 0).first()
    if not obj: raise HTTPException(status_code=404, detail="Không tìm thấy bài tập.")
    for k, v in payload.model_dump(exclude_unset=True).items(): setattr(obj, k, v)
    obj.UpdatedAt = datetime.utcnow(); db.commit(); db.refresh(obj)
    d = {c.name: getattr(obj, c.name) for c in obj.__table__.columns}
    d["EquipmentName"] = obj.gym_equipment.Name if obj.gym_equipment else None
    return d


@router.delete("/gym-exercises/{exercise_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exercise(exercise_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    obj = db.query(GymExercise).filter(GymExercise.ExerciseID == exercise_id, GymExercise.IsDeleted == 0).first()
    if not obj: raise HTTPException(status_code=404, detail="Không tìm thấy bài tập.")
    obj.IsDeleted = 1; db.commit()


# ══════════════════════════════════════════════════════════════
# GYM CLASSES  /api/classes
# ══════════════════════════════════════════════════════════════

def _get_enrolled_ids(db: Session, user_id: int) -> set:
    rows = db.query(ClassEnrollment.ClassID).filter(
        ClassEnrollment.MemberID == user_id,
        ClassEnrollment.Status == "Active",
    ).all()
    return {r[0] for r in rows}


@router.get("/classes")
def list_classes(
    date_filter: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target_date = date_filter or datetime.utcnow().date()
    day_start = datetime.combine(target_date, datetime.min.time())
    day_end   = day_start + timedelta(days=1)
    classes = (
        db.query(GymClass)
        .filter(GymClass.IsDeleted == 0, GymClass.StartTime >= day_start, GymClass.StartTime < day_end)
        .order_by(GymClass.StartTime)
        .all()
    )
    enrolled_ids = _get_enrolled_ids(db, current_user.UserID)
    return [_class_dict(c, current_user.UserID, enrolled_ids) for c in classes]


@router.get("/classes/all")
def list_all_classes(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    classes = db.query(GymClass).filter(GymClass.IsDeleted == 0).order_by(GymClass.StartTime.desc()).all()
    return [_class_dict(c) for c in classes]


@router.get("/classes/my-teaching")
def my_teaching_classes(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """PT: danh sách lớp tôi đang phụ trách."""
    classes = (
        db.query(GymClass)
        .filter(GymClass.InstructorID == current_user.UserID, GymClass.IsDeleted == 0)
        .order_by(GymClass.StartTime)
        .all()
    )
    result = []
    for c in classes:
        d = _class_dict(c)
        d["enrolledCount"] = db.query(func.count(ClassEnrollment.EnrollID)).filter(
            ClassEnrollment.ClassID == c.ClassID, ClassEnrollment.Status == "Active"
        ).scalar() or 0
        result.append(d)
    return result


# ─── Helper: danh sách PT cho dropdown (MUST be before {class_id}) ────
@router.get("/classes/available-instructors")
def available_instructors(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    """Admin: PT list dùng cho dropdown chọn HLV lớp học — lấy từ bảng Users + PTProfiles."""
    from sqlalchemy.orm import joinedload
    pt_role = db.query(Role).filter(Role.RoleCode == "PT").first()
    if not pt_role: return []
    pts = (
        db.query(User)
        .options(joinedload(User.pt_profile))
        .filter(User.RoleID == pt_role.RoleID, User.IsDeleted == 0, User.IsActive == 1)
        .all()
    )
    result = []
    for p in pts:
        prof = p.pt_profile
        result.append({
            "UserID":          p.UserID,
            "FullName":        p.FullName,
            "Email":           p.Email,
            "Specialty":       prof.Specialty if prof else "",
            "Certifications":  prof.Certifications if prof else "",
            "ExperienceYears": prof.ExperienceYears if prof else 0,
            "Score":           float(prof.TotalScore) if prof and prof.TotalScore else 100,
        })
    return sorted(result, key=lambda x: x["Score"], reverse=True)


@router.get("/classes/member/my-enrollments")
def my_enrollments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Member: lớp tôi đã đăng ký."""
    rows = (
        db.query(ClassEnrollment)
        .filter(ClassEnrollment.MemberID == current_user.UserID, ClassEnrollment.Status == "Active")
        .all()
    )
    result = []
    for e in rows:
        c = e.gym_class
        if c and not c.IsDeleted:
            d = _class_dict(c)
            d["EnrolledAt"] = e.EnrolledAt.strftime("%d/%m/%Y %H:%M") if e.EnrolledAt else "—"
            result.append(d)
    return result


# ─── Schedule events for ScheduleWeek calendar ────
@router.get("/classes/schedule-events")
def schedule_events(
    user_id: Optional[int] = Query(None),
    week_start: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return class events in ScheduleWeek format for PT or Member calendars."""
    target_id = user_id or current_user.UserID
    ws = week_start or date.today()
    # Ensure Monday start
    ws = ws - timedelta(days=ws.weekday())
    we = ws + timedelta(days=7)
    day_start = datetime.combine(ws, dt_time.min)
    day_end = datetime.combine(we, dt_time.min)

    events = []
    # Classes where user is instructor (PT)
    pt_classes = db.query(GymClass).filter(
        GymClass.InstructorID == target_id,
        GymClass.IsDeleted == 0,
        GymClass.StartTime >= day_start,
        GymClass.StartTime < day_end,
    ).order_by(GymClass.StartTime).all()

    for c in pt_classes:
        events.append({
            "id": f"teach_{c.ClassID}",
            "start": c.StartTime.isoformat(),
            "end": c.EndTime.isoformat(),
            "title": f"{c.Name} — {c.StudioRoom or 'TBD'}",
            "meta": f"Ca dạy · {c.CurrentEnrolled or 0}/{c.MaxCapacity} HV",
            "color": "green",
        })

    # Classes where user is enrolled (Member)
    enrolled_ids = db.query(ClassEnrollment.ClassID).filter(
        ClassEnrollment.MemberID == target_id,
        ClassEnrollment.Status == "Active",
    ).all()
    enrolled_set = {r[0] for r in enrolled_ids}
    if enrolled_set:
        member_classes = db.query(GymClass).filter(
            GymClass.ClassID.in_(enrolled_set),
            GymClass.IsDeleted == 0,
            GymClass.StartTime >= day_start,
            GymClass.StartTime < day_end,
        ).order_by(GymClass.StartTime).all()
        for c in member_classes:
            events.append({
                "id": f"enroll_{c.ClassID}",
                "start": c.StartTime.isoformat(),
                "end": c.EndTime.isoformat(),
                "title": f"{c.Name}",
                "meta": f"Lớp học · {c.StudioRoom or ''}",
                "color": "blue",
            })

    return events


# ─── Check conflicts preview ────
@router.post("/classes/check-conflicts")
def check_conflicts_preview(
    payload: GymClassCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Preview conflict check without creating anything."""
    if not payload.InstructorID:
        return {"conflicts": [], "sessions_count": 0}

    intensity = payload.Intensity or "medium"
    sessions = []

    if payload.IsRecurring and payload.RecurringDays and payload.RecurringStartDate and payload.RecurringEndDate:
        if not payload.TimeStart or not payload.TimeEnd:
            return {"conflicts": [], "sessions_count": 0}
        t_start = _parse_time(payload.TimeStart)
        t_end = _parse_time(payload.TimeEnd)
        day_indices = [int(d) for d in payload.RecurringDays.split(",") if d.strip().isdigit()]
        cur = payload.RecurringStartDate
        while cur <= payload.RecurringEndDate:
            if cur.weekday() in day_indices:
                sessions.append({"start": datetime.combine(cur, t_start), "end": datetime.combine(cur, t_end)})
            cur += timedelta(days=1)
    elif payload.StartTime and payload.EndTime:
        sessions = [{"start": payload.StartTime, "end": payload.EndTime}]

    conflicts = _check_instructor_conflicts(db, payload.InstructorID, sessions, intensity)
    return {"conflicts": conflicts, "sessions_count": len(sessions)}


# ─── Parameterized routes AFTER all static routes ────

@router.get("/classes/{class_id}")
def get_class(class_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    obj = db.query(GymClass).filter(GymClass.ClassID == class_id, GymClass.IsDeleted == 0).first()
    if not obj: raise HTTPException(status_code=404, detail="Không tìm thấy lớp học.")
    enrolled_ids = _get_enrolled_ids(db, current_user.UserID)
    return _class_dict(obj, current_user.UserID, enrolled_ids)


@router.get("/classes/{class_id}/members")
def get_class_members(class_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """Admin/PT: danh sách hội viên đã đăng ký lớp."""
    enrollments = (
        db.query(ClassEnrollment)
        .filter(ClassEnrollment.ClassID == class_id, ClassEnrollment.Status == "Active")
        .all()
    )
    result = []
    for e in enrollments:
        m = e.member
        result.append({
            "EnrollID":   e.EnrollID,
            "MemberID":   e.MemberID,
            "FullName":   m.FullName if m else "—",
            "Email":      m.Email if m else "—",
            "EnrolledAt": e.EnrolledAt.strftime("%d/%m/%Y %H:%M") if e.EnrolledAt else "—",
            "Status":     e.Status,
        })
    return result


@router.post("/classes/{class_id}/add-session", status_code=status.HTTP_201_CREATED)
def add_session_to_class(
    class_id: int,
    payload: AddSessionPayload,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Thêm 1 buổi riêng lẻ vào lớp lặp lại (có kiểm tra xung đột)."""
    parent = db.query(GymClass).filter(GymClass.ClassID == class_id, GymClass.IsDeleted == 0).first()
    if not parent:
        raise HTTPException(404, "Không tìm thấy lớp học.")

    t_start = _parse_time(payload.TimeStart)
    t_end = _parse_time(payload.TimeEnd)
    if t_end <= t_start:
        raise HTTPException(400, "Giờ kết thúc phải sau giờ bắt đầu.")

    sess_start = datetime.combine(payload.SessionDate, t_start)
    sess_end = datetime.combine(payload.SessionDate, t_end)

    # Conflict check
    if parent.InstructorID:
        conflicts = _check_instructor_conflicts(
            db, parent.InstructorID,
            [{"start": sess_start, "end": sess_end}],
            parent.Intensity or "medium",
        )
        if conflicts:
            return {"created": 0, "conflicts": conflicts, "message": "Phát hiện xung đột lịch HLV!"}

    child = GymClass(
        Name=parent.Name, InstructorID=parent.InstructorID, InstructorName=parent.InstructorName,
        StudioRoom=parent.StudioRoom, MaxCapacity=parent.MaxCapacity,
        StartTime=sess_start, EndTime=sess_end, Intensity=parent.Intensity,
        ParentClassID=class_id,
    )
    db.add(child)
    db.commit()
    db.refresh(child)
    return {"created": 1, "session": _class_dict(child), "conflicts": [], "message": "Đã thêm buổi học."}


@router.post("/classes", status_code=status.HTTP_201_CREATED)
def create_class(payload: GymClassCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    intensity = payload.Intensity or "medium"
    instructor_name = payload.InstructorName
    if payload.InstructorID:
        pt = db.query(User).filter(User.UserID == payload.InstructorID).first()
        if pt:
            instructor_name = pt.FullName

    # ── RECURRING ──
    if payload.IsRecurring and payload.RecurringDays and payload.RecurringStartDate and payload.RecurringEndDate:
        if payload.RecurringEndDate < payload.RecurringStartDate:
            raise HTTPException(400, "Ngày kết thúc phải sau ngày bắt đầu.")
        if not payload.TimeStart or not payload.TimeEnd:
            raise HTTPException(400, "Cần chọn giờ bắt đầu và kết thúc cho lớp lặp lại.")

        t_start = _parse_time(payload.TimeStart)
        t_end = _parse_time(payload.TimeEnd)
        if t_end <= t_start:
            raise HTTPException(400, "Giờ kết thúc phải sau giờ bắt đầu.")

        day_indices = [int(d) for d in payload.RecurringDays.split(",") if d.strip().isdigit()]
        # Build all sessions
        sessions = []
        cur = payload.RecurringStartDate
        while cur <= payload.RecurringEndDate:
            if cur.weekday() in day_indices:
                s = datetime.combine(cur, t_start)
                e = datetime.combine(cur, t_end)
                sessions.append({"start": s, "end": e})
            cur += timedelta(days=1)

        if not sessions:
            raise HTTPException(400, "Không có buổi nào khớp với ngày đã chọn.")

        # Conflict check
        if payload.InstructorID:
            conflicts = _check_instructor_conflicts(db, payload.InstructorID, sessions, intensity)
            if conflicts:
                return {"created": 0, "conflicts": conflicts, "message": "Phát hiện xung đột lịch HLV!"}

        # Create parent
        first_s = sessions[0]
        parent = GymClass(
            Name=payload.Name, InstructorID=payload.InstructorID, InstructorName=instructor_name,
            StudioRoom=payload.StudioRoom, MaxCapacity=payload.MaxCapacity or 20,
            StartTime=first_s["start"], EndTime=first_s["end"], Intensity=intensity,
            IsRecurring=1, RecurringDays=payload.RecurringDays,
            RecurringStartDate=payload.RecurringStartDate, RecurringEndDate=payload.RecurringEndDate,
        )
        db.add(parent)
        db.flush()

        # Create child instances
        created_children = []
        for sess in sessions:
            child = GymClass(
                Name=payload.Name, InstructorID=payload.InstructorID, InstructorName=instructor_name,
                StudioRoom=payload.StudioRoom, MaxCapacity=payload.MaxCapacity or 20,
                StartTime=sess["start"], EndTime=sess["end"], Intensity=intensity,
                ParentClassID=parent.ClassID,
            )
            db.add(child)
            created_children.append(child)

        db.commit()
        db.refresh(parent)
        return {
            "created": len(created_children),
            "parent": _class_dict(parent),
            "conflicts": [],
            "message": f"Đã tạo {len(created_children)} buổi học từ {payload.RecurringStartDate} đến {payload.RecurringEndDate}.",
        }

    # ── SINGLE CLASS ──
    if not payload.StartTime or not payload.EndTime:
        raise HTTPException(400, "Cần chọn thời gian bắt đầu và kết thúc.")
    if payload.EndTime <= payload.StartTime:
        raise HTTPException(400, "EndTime phải sau StartTime.")

    # Conflict check
    if payload.InstructorID:
        conflicts = _check_instructor_conflicts(
            db, payload.InstructorID,
            [{"start": payload.StartTime, "end": payload.EndTime}],
            intensity,
        )
        if conflicts:
            return {"created": 0, "conflicts": conflicts, "message": "Phát hiện xung đột lịch HLV!"}

    obj = GymClass(
        Name=payload.Name, InstructorID=payload.InstructorID, InstructorName=instructor_name,
        StudioRoom=payload.StudioRoom, MaxCapacity=payload.MaxCapacity or 20,
        StartTime=payload.StartTime, EndTime=payload.EndTime, Intensity=intensity,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return {"created": 1, "parent": _class_dict(obj), "conflicts": [], "message": "Đã tạo lớp học."}


@router.put("/classes/{class_id}")
def update_class(class_id: int, payload: GymClassUpdate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    obj = db.query(GymClass).filter(GymClass.ClassID == class_id, GymClass.IsDeleted == 0).first()
    if not obj: raise HTTPException(status_code=404, detail="Không tìm thấy lớp học.")
    data = payload.model_dump(exclude_unset=True)
    if "InstructorID" in data and data["InstructorID"]:
        pt = db.query(User).filter(User.UserID == data["InstructorID"]).first()
        if pt: data["InstructorName"] = pt.FullName
    for k, v in data.items(): setattr(obj, k, v)
    obj.UpdatedAt = datetime.utcnow()
    if obj.EndTime and obj.StartTime and obj.EndTime <= obj.StartTime:
        raise HTTPException(status_code=400, detail="EndTime phải sau StartTime.")
    # Conflict check after applying changes
    if obj.InstructorID and obj.StartTime and obj.EndTime:
        conflicts = _check_instructor_conflicts(
            db, obj.InstructorID,
            [{"start": obj.StartTime, "end": obj.EndTime}],
            obj.Intensity or "medium",
            exclude_class_id=obj.ClassID,
        )
        if conflicts:
            db.rollback()
            return {"updated": False, "conflicts": conflicts, "message": "Phát hiện xung đột lịch HLV!"}
    db.commit(); db.refresh(obj)
    return _class_dict(obj)


@router.delete("/classes/{class_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_class(
    class_id: int,
    delete_all: bool = Query(False, description="True = xóa parent + tất cả instances"),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    obj = db.query(GymClass).filter(GymClass.ClassID == class_id, GymClass.IsDeleted == 0).first()
    if not obj: raise HTTPException(status_code=404, detail="Không tìm thấy lớp học.")
    obj.IsDeleted = 1
    if delete_all:
        # If this is a parent, delete all children
        if obj.IsRecurring:
            db.query(GymClass).filter(
                GymClass.ParentClassID == class_id, GymClass.IsDeleted == 0
            ).update({"IsDeleted": 1})
        # If this is a child, delete parent + all siblings
        elif obj.ParentClassID:
            parent = db.query(GymClass).filter(GymClass.ClassID == obj.ParentClassID).first()
            if parent: parent.IsDeleted = 1
            db.query(GymClass).filter(
                GymClass.ParentClassID == obj.ParentClassID, GymClass.IsDeleted == 0
            ).update({"IsDeleted": 1})
    db.commit()


@router.post("/classes/{class_id}/enroll")
def enroll_class(class_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Member: đăng ký tham gia lớp học."""
    obj = db.query(GymClass).filter(GymClass.ClassID == class_id, GymClass.IsDeleted == 0).first()
    if not obj: raise HTTPException(status_code=404, detail="Không tìm thấy lớp học.")
    if obj.CurrentEnrolled >= (obj.MaxCapacity or 1):
        raise HTTPException(status_code=409, detail="Lớp học đã đầy chỗ.")
    # Check trùng lặp
    existing = db.query(ClassEnrollment).filter(
        ClassEnrollment.ClassID == class_id,
        ClassEnrollment.MemberID == current_user.UserID,
        ClassEnrollment.Status == "Active",
    ).first()
    if existing: raise HTTPException(status_code=409, detail="Bạn đã đăng ký lớp này rồi.")
    # Create enrollment
    enroll = ClassEnrollment(ClassID=class_id, MemberID=current_user.UserID, Status="Active")
    db.add(enroll)
    obj.CurrentEnrolled = (obj.CurrentEnrolled or 0) + 1
    db.commit()
    enrolled_ids = _get_enrolled_ids(db, current_user.UserID)
    return _class_dict(obj, current_user.UserID, enrolled_ids)


@router.delete("/classes/{class_id}/enroll", status_code=status.HTTP_204_NO_CONTENT)
def unenroll_class(class_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Member: hủy đăng ký lớp học."""
    enroll = db.query(ClassEnrollment).filter(
        ClassEnrollment.ClassID == class_id,
        ClassEnrollment.MemberID == current_user.UserID,
        ClassEnrollment.Status == "Active",
    ).first()
    if not enroll: raise HTTPException(status_code=404, detail="Bạn chưa đăng ký lớp này.")
    enroll.Status = "Cancelled"
    obj = db.query(GymClass).filter(GymClass.ClassID == class_id).first()
    if obj: obj.CurrentEnrolled = max(0, (obj.CurrentEnrolled or 1) - 1)
    db.commit()
