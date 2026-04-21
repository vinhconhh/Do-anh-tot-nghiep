from sqlalchemy import Column, Integer, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class MemberStreak(Base):
    __tablename__ = "MemberStreak"

    StreakID = Column(Integer, primary_key=True, autoincrement=True)
    UserID = Column(Integer, ForeignKey("Users.UserID"), nullable=False, unique=True)
    CurrentStreak = Column(Integer, default=0)
    LongestStreak = Column(Integer, default=0)
    TotalPoints = Column(Integer, default=0)
    LastCheckInDate = Column(Date, nullable=True)

    user = relationship("User", foreign_keys=[UserID])


class CheckInLog(Base):
    __tablename__ = "CheckInLog"

    LogID = Column(Integer, primary_key=True, autoincrement=True)
    UserID = Column(Integer, ForeignKey("Users.UserID"), nullable=False)
    CheckInDate = Column(Date, nullable=False)
    Points = Column(Integer, default=0)
    StreakDay = Column(Integer, default=1)
    CreatedAt = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", foreign_keys=[UserID])
