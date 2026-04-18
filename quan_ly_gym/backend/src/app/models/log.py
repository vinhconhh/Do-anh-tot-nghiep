from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class LogWorkout(Base):
    __tablename__ = "LogWorkouts"

    LogID = Column(Integer, primary_key=True, autoincrement=True)
    UserID = Column(Integer, ForeignKey("Users.UserID"))
    WorkoutDate = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    details = relationship("LogWorkoutDetail", back_populates="log")


class LogWorkoutDetail(Base):
    __tablename__ = "LogWorkoutDetails"

    DetailID = Column(Integer, primary_key=True, autoincrement=True)
    LogID = Column(Integer, ForeignKey("LogWorkouts.LogID"))
    ExerciseID = Column(Integer, ForeignKey("Exercises.ExerciseID"))
    SetNumber = Column(Integer)
    Reps = Column(Integer)
    Weight = Column(Float)

    log = relationship("LogWorkout", back_populates="details")
    exercise = relationship("Exercise")


class BodyMetric(Base):
    __tablename__ = "BodyMetrics"

    MetricID = Column(Integer, primary_key=True, autoincrement=True)
    UserID = Column(Integer, ForeignKey("Users.UserID"))
    Weight = Column(Float)
    BodyFat = Column(Float)
    BMI = Column(Float)
    MeasuredAt = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")


class ProgressPhoto(Base):
    __tablename__ = "ProgressPhotos"

    PhotoID = Column(Integer, primary_key=True, autoincrement=True)
    UserID = Column(Integer, ForeignKey("Users.UserID"))
    ImageURL = Column(String(500))
    UploadedAt = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
