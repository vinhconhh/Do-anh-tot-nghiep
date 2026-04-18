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
