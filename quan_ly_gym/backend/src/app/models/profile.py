from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base


class MemberProfile(Base):
    __tablename__ = "MemberProfiles"

    UserID = Column(Integer, ForeignKey("Users.UserID"), primary_key=True)
    Goal = Column(String(255))
    Height = Column(Float)
    Weight = Column(Float)
    AIQuota = Column(Integer, default=0)

    user = relationship("User", back_populates="member_profile")


class PTProfile(Base):
    __tablename__ = "PTProfiles"

    UserID = Column(Integer, ForeignKey("Users.UserID"), primary_key=True)
    ExperienceYears = Column(Integer)
    Certifications = Column(String)  # NVARCHAR(MAX)
    Specialty = Column(String(255))

    user = relationship("User", back_populates="pt_profile")
