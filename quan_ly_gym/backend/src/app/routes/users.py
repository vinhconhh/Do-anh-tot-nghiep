from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..models.profile import MemberProfile, PTProfile
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
    }

    if role_code == "MEMBER":
        profile = db.query(MemberProfile).filter(MemberProfile.UserID == current_user.UserID).first()
        if profile:
            result.update({
                "goal": profile.Goal,
                "height": profile.Height,
                "weight": profile.Weight,
                "aiQuota": profile.AIQuota,
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
