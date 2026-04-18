from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from ..models.user import User, Role
from ..models.profile import PTProfile
from ..middleware.auth import get_current_user, require_roles
from ..schemas.trainer import TrainerCreate, TrainerUpdate
from ..utils.security import hash_password

router = APIRouter(prefix="/api/trainers", tags=["Trainers"])


def _trainer_to_dict(user: User) -> dict:
    profile = user.pt_profile
    return {
        "UserID": user.UserID,
        "hoTen": user.FullName,
        "email": user.Email,
        "isActive": user.IsActive,
        "createdAt": user.CreatedAt.isoformat() if user.CreatedAt else None,
        "vaiTro": user.role.RoleCode if user.role else None,
        "experienceYears": profile.ExperienceYears if profile else 0,
        "certifications": profile.Certifications if profile else None,
        "specialty": profile.Specialty if profile else None,
    }


@router.get("")
def list_trainers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role = db.query(Role).filter(Role.RoleCode == "PT").first()
    if not role:
        return []
    trainers = (
        db.query(User)
        .options(joinedload(User.pt_profile), joinedload(User.role))
        .filter(User.RoleID == role.RoleID, User.IsDeleted == 0)
        .order_by(User.CreatedAt.desc())
        .all()
    )
    return [_trainer_to_dict(t) for t in trainers]


@router.get("/{trainer_id}")
def get_trainer(
    trainer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user = (
        db.query(User)
        .options(joinedload(User.pt_profile), joinedload(User.role))
        .filter(User.UserID == trainer_id, User.IsDeleted == 0)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="PT không tồn tại")
    return _trainer_to_dict(user)


@router.post("")
def create_trainer(
    req: TrainerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "MANAGER")),
):
    if db.query(User).filter(User.Email == req.email).first():
        raise HTTPException(status_code=400, detail="Email đã tồn tại")

    role = db.query(Role).filter(Role.RoleCode == "PT").first()
    if not role:
        raise HTTPException(status_code=500, detail="Role PT chưa được tạo")

    user = User(
        FullName=req.hoTen,
        Email=req.email,
        PasswordHash=hash_password(req.matKhau),
        RoleID=role.RoleID,
        IsActive=1,
        IsDeleted=0,
    )
    db.add(user)
    db.flush()

    profile = PTProfile(
        UserID=user.UserID,
        ExperienceYears=req.experienceYears,
        Certifications=req.certifications,
        Specialty=req.specialty,
    )
    db.add(profile)
    db.commit()
    db.refresh(user)
    return _trainer_to_dict(user)


@router.put("/{trainer_id}")
def update_trainer(
    trainer_id: int,
    req: TrainerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "MANAGER")),
):
    user = db.query(User).filter(User.UserID == trainer_id, User.IsDeleted == 0).first()
    if not user:
        raise HTTPException(status_code=404, detail="PT không tồn tại")

    if req.hoTen is not None:
        user.FullName = req.hoTen
    if req.email is not None:
        user.Email = req.email
    if req.isActive is not None:
        user.IsActive = req.isActive

    profile = db.query(PTProfile).filter(PTProfile.UserID == trainer_id).first()
    if profile:
        if req.experienceYears is not None:
            profile.ExperienceYears = req.experienceYears
        if req.certifications is not None:
            profile.Certifications = req.certifications
        if req.specialty is not None:
            profile.Specialty = req.specialty

    db.commit()
    db.refresh(user)
    return _trainer_to_dict(user)


@router.delete("/{trainer_id}")
def delete_trainer(
    trainer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "MANAGER")),
):
    user = db.query(User).filter(User.UserID == trainer_id, User.IsDeleted == 0).first()
    if not user:
        raise HTTPException(status_code=404, detail="PT không tồn tại")
    user.IsDeleted = 1
    db.commit()
    return {"message": "Đã xóa PT"}
