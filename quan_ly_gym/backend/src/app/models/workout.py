from sqlalchemy import Column, Integer, String, DateTime, Date, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class WorkoutRoutine(Base):
    __tablename__ = "WorkoutRoutines"

    RoutineID = Column(Integer, primary_key=True, autoincrement=True)
    Name = Column(String(255))
    CreatedBy = Column(Integer, ForeignKey("Users.UserID"))
    CreatedAt = Column(DateTime, default=datetime.utcnow)

    creator = relationship("User")
    details = relationship("WorkoutRoutineDetail", back_populates="routine")


class WorkoutRoutineDetail(Base):
    __tablename__ = "WorkoutRoutineDetails"

    DetailID = Column(Integer, primary_key=True, autoincrement=True)
    RoutineID = Column(Integer, ForeignKey("WorkoutRoutines.RoutineID"))
    ExerciseID = Column(Integer, ForeignKey("Exercises.ExerciseID"))
    Sets = Column(Integer)
    Reps = Column(Integer)

    routine = relationship("WorkoutRoutine", back_populates="details")
    exercise = relationship("Exercise")


class Schedule(Base):
    __tablename__ = "Schedules"

    ScheduleID = Column(Integer, primary_key=True, autoincrement=True)
    UserID = Column(Integer, ForeignKey("Users.UserID"))
    RoutineID = Column(Integer, ForeignKey("WorkoutRoutines.RoutineID"))
    WorkoutDate = Column(Date)

    user = relationship("User")
    routine = relationship("WorkoutRoutine")
