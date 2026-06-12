from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Unicode
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base

class MealPlan(Base):
    __tablename__ = "MealPlans"

    PlanID = Column(Integer, primary_key=True, autoincrement=True)
    Name = Column(Unicode(255), nullable=False)
    Category = Column(Unicode(100), nullable=False)
    Goal = Column(Unicode(255), nullable=True)
    Calories = Column(Integer, default=0)
    Protein = Column(Float, default=0)
    Carbs = Column(Float, default=0)
    Fat = Column(Float, default=0)
    Description = Column(Unicode, nullable=True)
    ImageURL = Column(String(500), nullable=True)
    CreatedBy = Column(Integer, ForeignKey("Users.UserID"), nullable=True)
    CreatedAt = Column(DateTime, default=datetime.utcnow)
    UpdatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    creator = relationship("User", foreign_keys=[CreatedBy])

class AssignedMeal(Base):
    __tablename__ = "AssignedMeals"

    AssignmentID = Column(Integer, primary_key=True, autoincrement=True)
    PTID = Column(Integer, ForeignKey("Users.UserID"), nullable=False)
    MemberID = Column(Integer, ForeignKey("Users.UserID"), nullable=False)
    MealPlanID = Column(Integer, ForeignKey("MealPlans.PlanID"), nullable=False)
    Note = Column(Unicode(500), nullable=True)
    AssignedDate = Column(DateTime, nullable=False)
    Status = Column(String(50), default="Active")
    CreatedAt = Column(DateTime, default=datetime.utcnow)

    pt = relationship("User", foreign_keys=[PTID])
    member = relationship("User", foreign_keys=[MemberID])
    meal_plan = relationship("MealPlan")
