from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class MemberOut(BaseModel):
    UserID: int
    FullName: Optional[str] = None
    Email: Optional[str] = None
    IsActive: Optional[int] = 1
    RoleCode: Optional[str] = None
    CreatedAt: Optional[datetime] = None
    Goal: Optional[str] = None
    Height: Optional[float] = None
    Weight: Optional[float] = None
    AIQuota: Optional[int] = 0
    PhoneNumber: Optional[str] = None
    Age: Optional[int] = None
    Gender: Optional[str] = None
    Birthday: Optional[datetime] = None
    ExpiryDate: Optional[datetime] = None

    class Config:
        from_attributes = True


class MemberCreate(BaseModel):
    hoTen: str
    email: str
    matKhau: Optional[str] = "123456"
    goal: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    phoneNumber: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    birthday: Optional[datetime] = None
    expiryDate: Optional[datetime] = None


class MemberUpdate(BaseModel):
    hoTen: Optional[str] = None
    email: Optional[str] = None
    goal: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    isActive: Optional[int] = None
    phoneNumber: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    birthday: Optional[datetime] = None
    expiryDate: Optional[datetime] = None
