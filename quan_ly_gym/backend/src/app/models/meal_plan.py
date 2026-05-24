from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Unicode, UnicodeText
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class MealPlan(Base):
    """Thực đơn mẫu do manager tạo – hiển thị cho tất cả member xem."""
    __tablename__ = "MealPlans"

    PlanID = Column(Integer, primary_key=True, autoincrement=True)
    Name = Column(Unicode(255), nullable=False)           # Tên thực đơn / bữa ăn
    Category = Column(Unicode(100), nullable=False)       # Bữa sáng / Bữa chính / Bữa phụ
    Goal = Column(Unicode(255), nullable=True)            # Mục tiêu: tăng cơ, giảm mỡ, ...
    Calories = Column(Integer, default=0)
    Protein = Column(Float, default=0)                   # gram
    Carbs = Column(Float, default=0)                     # gram
    Fat = Column(Float, default=0)                       # gram
    Description = Column(UnicodeText, nullable=True)      # Mô tả / hướng dẫn chế biến
    ImageURL = Column(String(500), nullable=True)
    CreatedBy = Column(Integer, ForeignKey("Users.UserID"), nullable=True)
    CreatedAt = Column(DateTime, default=datetime.utcnow)
    UpdatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    creator = relationship("User", foreign_keys=[CreatedBy])
