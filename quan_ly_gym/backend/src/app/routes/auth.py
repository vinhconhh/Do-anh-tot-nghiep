from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User, Role
from ..models.profile import MemberProfile
from ..schemas.auth import LoginRequest, LoginResponse, RegisterRequest
from ..utils.security import verify_password, hash_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = (
        db.query(User)
        .filter(User.Email == req.tenDangNhap, User.IsDeleted == 0)
        .first()
    )
    if not user:
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không đúng")

    if not verify_password(req.matKhau, user.PasswordHash or ""):
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không đúng")

    if not user.IsActive:
        raise HTTPException(status_code=403, detail="Tài khoản đã bị khóa")

    role_code = ""
    if user.role:
        role_code = user.role.RoleCode or ""

    token = create_access_token({"sub": str(user.UserID), "role": role_code})

    return {
        "user": {
            "UserID": user.UserID,
            "hoTen": user.FullName,
            "email": user.Email,
            "vaiTro": role_code,
        },
        "token": token,
    }


@router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.Email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email đã tồn tại")

    role = db.query(Role).filter(Role.RoleCode == req.vaiTro.upper()).first()
    if not role:
        raise HTTPException(status_code=400, detail=f"Vai trò '{req.vaiTro}' không hợp lệ")

    new_user = User(
        FullName=req.hoTen,
        Email=req.email,
        PasswordHash=hash_password(req.matKhau),
        RoleID=role.RoleID,
        IsActive=1,
        IsDeleted=0,
    )
    db.add(new_user)
    db.flush()

    # Create member profile for MEMBER role
    if role.RoleCode == "MEMBER":
        profile = MemberProfile(UserID=new_user.UserID, AIQuota=10)
        db.add(profile)

    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": str(new_user.UserID), "role": role.RoleCode})
    return {
        "user": {
            "UserID": new_user.UserID,
            "hoTen": new_user.FullName,
            "email": new_user.Email,
            "vaiTro": role.RoleCode,
        },
        "token": token,
    }
