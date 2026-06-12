from sqlalchemy import Column, Integer, String, Float, ForeignKey, Numeric, Unicode, Date
from sqlalchemy.orm import relationship
from ..database import Base


class MemberProfile(Base):
    __tablename__ = "MemberProfiles"

    UserID = Column(Integer, ForeignKey("Users.UserID"), primary_key=True)
    Goal = Column(Unicode(255))
    Height = Column(Float)
    Weight = Column(Float)
    CurrentStreak = Column(Integer, default=0)
    LongestStreak = Column(Integer, default=0)
    LastAttendanceDate = Column(Date, nullable=True)

    user = relationship("User", back_populates="member_profile")


class PTProfile(Base):
    __tablename__ = "PTProfiles"

    UserID = Column(Integer, ForeignKey("Users.UserID"), primary_key=True)
    ExperienceYears = Column(Integer)
    Certifications = Column(Unicode)
    Specialty = Column(Unicode(255))
    TotalScore = Column(Integer, default=100)
    ResponseRate = Column(Numeric(5, 2), default=100.00)

    user = relationship("User", back_populates="pt_profile")
