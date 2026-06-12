from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AccountCreate(BaseModel):
    FullName: str
    Email: str
    Password: str
    RoleCode: str
    PhoneNumber: Optional[str] = None
    Gender: Optional[str] = None
    Birthday: Optional[datetime] = None
    IsActive: Optional[int] = 1


class AccountUpdate(BaseModel):
    FullName: Optional[str] = None
    Email: Optional[str] = None
    Password: Optional[str] = None
    PhoneNumber: Optional[str] = None
    Gender: Optional[str] = None
    Birthday: Optional[datetime] = None
    RoleCode: Optional[str] = None
    IsActive: Optional[int] = None


class AccountResponse(BaseModel):
    UserID: int
    FullName: Optional[str] = None
    Email: Optional[str] = None
    RoleCode: Optional[str] = None
    RoleName: Optional[str] = None
    IsActive: Optional[int] = 1
    PhoneNumber: Optional[str] = None
    Gender: Optional[str] = None
    Birthday: Optional[str] = None
    CreatedAt: Optional[str] = None

    class Config:
        from_attributes = True
