from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    FullName: Optional[str] = None
    Email: Optional[str] = None
    IsActive: Optional[int] = 1

    class Config:
        from_attributes = True


class UserOut(UserBase):
    UserID: int
    RoleID: Optional[int] = None
    RoleCode: Optional[str] = None
    CreatedAt: Optional[datetime] = None


class UserCreate(BaseModel):
    FullName: str
    Email: str
    Password: str
    RoleID: Optional[int] = None


class UserUpdate(BaseModel):
    FullName: Optional[str] = None
    Email: Optional[str] = None
    IsActive: Optional[int] = None
    RoleID: Optional[int] = None


class UserMeUpdate(BaseModel):
    FullName: Optional[str] = None
    PhoneNumber: Optional[str] = None
    Gender: Optional[str] = None
    Birthday: Optional[datetime] = None
    
    # Member specific
    Height: Optional[float] = None
    Weight: Optional[float] = None
    Goal: Optional[str] = None
    
    # PT specific
    ExperienceYears: Optional[int] = None
    Certifications: Optional[str] = None
    Specialty: Optional[str] = None
