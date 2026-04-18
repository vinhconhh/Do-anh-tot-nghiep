from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from ..database import get_db
from ..models.user import User, Role
from ..models.profile import MemberProfile
from ..middleware.auth import get_current_user, require_roles
from ..schemas.member import MemberCreate, MemberUpdate
from ..utils.security import hash_password

router = APIRouter(prefix="/api/members", tags=["Members"])


def _member_to_dict(user: User) -> dict:
    profile = user.member_profile
    return {
        "UserID": user.UserID,
        "hoTen": user.FullName,
        "email": user.Email,
        "isActive": user.IsActive,
        "createdAt": user.CreatedAt.isoformat() if user.CreatedAt else None,
        "vaiTro": user.role.RoleCode if user.role else None,
        "goal": profile.Goal if profile else None,
        "height": profile.Height if profile else None,
        "weight": profile.Weight if profile else None,
        "aiQuota": profile.AIQuota if profile else 0,
    }


@router.get("")
def list_members(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role = db.query(Role).filter(Role.RoleCode == "MEMBER").first()
    if not role:
        return []
    members = (
        db.query(User)
        .options(joinedload(User.member_profile), joinedload(User.role))
        .filter(User.RoleID == role.RoleID, User.IsDeleted == 0)
        .order_by(User.CreatedAt.desc())
        .all()
    )
    return [_member_to_dict(m) for m in members]


@router.get("/search")
def search_members(
    q: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role = db.query(Role).filter(Role.RoleCode == "MEMBER").first()
    if not role:
        return []
    query = (
        db.query(User)
        .options(joinedload(User.member_profile), joinedload(User.role))
        .filter(User.RoleID == role.RoleID, User.IsDeleted == 0)
    )
    if q:
        query = query.filter(
            (User.FullName.ilike(f"%{q}%")) | (User.Email.ilike(f"%{q}%"))
        )
    return [_member_to_dict(m) for m in query.all()]


@router.get("/{member_id}")
def get_member(
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user = (
        db.query(User)
        .options(joinedload(User.member_profile), joinedload(User.role))
        .filter(User.UserID == member_id, User.IsDeleted == 0)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="Hội viên không tồn tại")
    return _member_to_dict(user)


@router.post("")
def create_member(
    req: MemberCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "MANAGER")),
):
    if db.query(User).filter(User.Email == req.email).first():
        raise HTTPException(status_code=400, detail="Email đã tồn tại")

    role = db.query(Role).filter(Role.RoleCode == "MEMBER").first()
    if not role:
        raise HTTPException(status_code=500, detail="Role MEMBER chưa được tạo")

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

    profile = MemberProfile(
        UserID=user.UserID,
        Goal=req.goal,
        Height=req.height,
        Weight=req.weight,
        AIQuota=10,
    )
    db.add(profile)
    db.commit()
    db.refresh(user)
    return _member_to_dict(user)


@router.put("/{member_id}")
def update_member(
    member_id: int,
    req: MemberUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "MANAGER")),
):
    user = db.query(User).filter(User.UserID == member_id, User.IsDeleted == 0).first()
    if not user:
        raise HTTPException(status_code=404, detail="Hội viên không tồn tại")

    if req.hoTen is not None:
        user.FullName = req.hoTen
    if req.email is not None:
        user.Email = req.email
    if req.isActive is not None:
        user.IsActive = req.isActive

    profile = db.query(MemberProfile).filter(MemberProfile.UserID == member_id).first()
    if profile:
        if req.goal is not None:
            profile.Goal = req.goal
        if req.height is not None:
            profile.Height = req.height
        if req.weight is not None:
            profile.Weight = req.weight

    db.commit()
    db.refresh(user)
    return _member_to_dict(user)


@router.delete("/{member_id}")
def delete_member(
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "MANAGER")),
):
    user = db.query(User).filter(User.UserID == member_id, User.IsDeleted == 0).first()
    if not user:
        raise HTTPException(status_code=404, detail="Hội viên không tồn tại")
    user.IsDeleted = 1
    db.commit()
    return {"message": "Đã xóa hội viên"}
