from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class DietPlan(Base):
    __tablename__ = "DietPlans"

    DietID = Column(Integer, primary_key=True, autoincrement=True)
    UserID = Column(Integer, ForeignKey("Users.UserID"))
    Name = Column(String(255))
    CreatedAt = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    meals = relationship("Meal", back_populates="diet")


class Meal(Base):
    __tablename__ = "Meals"

    MealID = Column(Integer, primary_key=True, autoincrement=True)
    DietID = Column(Integer, ForeignKey("DietPlans.DietID"))
    MealType = Column(String(50))

    diet = relationship("DietPlan", back_populates="meals")
    items = relationship("MealItem", back_populates="meal")


class MealItem(Base):
    __tablename__ = "MealItems"

    ItemID = Column(Integer, primary_key=True, autoincrement=True)
    MealID = Column(Integer, ForeignKey("Meals.MealID"))
    FoodName = Column(String(255))
    Calories = Column(Integer)
    Protein = Column(Float)
    Carbs = Column(Float)
    Fat = Column(Float)

    meal = relationship("Meal", back_populates="items")
