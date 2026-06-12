from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Unicode
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class PTRequest(Base):
    __tablename__ = "PTRequests"

    RequestID = Column(Integer, primary_key=True, autoincrement=True)
    MemberID = Column(Integer, ForeignKey("Users.UserID"), nullable=False)
    PTID = Column(Integer, ForeignKey("Users.UserID"), nullable=False)
    MemberGoal = Column(Unicode(500))
    Note = Column(Unicode(1000))
    ExperienceLevel = Column(String(50), default="new")
    BodyNote = Column(Unicode(1000), nullable=True)
    Status = Column(String(50), default="Pending")
    ExpiresAt = Column(DateTime, nullable=False)
    RespondedAt = Column(DateTime, nullable=True)
    CreatedAt = Column(DateTime, default=datetime.utcnow)

    member = relationship("User", foreign_keys=[MemberID])
    pt = relationship("User", foreign_keys=[PTID])


class PTScoreLog(Base):
    __tablename__ = "PTScoreLog"

    LogID = Column(Integer, primary_key=True, autoincrement=True)
    PTID = Column(Integer, ForeignKey("Users.UserID"), nullable=False)
    Points = Column(Integer, nullable=False)
    Reason = Column(Unicode(255))
    ReferenceID = Column(Integer, nullable=True)
    CreatedAt = Column(DateTime, default=datetime.utcnow)

    pt = relationship("User", foreign_keys=[PTID])
