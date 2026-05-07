from sqlalchemy import Column, Integer, Numeric, String, DateTime, Boolean
from datetime import datetime
from ..database import Base

class MembershipPackage(Base):
    __tablename__ = "MembershipPackages"

    PackageID = Column(Integer, primary_key=True, autoincrement=True)
    Name = Column(String(100), nullable=False)
    Price = Column(Numeric(18, 2), nullable=False)
    DurationMonths = Column(Integer, nullable=False)
    Description = Column(String(500))
    Benefits = Column(String)  # JSON string
    IsVisible = Column(Boolean, default=True)
    IsFeatured = Column(Boolean, default=False)
    CreatedAt = Column(DateTime, default=datetime.utcnow)

class AIPackage(Base):
    __tablename__ = "AIPackages"

    PackageID = Column(Integer, primary_key=True, autoincrement=True)
    Name = Column(String(100), nullable=False)
    Price = Column(Numeric(18, 2), nullable=False)
    Credits = Column(Integer, nullable=False)
    Description = Column(String(500))
    IsVisible = Column(Boolean, default=True)
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
