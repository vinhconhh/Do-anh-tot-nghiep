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


def require_admin(current_user: User = Depends(get_current_user)):
    role = current_user.role.RoleCode.upper()
    if role not in ["MANAGER"]:
        raise HTTPException(status_code=403, detail="Không có quyền thực hiện thao tác này.")
    return current_user


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
    InstructorName: Optional[str] = None
    StudioRoom:     Optional[str] = None
    MaxCapacity:    Optional[int] = Field(default=20, ge=1)
    StartTime:      Optional[datetime] = None
    EndTime:        Optional[datetime] = None
    Intensity:      Optional[str] = "medium"
    IsRecurring:        Optional[int] = 0
    RecurringDays:      Optional[str] = None
    RecurringStartDate: Optional[date] = None
    RecurringEndDate:   Optional[date] = None
    TimeStart:          Optional[str] = None
    TimeEnd:            Optional[str] = None

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
    TimeStart:      str
    TimeEnd:        str


def _class_dict(c: GymClass, current_user_id: int = None, enrollment_map: dict = None) -> dict:
    instructor = c.instructor
    name = (instructor.FullName if instructor else None) or c.InstructorName or "Chưa phân công"
    pt_profile = instructor.pt_profile if instructor and hasattr(instructor, 'pt_profile') else None
    enroll_status = enrollment_map.get(c.ClassID) if enrollment_map else None
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
        "RecurringStartDate": c.RecurringStartDate.isoformat() if c.RecurringStartDate else None,
        "RecurringEndDate":   c.RecurringEndDate.isoformat() if c.RecurringEndDate else None,
        "ParentClassID":   c.ParentClassID,
        "IsEnrolled":      enroll_status is not None,
        "EnrollmentStatus": enroll_status,
    }


def _parse_time(t_str: str) -> dt_time:
    """Parse 'HH:MM' string to time object."""
    parts = t_str.strip().split(":")
    return dt_time(int(parts[0]), int(parts[1]))


def _check_instructor_conflicts(
    db: Session,
    instructor_id: int,
    sessions: list,
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

            ex_gap = INTENSITY_MIN_GAP.get(ex.Intensity or "medium", 20)
            required_gap = max(new_gap, ex_gap)

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
    obj.UpdatedAt = datetime.now(); db.commit(); db.refresh(obj)
    return obj


@router.delete("/equipment/{equipment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_equipment(equipment_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    obj = db.query(GymEquipment).filter(GymEquipment.EquipmentID == equipment_id).first()
    if not obj: raise HTTPException(status_code=404, detail="Không tìm thấy thiết bị.")
    db.delete(obj); db.commit()



@router.get("/gym-exercises")
def list_exercises(
    search:        Optional[str] = Query(None),
    target_muscle: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    from sqlalchemy.orm import joinedload
    q = db.query(GymExercise).options(joinedload(GymExercise.gym_equipment)).filter(GymExercise.IsDeleted == 0)
    if search:
        pattern = f"%{search}%"
        q = q.filter(or_(GymExercise.Name.ilike(pattern), GymExercise.AssignmentName.ilike(pattern)))
    if target_muscle:
        pattern2 = f"%{target_muscle}%"
        q = q.filter(GymExercise.TargetMuscle.ilike(pattern2))
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
    obj.UpdatedAt = datetime.now(); db.commit(); db.refresh(obj)
    d = {c.name: getattr(obj, c.name) for c in obj.__table__.columns}
    d["EquipmentName"] = obj.gym_equipment.Name if obj.gym_equipment else None
    return d


@router.delete("/gym-exercises/{exercise_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exercise(exercise_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    obj = db.query(GymExercise).filter(GymExercise.ExerciseID == exercise_id, GymExercise.IsDeleted == 0).first()
    if not obj: raise HTTPException(status_code=404, detail="Không tìm thấy bài tập.")
    obj.IsDeleted = 1; db.commit()



def _get_enrollment_map(db: Session, user_id: int) -> dict:
    """Return {ClassID: status} for all non-cancelled enrollments."""
    rows = db.query(ClassEnrollment.ClassID, ClassEnrollment.Status).filter(
        ClassEnrollment.MemberID == user_id,
        ClassEnrollment.Status.in_(["Active", "Pending"]),
    ).all()
    return {r[0]: r[1] for r in rows}


@router.get("/classes")
def list_classes(
    date_filter: Optional[date] = Query(None),
    show_all: Optional[bool] = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(GymClass).filter(
        GymClass.IsDeleted == 0,
        GymClass.ParentClassID == None,  # noqa: E711 — only parents/standalone
    )
    if not show_all and date_filter:
        target_date = date_filter
        day_start = datetime.combine(target_date, datetime.min.time())
        day_end   = day_start + timedelta(days=1)
        q = q.filter(GymClass.StartTime >= day_start, GymClass.StartTime < day_end)
    classes = q.order_by(GymClass.StartTime).all()
    enrollment_map = _get_enrollment_map(db, current_user.UserID)
    return [_class_dict(c, current_user.UserID, enrollment_map) for c in classes]


@router.get("/classes/all")
def list_all_classes(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    classes = (
        db.query(GymClass)
        .filter(GymClass.IsDeleted == 0, GymClass.ParentClassID == None)  # noqa: E711
        .order_by(GymClass.StartTime.desc())
        .all()
    )
    return [_class_dict(c) for c in classes]


@router.get("/classes/my-teaching")
def list_my_teaching_classes(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """PT: danh sách các lớp mình phụ trách (chỉ parent/standalone)."""
    classes = (
        db.query(GymClass)
        .filter(
            GymClass.IsDeleted == 0,
            GymClass.ParentClassID == None,  # noqa: E711
            GymClass.InstructorID == current_user.UserID,
        )
        .order_by(GymClass.StartTime.desc())
        .all()
    )
    return [_class_dict(c) for c in classes]



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
        .join(GymClass, ClassEnrollment.ClassID == GymClass.ClassID)
        .filter(
            ClassEnrollment.MemberID == current_user.UserID, 
            ClassEnrollment.Status == "Active",
            GymClass.ParentClassID == None  # noqa: E711
        )
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
    ws = ws - timedelta(days=ws.weekday())
    we = ws + timedelta(days=7)
    day_start = datetime.combine(ws, dt_time.min)
    day_end = datetime.combine(we, dt_time.min)

    events = []
    pt_classes = db.query(GymClass).filter(
        GymClass.InstructorID == target_id,
        GymClass.IsDeleted == 0,
        GymClass.StartTime >= day_start,
        GymClass.StartTime < day_end,
    ).order_by(GymClass.StartTime).all()

    for c in pt_classes:
        target_class_ids = [c.ClassID]
        if c.ParentClassID:
            target_class_ids.append(c.ParentClassID)
            
        active_count = db.query(ClassEnrollment.MemberID).filter(
            ClassEnrollment.ClassID.in_(target_class_ids),
            ClassEnrollment.Status == "Active"
        ).distinct().count()
        
        events.append({
            "id": f"teach_{c.ClassID}",
            "start": c.StartTime.isoformat(),
            "end": c.EndTime.isoformat(),
            "title": f"{c.Name} — {c.StudioRoom or 'TBD'}",
            "meta": f"Ca dạy · {active_count}/{c.MaxCapacity or 20} HV",
            "color": "green",
        })

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



@router.get("/classes/{class_id}")
def get_class(class_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    obj = db.query(GymClass).filter(GymClass.ClassID == class_id, GymClass.IsDeleted == 0).first()
    if not obj: raise HTTPException(status_code=404, detail="Không tìm thấy lớp học.")
    enrollment_map = _get_enrollment_map(db, current_user.UserID)
    return _class_dict(obj, current_user.UserID, enrollment_map)


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
    db.flush()
    
    parent_enrollments = db.query(ClassEnrollment).filter(
        ClassEnrollment.ClassID == class_id,
        ClassEnrollment.Status.in_(["Active", "Pending"])
    ).all()
    
    active_count = 0
    for e in parent_enrollments:
        db.add(ClassEnrollment(
            ClassID=child.ClassID,
            MemberID=e.MemberID,
            Status=e.Status,
            EnrolledAt=e.EnrolledAt
        ))
        if e.Status == "Active":
            active_count += 1
            
    child.CurrentEnrolled = active_count
    
    db.commit()
    db.refresh(child)
    return {"created": 1, "session": _class_dict(child), "conflicts": [], "message": "Đã thêm buổi học và chép danh sách."}


@router.post("/classes", status_code=status.HTTP_201_CREATED)
def create_class(payload: GymClassCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    intensity = payload.Intensity or "medium"
    instructor_name = payload.InstructorName
    if payload.InstructorID:
        pt = db.query(User).filter(User.UserID == payload.InstructorID).first()
        if pt:
            instructor_name = pt.FullName

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

        if payload.InstructorID:
            conflicts = _check_instructor_conflicts(db, payload.InstructorID, sessions, intensity)
            if conflicts:
                return {"created": 0, "conflicts": conflicts, "message": "Phát hiện xung đột lịch HLV!"}

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

    if not payload.StartTime or not payload.EndTime:
        raise HTTPException(400, "Cần chọn thời gian bắt đầu và kết thúc.")
    if payload.EndTime <= payload.StartTime:
        raise HTTPException(400, "EndTime phải sau StartTime.")

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
    obj.UpdatedAt = datetime.now()
    if obj.EndTime and obj.StartTime and obj.EndTime <= obj.StartTime:
        raise HTTPException(status_code=400, detail="EndTime phải sau StartTime.")
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
        if obj.IsRecurring:
            db.query(GymClass).filter(
                GymClass.ParentClassID == class_id, GymClass.IsDeleted == 0
            ).update({"IsDeleted": 1})
        elif obj.ParentClassID:
            parent = db.query(GymClass).filter(GymClass.ClassID == obj.ParentClassID).first()
            if parent: parent.IsDeleted = 1
            db.query(GymClass).filter(
                GymClass.ParentClassID == obj.ParentClassID, GymClass.IsDeleted == 0
            ).update({"IsDeleted": 1})
    db.commit()


@router.post("/classes/{class_id}/enroll")
def enroll_class(class_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Member: gửi yêu cầu đăng ký lớp học (Pending → chờ HLV/Manager duyệt). Đăng ký cho cả chuỗi (cha + con)."""
    obj = db.query(GymClass).filter(GymClass.ClassID == class_id, GymClass.IsDeleted == 0).first()
    if not obj: raise HTTPException(status_code=404, detail="Không tìm thấy lớp học.")
    if obj.CurrentEnrolled >= (obj.MaxCapacity or 1):
        raise HTTPException(status_code=409, detail="Lớp học đã đầy chỗ.")
        
    parent_id = obj.ParentClassID if obj.ParentClassID else obj.ClassID
    related_classes = db.query(GymClass).filter(
        or_(GymClass.ClassID == parent_id, GymClass.ParentClassID == parent_id),
        GymClass.IsDeleted == 0
    ).all()
    
    existing = db.query(ClassEnrollment).filter(
        ClassEnrollment.ClassID == class_id,
        ClassEnrollment.MemberID == current_user.UserID,
    ).first()
    
    if existing:
        if existing.Status == "Pending":
            raise HTTPException(status_code=409, detail="Yêu cầu đăng ký đang chờ duyệt.")
        if existing.Status == "Active":
            raise HTTPException(status_code=409, detail="Bạn đã đăng ký lớp này rồi.")
            
    for c in related_classes:
        enr = db.query(ClassEnrollment).filter(
            ClassEnrollment.ClassID == c.ClassID,
            ClassEnrollment.MemberID == current_user.UserID
        ).first()
        if enr:
            enr.Status = "Pending"
            enr.EnrolledAt = datetime.now()
        else:
            db.add(ClassEnrollment(ClassID=c.ClassID, MemberID=current_user.UserID, Status="Pending"))
            
    db.commit()
    enrollment_map = _get_enrollment_map(db, current_user.UserID)
    return _class_dict(obj, current_user.UserID, enrollment_map)


@router.delete("/classes/{class_id}/enroll", status_code=status.HTTP_204_NO_CONTENT)
def unenroll_class(class_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Member: hủy đăng ký hoặc hủy yêu cầu chờ duyệt. Hủy cho cả chuỗi (cha + con)."""
    obj = db.query(GymClass).filter(GymClass.ClassID == class_id).first()
    if not obj: raise HTTPException(status_code=404, detail="Không tìm thấy lớp học.")
    
    parent_id = obj.ParentClassID if obj.ParentClassID else obj.ClassID
    related_classes = db.query(GymClass).filter(
        or_(GymClass.ClassID == parent_id, GymClass.ParentClassID == parent_id)
    ).all()
    class_ids = [c.ClassID for c in related_classes]
    
    enrollments = db.query(ClassEnrollment).filter(
        ClassEnrollment.ClassID.in_(class_ids),
        ClassEnrollment.MemberID == current_user.UserID,
        ClassEnrollment.Status.in_(["Active", "Pending"]),
    ).all()
    
    if not enrollments: 
        raise HTTPException(status_code=404, detail="Bạn chưa đăng ký lớp này.")
        
    for enroll in enrollments:
        was_active = enroll.Status == "Active"
        enroll.Status = "Cancelled"
        if was_active:
            c_obj = db.query(GymClass).filter(GymClass.ClassID == enroll.ClassID).first()
            if c_obj: c_obj.CurrentEnrolled = max(0, (c_obj.CurrentEnrolled or 1) - 1)
            
    db.commit()


@router.get("/classes/{class_id}/pending-enrollments")
def list_pending_enrollments(class_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """HLV/Manager: danh sách yêu cầu đăng ký chờ duyệt."""
    obj = db.query(GymClass).filter(GymClass.ClassID == class_id, GymClass.IsDeleted == 0).first()
    if not obj: raise HTTPException(status_code=404, detail="Không tìm thấy lớp học.")
    if current_user.role.RoleCode.upper() not in ("MANAGER",) and obj.InstructorID != current_user.UserID:
        raise HTTPException(status_code=403, detail="Bạn không có quyền xem.")
    enrollments = db.query(ClassEnrollment).filter(
        ClassEnrollment.ClassID == class_id,
        ClassEnrollment.Status == "Pending",
    ).all()
    result = []
    for e in enrollments:
        m = e.member
        result.append({
            "EnrollID": e.EnrollID,
            "MemberID": e.MemberID,
            "FullName": m.FullName if m else "—",
            "Email": m.Email if m else "—",
            "EnrolledAt": e.EnrolledAt.strftime("%d/%m/%Y %H:%M") if e.EnrolledAt else "—",
            "Status": e.Status,
        })
    return result


@router.post("/classes/enrollments/{enroll_id}/approve")
def approve_enrollment(enroll_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """HLV/Manager: duyệt yêu cầu đăng ký. Duyệt cho cả chuỗi (cha + con)."""
    enroll = db.query(ClassEnrollment).filter(ClassEnrollment.EnrollID == enroll_id).first()
    if not enroll: raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu.")
    if enroll.Status != "Pending":
        raise HTTPException(status_code=400, detail="Yêu cầu không ở trạng thái chờ duyệt.")
    obj = db.query(GymClass).filter(GymClass.ClassID == enroll.ClassID).first()
    if not obj: raise HTTPException(status_code=404, detail="Không tìm thấy lớp học.")
    if current_user.role.RoleCode.upper() not in ("MANAGER",) and obj.InstructorID != current_user.UserID:
        raise HTTPException(status_code=403, detail="Bạn không có quyền duyệt.")
    if obj.CurrentEnrolled >= (obj.MaxCapacity or 1):
        raise HTTPException(status_code=409, detail="Lớp học đã đầy chỗ.")
        
    parent_id = obj.ParentClassID if obj.ParentClassID else obj.ClassID
    related_classes = db.query(GymClass).filter(
        or_(GymClass.ClassID == parent_id, GymClass.ParentClassID == parent_id)
    ).all()
    class_ids = [c.ClassID for c in related_classes]
    
    enrollments = db.query(ClassEnrollment).filter(
        ClassEnrollment.ClassID.in_(class_ids),
        ClassEnrollment.MemberID == enroll.MemberID,
        ClassEnrollment.Status == "Pending"
    ).all()
    
    for e in enrollments:
        e.Status = "Active"
        c_obj = db.query(GymClass).filter(GymClass.ClassID == e.ClassID).first()
        if c_obj: c_obj.CurrentEnrolled = (c_obj.CurrentEnrolled or 0) + 1
        
    db.commit()
    return {"message": "Đã duyệt thành công.", "EnrollID": enroll_id}


@router.post("/classes/enrollments/{enroll_id}/reject")
def reject_enrollment(enroll_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """HLV/Manager: từ chối yêu cầu đăng ký. Từ chối cho cả chuỗi (cha + con)."""
    enroll = db.query(ClassEnrollment).filter(ClassEnrollment.EnrollID == enroll_id).first()
    if not enroll: raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu.")
    if enroll.Status != "Pending":
        raise HTTPException(status_code=400, detail="Yêu cầu không ở trạng thái chờ duyệt.")
    obj = db.query(GymClass).filter(GymClass.ClassID == enroll.ClassID).first()
    if obj and current_user.role.RoleCode.upper() not in ("MANAGER",) and obj.InstructorID != current_user.UserID:
        raise HTTPException(status_code=403, detail="Bạn không có quyền từ chối.")
        
    parent_id = obj.ParentClassID if obj.ParentClassID else obj.ClassID
    related_classes = db.query(GymClass).filter(
        or_(GymClass.ClassID == parent_id, GymClass.ParentClassID == parent_id)
    ).all()
    class_ids = [c.ClassID for c in related_classes]
    
    enrollments = db.query(ClassEnrollment).filter(
        ClassEnrollment.ClassID.in_(class_ids),
        ClassEnrollment.MemberID == enroll.MemberID,
        ClassEnrollment.Status == "Pending"
    ).all()
    
    for e in enrollments:
        e.Status = "Rejected"
        
    db.commit()
    return {"message": "Đã từ chối yêu cầu.", "EnrollID": enroll_id}

@router.get("/classes/{class_id}/attendance")
def get_class_attendance(class_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """HLV/Manager: Lấy danh sách điểm danh của 1 buổi học."""
    obj = db.query(GymClass).filter(GymClass.ClassID == class_id, GymClass.IsDeleted == 0).first()
    if not obj: raise HTTPException(status_code=404, detail="Không tìm thấy lớp học.")
    if current_user.role.RoleCode.upper() not in ("MANAGER",) and obj.InstructorID != current_user.UserID:
        raise HTTPException(status_code=403, detail="Bạn không có quyền xem.")
        
    target_class_ids = [class_id]
    if obj.ParentClassID:
        target_class_ids.append(obj.ParentClassID)
        
    enrollments = db.query(ClassEnrollment).filter(
        ClassEnrollment.ClassID.in_(target_class_ids),
        ClassEnrollment.Status == "Active"
    ).all()
    
    member_map = {}
    for e in enrollments:
        if e.MemberID not in member_map or e.ClassID == class_id:
            member_map[e.MemberID] = e
    
    result = []
    for e in member_map.values():
        m = e.member
        result.append({
            "EnrollID": e.EnrollID,
            "MemberID": e.MemberID,
            "FullName": m.FullName if m else "—",
            "Email": m.Email if m else "—",
            "AttendanceStatus": e.AttendanceStatus
        })
    return {
        "AttendanceSubmitted": obj.AttendanceSubmitted,
        "Members": result
    }

def _update_member_streak_on_attendance(db: Session, member_id: int, class_date: date):
    from ..models.profile import MemberProfile
    profile = db.query(MemberProfile).filter(MemberProfile.UserID == member_id).first()
    if not profile:
        profile = MemberProfile(UserID=member_id, CurrentStreak=0, LongestStreak=0)
        db.add(profile)
        db.flush()

    if not profile.LastAttendanceDate:
        profile.CurrentStreak = 1
        profile.LongestStreak = 1
        profile.LastAttendanceDate = class_date
    else:
        diff = (class_date - profile.LastAttendanceDate).days
        if diff == 1:
            profile.CurrentStreak += 1
        elif diff > 1:
            profile.CurrentStreak = 1
        
        if profile.CurrentStreak > profile.LongestStreak:
            profile.LongestStreak = profile.CurrentStreak
        profile.LastAttendanceDate = class_date


class AttendancePayload(BaseModel):
    attendance_data: dict[int, Optional[str]]

@router.post("/classes/{class_id}/attendance")
def submit_class_attendance(class_id: int, payload: AttendancePayload, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """HLV/Manager: Chốt danh sách điểm danh của 1 buổi học."""
    obj = db.query(GymClass).filter(GymClass.ClassID == class_id, GymClass.IsDeleted == 0).first()
    if not obj: raise HTTPException(status_code=404, detail="Không tìm thấy lớp học.")
    if current_user.role.RoleCode.upper() not in ("MANAGER",) and obj.InstructorID != current_user.UserID:
        raise HTTPException(status_code=403, detail="Bạn không có quyền thực hiện.")
        
    if obj.AttendanceSubmitted:
        raise HTTPException(status_code=400, detail="Lớp học này đã chốt điểm danh, không thể thay đổi.")
        
    child_enrollments = db.query(ClassEnrollment).filter(
        ClassEnrollment.ClassID == class_id,
        ClassEnrollment.Status == "Active"
    ).all()
    
    child_map = {e.MemberID: e for e in child_enrollments}
    
    parent_map = {}
    if obj.ParentClassID:
        parent_enrolls = db.query(ClassEnrollment).filter(
            ClassEnrollment.ClassID == obj.ParentClassID,
            ClassEnrollment.Status == "Active"
        ).all()
        parent_map = {e.MemberID: e for e in parent_enrolls}
        
    for member_id_str, status in payload.attendance_data.items():
        member_id = int(member_id_str)
        if member_id in child_map:
            child_map[member_id].AttendanceStatus = status
        elif member_id in parent_map:
            pe = parent_map[member_id]
            new_e = ClassEnrollment(
                ClassID=class_id,
                MemberID=member_id,
                Status="Active",
                EnrolledAt=pe.EnrolledAt,
                AttendanceStatus=status
            )
            db.add(new_e)
            
        if status == "Present":
            _update_member_streak_on_attendance(db, member_id, obj.StartTime.date())
            
    obj.AttendanceSubmitted = 1
    db.commit()
    return {"message": "Đã chốt điểm danh thành công."}
