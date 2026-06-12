import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User, Role
from ..models.profile import MemberProfile, PTProfile
from ..schemas.account import AccountCreate, AccountUpdate, AccountResponse
from ..middleware.auth import get_current_user, require_roles
from ..utils.security import hash_password

router = APIRouter(prefix="/api/accounts", tags=["Accounts"])


ROLE_DISPLAY = {
    "ADMIN": "Quản trị viên",
    "MANAGER": "Quản lý",
    "PT": "Huấn luyện viên",
    "MEMBER": "Hội viên",
}


def _user_to_response(user: User) -> dict:
    role_code = user.role.RoleCode if user.role else ""
    return {
        "UserID": user.UserID,
        "FullName": user.FullName,
        "Email": user.Email,
        "RoleCode": role_code,
        "RoleName": ROLE_DISPLAY.get(role_code, role_code),
        "IsActive": user.IsActive,
        "PhoneNumber": user.PhoneNumber,
        "Gender": user.Gender,
        "Birthday": user.Birthday.isoformat() if user.Birthday else None,
        "CreatedAt": user.CreatedAt.isoformat() if user.CreatedAt else None,
    }


@router.get("/roles")
def get_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
):
    """Lấy danh sách tất cả vai trò."""
    roles = db.query(Role).all()
    return [
        {
            "RoleID": r.RoleID,
            "RoleCode": r.RoleCode,
            "RoleName": ROLE_DISPLAY.get(r.RoleCode, r.RoleCode),
        }
        for r in roles
    ]


@router.get("")
def get_accounts(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
    role: str = Query(None, description="Filter by role code: ADMIN, MANAGER, PT, MEMBER"),
    search: str = Query(None, description="Search by name or email"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """Lấy danh sách tài khoản (phân trang, lọc theo role, tìm kiếm)."""
    query = db.query(User).filter(User.IsDeleted == 0)

    if role:
        query = query.join(Role).filter(Role.RoleCode == role.upper())

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (User.FullName.ilike(search_term)) | (User.Email.ilike(search_term))
        )

    total = query.count()
    users = (
        query.order_by(User.CreatedAt.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "items": [_user_to_response(u) for u in users],
        "total": total,
        "page": page,
        "pageSize": page_size,
        "totalPages": (total + page_size - 1) // page_size,
    }


@router.get("/{user_id}")
def get_account(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
):
    """Lấy chi tiết 1 tài khoản."""
    user = db.query(User).filter(User.UserID == user_id, User.IsDeleted == 0).first()
    if not user:
        raise HTTPException(status_code=404, detail="Tài khoản không tồn tại")
    return _user_to_response(user)


@router.post("", status_code=status.HTTP_201_CREATED)
def create_account(
    req: AccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
):
    """Tạo tài khoản mới."""
    if db.query(User).filter(User.Email == req.Email, User.IsDeleted == 0).first():
        raise HTTPException(status_code=400, detail="Email đã tồn tại")

    role = db.query(Role).filter(Role.RoleCode == req.RoleCode.upper()).first()
    if not role:
        raise HTTPException(status_code=400, detail=f"Vai trò '{req.RoleCode}' không hợp lệ")

    new_user = User(
        FullName=req.FullName,
        Email=req.Email,
        PasswordHash=hash_password(req.Password),
        RoleID=role.RoleID,
        IsActive=req.IsActive if req.IsActive is not None else 1,
        IsDeleted=0,
        PhoneNumber=req.PhoneNumber,
        Gender=req.Gender,
        Birthday=req.Birthday.replace(tzinfo=None) if req.Birthday else None,
        ReferralCode=str(uuid.uuid4())[:8],
    )
    db.add(new_user)
    db.flush()

    if role.RoleCode == "MEMBER":
        db.add(MemberProfile(UserID=new_user.UserID))
    elif role.RoleCode == "PT":
        db.add(PTProfile(UserID=new_user.UserID, ExperienceYears=0))

    db.commit()
    db.refresh(new_user)

    return _user_to_response(new_user)


@router.put("/{user_id}")
def update_account(
    user_id: int,
    req: AccountUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
):
    """Cập nhật thông tin tài khoản."""
    user = db.query(User).filter(User.UserID == user_id, User.IsDeleted == 0).first()
    if not user:
        raise HTTPException(status_code=404, detail="Tài khoản không tồn tại")

    if req.Email and req.Email != user.Email:
        existing = db.query(User).filter(
            User.Email == req.Email, User.IsDeleted == 0, User.UserID != user_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email đã được sử dụng")
        user.Email = req.Email

    if req.FullName is not None:
        user.FullName = req.FullName
    if req.Password:
        user.PasswordHash = hash_password(req.Password)
    if req.PhoneNumber is not None:
        user.PhoneNumber = req.PhoneNumber
    if req.Gender is not None:
        user.Gender = req.Gender
    if req.Birthday is not None:
        user.Birthday = req.Birthday.replace(tzinfo=None) if req.Birthday else None
    if req.IsActive is not None:
        user.IsActive = req.IsActive

    if req.RoleCode:
        role = db.query(Role).filter(Role.RoleCode == req.RoleCode.upper()).first()
        if not role:
            raise HTTPException(status_code=400, detail=f"Vai trò '{req.RoleCode}' không hợp lệ")
        user.RoleID = role.RoleID

    db.commit()
    db.refresh(user)

    return _user_to_response(user)


@router.delete("/{user_id}")
def delete_account(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
):
    """Xóa mềm tài khoản (soft delete)."""
    if user_id == current_user.UserID:
        raise HTTPException(status_code=400, detail="Không thể tự xóa tài khoản của mình")

    user = db.query(User).filter(User.UserID == user_id, User.IsDeleted == 0).first()
    if not user:
        raise HTTPException(status_code=404, detail="Tài khoản không tồn tại")

    user.IsDeleted = 1
    db.commit()

    return {"message": "Đã xóa tài khoản thành công"}


@router.put("/{user_id}/toggle-status")
def toggle_account_status(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
):
    """Khóa/Mở khóa tài khoản."""
    if user_id == current_user.UserID:
        raise HTTPException(status_code=400, detail="Không thể tự khóa tài khoản của mình")

    user = db.query(User).filter(User.UserID == user_id, User.IsDeleted == 0).first()
    if not user:
        raise HTTPException(status_code=404, detail="Tài khoản không tồn tại")

    user.IsActive = 0 if user.IsActive else 1
    db.commit()

    status_text = "kích hoạt" if user.IsActive else "khóa"
    return {"message": f"Đã {status_text} tài khoản thành công", "IsActive": user.IsActive}
