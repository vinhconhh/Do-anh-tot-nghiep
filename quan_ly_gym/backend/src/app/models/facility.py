from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Date, Enum, UniqueConstraint, Unicode
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
    Name        = Column(Unicode(200), nullable=False)
    Category    = Column(Unicode(100))
    Zone        = Column(Unicode(100))
    Quantity    = Column(Integer, default=1)
    Status      = Column(Unicode(50), default="Hoạt động")
    CreatedAt   = Column(DateTime, default=datetime.now)
    UpdatedAt   = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    exercises   = relationship("GymExercise", back_populates="gym_equipment")


# ──────────────────────────────────────────
# Exercise (Bài tập)
# ──────────────────────────────────────────
class GymExercise(Base):
    """Danh mục bài tập với MET value và liên kết máy tập."""
    __tablename__ = "GymExercises"

    ExerciseID    = Column(Integer, primary_key=True, autoincrement=True)
    Name          = Column(Unicode(255), nullable=False)
    AssignmentName = Column(Unicode(255))
    Type          = Column(Unicode(100))
    TargetMuscle  = Column(Unicode(200))
    MetValue      = Column(Float, default=0.0)
    EquipmentID   = Column(Integer, ForeignKey("GymEquipments.EquipmentID"), nullable=True)
    VideoURL      = Column(String(500), nullable=True)   # Link video hướng dẫn
    IsDeleted     = Column(Integer, default=0)
    CreatedAt     = Column(DateTime, default=datetime.now)
    UpdatedAt     = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    gym_equipment = relationship("GymEquipment", back_populates="exercises")


# ──────────────────────────────────────────
# GymClass (Lớp học nhóm)
# ──────────────────────────────────────────
# Intensity → min rest gap (minutes) between consecutive classes for same instructor
INTENSITY_MIN_GAP = {"high": 30, "medium": 20, "low": 15}


class GymClass(Base):
    """Lớp học nhóm — InstructorID liên kết PT thực từ Users.
    Supports recurring schedules via ParentClassID (parent = template, children = instances).
    """
    __tablename__ = "GymClasses"

    ClassID         = Column(Integer, primary_key=True, autoincrement=True)
    Name            = Column(Unicode(200), nullable=False)
    InstructorID    = Column(Integer, ForeignKey("Users.UserID"), nullable=True)
    InstructorName  = Column(Unicode(200))          # fallback text (vẫn giữ)
    StudioRoom      = Column(Unicode(100))
    MaxCapacity     = Column(Integer, default=20)
    CurrentEnrolled = Column(Integer, default=0)   # fast-read counter
    StartTime       = Column(DateTime, nullable=False)
    EndTime         = Column(DateTime, nullable=False)
    # Intensity level — drives min rest gap validation
    Intensity       = Column(String(20), default="medium")   # "high", "medium", "low"
    # Recurring schedule fields
    IsRecurring       = Column(Integer, default=0)           # 0=single, 1=recurring
    RecurringDays     = Column(String(50))                   # "0,2,4" → Mon,Wed,Fri
    RecurringStartDate = Column(Date, nullable=True)
    RecurringEndDate   = Column(Date, nullable=True)
    ParentClassID     = Column(Integer, ForeignKey("GymClasses.ClassID"), nullable=True)
    AttendanceSubmitted = Column(Integer, default=0)
    # Soft delete + timestamps
    IsDeleted       = Column(Integer, default=0)
    CreatedAt       = Column(DateTime, default=datetime.now)
    UpdatedAt       = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    instructor    = relationship("User", foreign_keys=[InstructorID])
    enrollments   = relationship("ClassEnrollment", back_populates="gym_class", cascade="all, delete-orphan")
    parent_class  = relationship("GymClass", remote_side=[ClassID], foreign_keys=[ParentClassID], backref="child_classes")


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
    EnrolledAt = Column(DateTime, default=datetime.now)
    Status     = Column(String(50), default="Active")   # Active | Cancelled | Pending
    AttendanceStatus = Column(String(20), nullable=True) # "Present" | "Absent" | None

    gym_class  = relationship("GymClass", back_populates="enrollments")
    member     = relationship("User", foreign_keys=[MemberID])


# ──────────────────────────────────────────
# AssignedExercise (HLV phân bài tập cho Member)
# ──────────────────────────────────────────
class AssignedExercise(Base):
    """Bài tập được HLV phân cho hội viên."""
    __tablename__ = "AssignedExercises"

    AssignmentID  = Column(Integer, primary_key=True, autoincrement=True)
    PTID          = Column(Integer, ForeignKey("Users.UserID"), nullable=False)
    MemberID      = Column(Integer, ForeignKey("Users.UserID"), nullable=False)
    ExerciseID    = Column(Integer, ForeignKey("GymExercises.ExerciseID"), nullable=False)
    Sets          = Column(Integer, default=3)
    Reps          = Column(Integer, default=12)
    Duration      = Column(Integer, nullable=True)    # phút, cho cardio
    Weight        = Column(Float, nullable=True)      # kg
    Note          = Column(Unicode(500), nullable=True) # ghi chú từ HLV
    AssignedDate  = Column(Date, nullable=False)
    Status        = Column(String(50), default="Active")  # Active | Completed
    CreatedAt     = Column(DateTime, default=datetime.now)

    pt       = relationship("User", foreign_keys=[PTID])
    member   = relationship("User", foreign_keys=[MemberID])
    exercise = relationship("GymExercise")
