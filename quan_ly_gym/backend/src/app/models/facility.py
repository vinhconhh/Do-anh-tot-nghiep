from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base
import enum


# ──────────────────────────────────────────
# Equipment (Máy tập)
# ──────────────────────────────────────────
class EquipmentStatus(str, enum.Enum):
    active      = "Hoạt động"
    maintenance = "Đang bảo trì"
    broken      = "Hỏng"


class GymEquipment(Base):
    """Máy tập / thiết bị phòng gym."""
    __tablename__ = "GymEquipments"

    EquipmentID = Column(Integer, primary_key=True, autoincrement=True)
    Name        = Column(String(200), nullable=False)
    Category    = Column(String(100))
    Zone        = Column(String(100))
    Quantity    = Column(Integer, default=1)
    Status      = Column(String(50), default="Hoạt động")
    CreatedAt   = Column(DateTime, default=datetime.utcnow)
    UpdatedAt   = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    exercises   = relationship("GymExercise", back_populates="gym_equipment")


# ──────────────────────────────────────────
# Exercise (Bài tập)
# ──────────────────────────────────────────
class GymExercise(Base):
    """Danh mục bài tập với MET value và liên kết máy tập."""
    __tablename__ = "GymExercises"

    ExerciseID    = Column(Integer, primary_key=True, autoincrement=True)
    Name          = Column(String(255), nullable=False)
    TenBaiTap     = Column(String(255))
    Type          = Column(String(100))
    TargetMuscle  = Column(String(200))
    MetValue      = Column(Float, default=0.0)
    EquipmentID   = Column(Integer, ForeignKey("GymEquipments.EquipmentID"), nullable=True)
    IsDeleted     = Column(Integer, default=0)
    CreatedAt     = Column(DateTime, default=datetime.utcnow)
    UpdatedAt     = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    gym_equipment = relationship("GymEquipment", back_populates="exercises")


# ──────────────────────────────────────────
# GymClass (Lớp học nhóm)
# ──────────────────────────────────────────
class GymClass(Base):
    """Lớp học nhóm — InstructorID liên kết PT thực từ Users."""
    __tablename__ = "GymClasses"

    ClassID         = Column(Integer, primary_key=True, autoincrement=True)
    Name            = Column(String(200), nullable=False)
    InstructorID    = Column(Integer, ForeignKey("Users.UserID"), nullable=True)
    InstructorName  = Column(String(200))          # fallback text (vẫn giữ)
    StudioRoom      = Column(String(100))
    MaxCapacity     = Column(Integer, default=20)
    CurrentEnrolled = Column(Integer, default=0)   # fast-read counter
    StartTime       = Column(DateTime, nullable=False)
    EndTime         = Column(DateTime, nullable=False)
    IsDeleted       = Column(Integer, default=0)
    CreatedAt       = Column(DateTime, default=datetime.utcnow)
    UpdatedAt       = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    instructor  = relationship("User", foreign_keys=[InstructorID])
    enrollments = relationship("ClassEnrollment", back_populates="gym_class", cascade="all, delete-orphan")


# ──────────────────────────────────────────
# ClassEnrollment (Đăng ký lớp học)
# ──────────────────────────────────────────
class ClassEnrollment(Base):
    """Liên kết Member ↔ GymClass với trạng thái đăng ký."""
    __tablename__ = "ClassEnrollments"
    __table_args__ = (
        UniqueConstraint("ClassID", "MemberID", name="uq_class_member"),
    )

    EnrollID   = Column(Integer, primary_key=True, autoincrement=True)
    ClassID    = Column(Integer, ForeignKey("GymClasses.ClassID"), nullable=False)
    MemberID   = Column(Integer, ForeignKey("Users.UserID"), nullable=False)
    EnrolledAt = Column(DateTime, default=datetime.utcnow)
    Status     = Column(String(50), default="Active")   # Active | Cancelled

    gym_class  = relationship("GymClass", back_populates="enrollments")
    member     = relationship("User", foreign_keys=[MemberID])
