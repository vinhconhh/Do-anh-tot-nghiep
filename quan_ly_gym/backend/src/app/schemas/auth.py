from pydantic import BaseModel
from typing import Optional


class LoginRequest(BaseModel):
    tenDangNhap: str  # maps to Email
    matKhau: str      # maps to PasswordHash (plaintext to verify)


class RegisterRequest(BaseModel):
    hoTen: str
    email: str
    matKhau: str
    vaiTro: Optional[str] = "MEMBER"


class UserInToken(BaseModel):
    UserID: int
    FullName: str
    Email: str
    RoleCode: str

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    user: dict
    token: str
