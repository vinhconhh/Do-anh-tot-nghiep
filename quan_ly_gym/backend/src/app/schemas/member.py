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
    # MemberProfile fields
    Goal: Optional[str] = None
    Height: Optional[float] = None
    Weight: Optional[float] = None
    AIQuota: Optional[int] = 0

    class Config:
        from_attributes = True


class MemberCreate(BaseModel):
    hoTen: str
    email: str
    matKhau: Optional[str] = "123456"
    goal: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None


class MemberUpdate(BaseModel):
    hoTen: Optional[str] = None
    email: Optional[str] = None
    goal: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    isActive: Optional[int] = None
