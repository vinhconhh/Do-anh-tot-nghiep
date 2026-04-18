from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TrainerOut(BaseModel):
    UserID: int
    FullName: Optional[str] = None
    Email: Optional[str] = None
    IsActive: Optional[int] = 1
    RoleCode: Optional[str] = None
    CreatedAt: Optional[datetime] = None
    # PTProfile fields
    ExperienceYears: Optional[int] = 0
    Certifications: Optional[str] = None
    Specialty: Optional[str] = None

    class Config:
        from_attributes = True


class TrainerCreate(BaseModel):
    hoTen: str
    email: str
    matKhau: Optional[str] = "123456"
    experienceYears: Optional[int] = 0
    certifications: Optional[str] = None
    specialty: Optional[str] = None


class TrainerUpdate(BaseModel):
    hoTen: Optional[str] = None
    email: Optional[str] = None
    experienceYears: Optional[int] = None
    certifications: Optional[str] = None
    specialty: Optional[str] = None
    isActive: Optional[int] = None
