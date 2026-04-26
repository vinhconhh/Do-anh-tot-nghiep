from sqlalchemy import Column, Integer, Numeric, String, DateTime, Boolean
from datetime import datetime
from ..database import Base

class MembershipPackage(Base):
    __tablename__ = "MembershipPackages"

    MaGoi = Column(Integer, primary_key=True, autoincrement=True)
    TenGoi = Column(String(100), nullable=False)
    Gia = Column(Numeric(18, 2), nullable=False)
    ThoiHan = Column(Integer, nullable=False)
    MoTa = Column(String(500))
    QuyenLoi = Column(String)  # JSON string
    HienThi = Column(Boolean, default=True)
    NoiBat = Column(Boolean, default=False)
    CreatedAt = Column(DateTime, default=datetime.utcnow)

class AIPackage(Base):
    __tablename__ = "AIPackages"

    MaGoiAi = Column(Integer, primary_key=True, autoincrement=True)
    TenGoi = Column(String(100), nullable=False)
    Gia = Column(Numeric(18, 2), nullable=False)
    SoLuot = Column(Integer, nullable=False)
    MoTa = Column(String(500))
    HienThi = Column(Boolean, default=True)
    CreatedAt = Column(DateTime, default=datetime.utcnow)

class Promotion(Base):
    __tablename__ = "Promotions"

    PromotionID = Column(Integer, primary_key=True, autoincrement=True)
    PromoCode = Column(String(50), unique=True, nullable=False)
    DiscountType = Column(String(20), nullable=False) # 'PERCENT' or 'AMOUNT'
    DiscountValue = Column(Numeric(18, 2), nullable=False)
    ExpiryDate = Column(DateTime, nullable=True)
    IsActive = Column(Boolean, default=True)
    Description = Column(String(255))
    CreatedAt = Column(DateTime, default=datetime.utcnow)
