from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base


class MuscleGroup(Base):
    __tablename__ = "MuscleGroups"

    MuscleGroupID = Column(Integer, primary_key=True, autoincrement=True)
    Name = Column(String(100), unique=True)

    exercises = relationship("Exercise", back_populates="muscle_group")


class Equipment(Base):
    __tablename__ = "Equipments"

    EquipmentID = Column(Integer, primary_key=True, autoincrement=True)
    Name = Column(String(100), unique=True)

    exercises = relationship("Exercise", back_populates="equipment")


class Exercise(Base):
    __tablename__ = "Exercises"

    ExerciseID = Column(Integer, primary_key=True, autoincrement=True)
    Name = Column(String(255))
    MuscleGroupID = Column(Integer, ForeignKey("MuscleGroups.MuscleGroupID"))
    EquipmentID = Column(Integer, ForeignKey("Equipments.EquipmentID"))
    IsDeleted = Column(Integer, default=0)

    muscle_group = relationship("MuscleGroup", back_populates="exercises")
    equipment = relationship("Equipment", back_populates="exercises")
