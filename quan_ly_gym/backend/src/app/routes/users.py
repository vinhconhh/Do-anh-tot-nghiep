from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..models.profile import MemberProfile, PTProfile
from ..schemas.user import UserMeUpdate
from ..middleware.auth import get_current_user

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/me")
def get_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role_code = current_user.role.RoleCode if current_user.role else ""
    result = {
        "UserID": current_user.UserID,
        "hoTen": current_user.FullName,
        "email": current_user.Email,
        "vaiTro": role_code,
        "isActive": current_user.IsActive,
        "phoneNumber": current_user.PhoneNumber,
        "gender": current_user.Gender,
        "birthday": current_user.Birthday.isoformat() if current_user.Birthday else None,
    }

    if role_code == "MEMBER":
        profile = db.query(MemberProfile).filter(MemberProfile.UserID == current_user.UserID).first()
        if profile:
            result.update({
                "goal": profile.Goal,
                "height": profile.Height,
                "weight": profile.Weight,
                "aiQuota": profile.AIQuota,
                "packageId": profile.PackageID,
                "gymPackageName": profile.gym_package.Name if profile.gym_package else None,
            })
    elif role_code == "PT":
        profile = db.query(PTProfile).filter(PTProfile.UserID == current_user.UserID).first()
        if profile:
            result.update({
                "experienceYears": profile.ExperienceYears,
                "certifications": profile.Certifications,
                "specialty": profile.Specialty,
            })

    return result


@router.put("/me")
def update_me(
    req: UserMeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if req.FullName is not None:
        current_user.FullName = req.FullName
    if req.PhoneNumber is not None:
        current_user.PhoneNumber = req.PhoneNumber
    if req.Gender is not None:
        current_user.Gender = req.Gender
    if req.Birthday is not None:
        current_user.Birthday = req.Birthday.replace(tzinfo=None) if req.Birthday else None

    role_code = current_user.role.RoleCode if current_user.role else ""

    if role_code == "MEMBER":
        profile = db.query(MemberProfile).filter(MemberProfile.UserID == current_user.UserID).first()
        if profile:
            if req.Height is not None:
                profile.Height = req.Height
            if req.Weight is not None:
                profile.Weight = req.Weight
            if req.Goal is not None:
                profile.Goal = req.Goal
    elif role_code == "PT":
        profile = db.query(PTProfile).filter(PTProfile.UserID == current_user.UserID).first()
        if profile:
            if req.ExperienceYears is not None:
                profile.ExperienceYears = req.ExperienceYears
            if req.Certifications is not None:
                profile.Certifications = req.Certifications
            if req.Specialty is not None:
                profile.Specialty = req.Specialty

    db.commit()
    return {"message": "Cập nhật thành công"}
