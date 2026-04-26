from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# --- Membership Package Schemas ---
class MembershipPackageBase(BaseModel):
    TenGoi: str
    Gia: float
    ThoiHan: int
    MoTa: Optional[str] = None
    QuyenLoi: Optional[str] = None
    HienThi: Optional[bool] = True
    NoiBat: Optional[bool] = False

class MembershipPackageCreate(MembershipPackageBase):
    pass

class MembershipPackageUpdate(BaseModel):
    TenGoi: Optional[str] = None
    Gia: Optional[float] = None
    ThoiHan: Optional[int] = None
    MoTa: Optional[str] = None
    QuyenLoi: Optional[str] = None
    HienThi: Optional[bool] = None
    NoiBat: Optional[bool] = None

class MembershipPackageResponse(MembershipPackageBase):
    MaGoi: int
    CreatedAt: Optional[datetime]

    class Config:
        from_attributes = True

# --- AI Package Schemas ---
class AIPackageBase(BaseModel):
    TenGoi: str
    Gia: float
    SoLuot: int
    MoTa: Optional[str] = None
    HienThi: Optional[bool] = True

class AIPackageCreate(AIPackageBase):
    pass

class AIPackageUpdate(BaseModel):
    TenGoi: Optional[str] = None
    Gia: Optional[float] = None
    SoLuot: Optional[int] = None
    MoTa: Optional[str] = None
    HienThi: Optional[bool] = None

class AIPackageResponse(AIPackageBase):
    MaGoiAi: int
    CreatedAt: Optional[datetime]

    class Config:
        from_attributes = True

# --- Promotion Schemas ---
class PromotionBase(BaseModel):
    PromoCode: str
    DiscountType: str
    DiscountValue: float
    ExpiryDate: Optional[datetime] = None
    IsActive: Optional[bool] = True
    Description: Optional[str] = None

class PromotionCreate(PromotionBase):
    pass

class PromotionUpdate(BaseModel):
    PromoCode: Optional[str] = None
    DiscountType: Optional[str] = None
    DiscountValue: Optional[float] = None
    ExpiryDate: Optional[datetime] = None
    IsActive: Optional[bool] = None
    Description: Optional[str] = None

class PromotionResponse(PromotionBase):
    PromotionID: int
    CreatedAt: Optional[datetime]

    class Config:
        from_attributes = True

class VerifyCodeRequest(BaseModel):
    code: str
    package_price: Optional[float] = None # Giá tiền gói nếu tính theo phần trăm
