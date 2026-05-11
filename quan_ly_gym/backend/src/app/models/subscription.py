from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base

class UserSubscription(Base):
    __tablename__ = "UserSubscriptions"

    SubscriptionID = Column(Integer, primary_key=True, autoincrement=True)
    UserID = Column(Integer, ForeignKey("Users.UserID"), nullable=False)
    PackageType = Column(String(50), nullable=False) # 'GYM' or 'AI'
    PackageID = Column(Integer, nullable=False) # ID of MembershipPackage or AIPackage
    StartDate = Column(DateTime, default=datetime.utcnow)
    EndDate = Column(DateTime, nullable=True)
    Status = Column(String(50), default="Active") # Active, Expired, Cancelled
    CreatedAt = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="subscriptions")
