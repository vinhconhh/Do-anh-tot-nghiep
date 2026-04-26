"""
Routes / Controller cho 3 module:
  - Equipment        → /api/equipment
  - Exercise         → /api/gym-exercises
  - GymClass         → /api/classes  (with enrollment & PT sync)
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import Optional, List
from datetime import datetime, date, timedelta
import math

from ..database import get_db
from ..models.facility import GymEquipment, GymExercise, GymClass, ClassEnrollment
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
    TenBaiTap:    Optional[str] = None
    Type:         Optional[str] = None
    TargetMuscle: Optional[str] = None
    MetValue:     Optional[float] = 0.0
    EquipmentID:  Optional[int] = None

class ExerciseUpdate(BaseModel):
    Name:         Optional[str] = None
    TenBaiTap:    Optional[str] = None
    Type:         Optional[str] = None
    TargetMuscle: Optional[str] = None
    MetValue:     Optional[float] = None
    EquipmentID:  Optional[int] = None


class GymClassCreate(BaseModel):
    Name:           str
    InstructorID:   Optional[int] = None
    InstructorName: Optional[str] = None   # fallback nếu không chọn PT
    StudioRoom:     Optional[str] = None
    MaxCapacity:    Optional[int] = Field(default=20, ge=1)
    StartTime:      datetime
    EndTime:        datetime

class GymClassUpdate(BaseModel):
    Name:           Optional[str] = None
    InstructorID:   Optional[int] = None
    InstructorName: Optional[str] = None
    StudioRoom:     Optional[str] = None
    MaxCapacity:    Optional[int] = Field(default=None, ge=1)
    StartTime:      Optional[datetime] = None
    EndTime:        Optional[datetime] = None


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
        "IsEnrolled":      (current_user_id in enrolled_ids) if enrolled_ids is not None else None,
    }


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
    q = db.query(GymExercise).filter(GymExercise.IsDeleted == 0)
    if search:
        like = f"%{search}%"
        q = q.filter(or_(GymExercise.Name.ilike(like), GymExercise.TenBaiTap.ilike(like)))
    if target_muscle:
        q = q.filter(GymExercise.TargetMuscle.ilike(f"%{target_muscle}%"))
    total = q.count()
    items = q.order_by(GymExercise.Name).offset((page - 1) * size).limit(size).all()
    result = []
    for ex in items:
        d = {c.name: getattr(ex, c.name) for c in ex.__table__.columns}
        d["EquipmentName"] = ex.gym_equipment.Name if ex.gym_equipment else None
        result.append(d)
    return {"total": total, "page": page, "size": size, "pages": math.ceil(total / size) if total else 1, "items": result}


@router.get("/gym-exercises/{exercise_id}")
def get_exercise(exercise_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    obj = db.query(GymExercise).filter(GymExercise.ExerciseID == exercise_id, GymExercise.IsDeleted == 0).first()
    if not obj: raise HTTPException(status_code=404, detail="Không tìm thấy bài tập.")
    d = {c.name: getattr(obj, c.name) for c in obj.__table__.columns}
    d["EquipmentName"] = obj.gym_equipment.Name if obj.gym_equipment else None
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


@router.post("/classes", status_code=status.HTTP_201_CREATED)
def create_class(payload: GymClassCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    if payload.EndTime <= payload.StartTime:
        raise HTTPException(status_code=400, detail="EndTime phải sau StartTime.")
    data = payload.model_dump()
    # If InstructorID given, sync InstructorName
    if data.get("InstructorID"):
        pt = db.query(User).filter(User.UserID == data["InstructorID"]).first()
        if pt: data["InstructorName"] = pt.FullName
    obj = GymClass(**data); db.add(obj); db.commit(); db.refresh(obj)
    return _class_dict(obj)


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
    db.commit(); db.refresh(obj)
    return _class_dict(obj)


@router.delete("/classes/{class_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_class(class_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    obj = db.query(GymClass).filter(GymClass.ClassID == class_id, GymClass.IsDeleted == 0).first()
    if not obj: raise HTTPException(status_code=404, detail="Không tìm thấy lớp học.")
    obj.IsDeleted = 1; db.commit()


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


# ─── Helper: danh sách PT cho dropdown ────
@router.get("/classes/available-instructors")
def available_instructors(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    """Admin: PT list dùng cho dropdown chọn HLV lớp học."""
    pt_role = db.query(Role).filter(Role.RoleCode == "PT").first()
    if not pt_role: return []
    pts = db.query(User).filter(User.RoleID == pt_role.RoleID, User.IsDeleted == 0, User.IsActive == 1).all()
    result = []
    for p in pts:
        prof = p.pt_profile
        result.append({
            "UserID":    p.UserID,
            "FullName":  p.FullName,
            "Specialty": prof.Specialty if prof else "",
            "Score":     float(prof.TotalScore) if prof and prof.TotalScore else 100,
        })
    return sorted(result, key=lambda x: x["Score"], reverse=True)
