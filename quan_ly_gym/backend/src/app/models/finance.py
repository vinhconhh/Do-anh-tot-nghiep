from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class Invoice(Base):
    __tablename__ = "Invoices"

    InvoiceID = Column(Integer, primary_key=True, autoincrement=True)
    UserID = Column(Integer, ForeignKey("Users.UserID"))
    TotalAmount = Column(Numeric(10, 2))
    Status = Column(String(50), default="Pending")
    CreatedAt = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    transactions = relationship("Transaction", back_populates="invoice")


class Transaction(Base):
    __tablename__ = "Transactions"

    TransactionID = Column(Integer, primary_key=True, autoincrement=True)
    UserID = Column(Integer, ForeignKey("Users.UserID"))
    InvoiceID = Column(Integer, ForeignKey("Invoices.InvoiceID"))
    Amount = Column(Numeric(10, 2))
    Status = Column(String(50))
    CreatedAt = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    invoice = relationship("Invoice", back_populates="transactions")


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
