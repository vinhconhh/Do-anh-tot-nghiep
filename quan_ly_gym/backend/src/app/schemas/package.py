from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# --- Membership Package Schemas ---
class MembershipPackageBase(BaseModel):
    Name: str
    Price: float
    DurationMonths: int
    Description: Optional[str] = None
    Benefits: Optional[str] = None
    IsVisible: Optional[bool] = True
    IsFeatured: Optional[bool] = False

class MembershipPackageCreate(MembershipPackageBase):
    pass

class MembershipPackageUpdate(BaseModel):
    Name: Optional[str] = None
    Price: Optional[float] = None
    DurationMonths: Optional[int] = None
    Description: Optional[str] = None
    Benefits: Optional[str] = None
    IsVisible: Optional[bool] = None
    IsFeatured: Optional[bool] = None

class MembershipPackageResponse(MembershipPackageBase):
    PackageID: int
    CreatedAt: Optional[datetime]

    class Config:
        from_attributes = True

# --- AI Package Schemas ---
class AIPackageBase(BaseModel):
    Name: str
    Price: float
    Credits: int
    Description: Optional[str] = None
    IsVisible: Optional[bool] = True

class AIPackageCreate(AIPackageBase):
    pass

class AIPackageUpdate(BaseModel):
    Name: Optional[str] = None
    Price: Optional[float] = None
    Credits: Optional[int] = None
    Description: Optional[str] = None
    IsVisible: Optional[bool] = None

class AIPackageResponse(AIPackageBase):
    PackageID: int
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
    package_price: Optional[float] = None
