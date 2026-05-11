import uuid
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
    user = db.query(User).filter(User.Email == req.tenDangNhap, User.IsDeleted == 0).first()
    
    if not user or not verify_password(req.matKhau, user.PasswordHash or ""):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email hoặc mật khẩu không đúng")

    if not user.IsActive:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tài khoản đã bị khóa")

    role_code = user.role.RoleCode if user.role else ""
    token = create_access_token({"sub": str(user.UserID), "role": role_code})

    response_user = {
        "UserID": user.UserID,
        "hoTen": user.FullName,
        "email": user.Email,
        "vaiTro": role_code,
    }

    if role_code == "MEMBER" and user.member_profile:
        response_user["packageId"] = user.member_profile.PackageID
        if user.member_profile.gym_package:
            response_user["gymPackageName"] = user.member_profile.gym_package.Name

    return {
        "user": response_user,
        "token": token,
    }


def _process_referral(db: Session, referral_code: str):
    """Xử lý mã giới thiệu và cộng điểm AI Quota cho người giới thiệu."""
    referrer = db.query(User).filter(User.ReferralCode == referral_code.strip(), User.IsActive == 1).first()
    if referrer:
        if referrer.role and referrer.role.RoleCode == "MEMBER" and referrer.member_profile:
            referrer.member_profile.AIQuota = (referrer.member_profile.AIQuota or 0) + 10
        return referrer.UserID
    return None


@router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.Email == req.email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email đã tồn tại")

    role = db.query(Role).filter(Role.RoleCode == req.vaiTro.upper()).first()
    if not role:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Vai trò '{req.vaiTro}' không hợp lệ")

    referred_by_id = _process_referral(db, req.referralCode) if req.referralCode else None

    new_user = User(
        FullName=req.hoTen,
        Email=req.email,
        PasswordHash=hash_password(req.matKhau),
        RoleID=role.RoleID,
        IsActive=1,
        IsDeleted=0,
        ReferralCode=str(uuid.uuid4())[:8],
        ReferredBy=referred_by_id
    )
    db.add(new_user)
    db.flush()

    if role.RoleCode == "MEMBER":
        db.add(MemberProfile(UserID=new_user.UserID, AIQuota=10))

    db.commit()
    db.refresh(new_user)

    response_user = {
        "UserID": new_user.UserID,
        "hoTen": new_user.FullName,
        "email": new_user.Email,
        "vaiTro": role.RoleCode,
    }

    if role.RoleCode == "MEMBER":
        # New members have no package initially
        response_user["packageId"] = None
        response_user["gymPackageName"] = None

    return {
        "user": response_user,
        "token": create_access_token({"sub": str(new_user.UserID), "role": role.RoleCode}),
    }
