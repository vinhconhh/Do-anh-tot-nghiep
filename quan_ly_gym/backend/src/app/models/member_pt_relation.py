from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Unicode
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class MemberPTRelation(Base):
    __tablename__ = "MemberPTRelations"

    RelationID = Column(Integer, primary_key=True, autoincrement=True)
    MemberID = Column(Integer, ForeignKey("Users.UserID"), nullable=False)
    PTID = Column(Integer, ForeignKey("Users.UserID"), nullable=False)
    AssignedBy = Column(Integer, ForeignKey("Users.UserID"), nullable=True)
    Status = Column(String(50), default="Active")
    CreatedAt = Column(DateTime, default=datetime.utcnow)
    UpdatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    member = relationship("User", foreign_keys=[MemberID])
    pt = relationship("User", foreign_keys=[PTID])
    assigner = relationship("User", foreign_keys=[AssignedBy])


class MemberRequest(Base):
    __tablename__ = "MemberRequests"

    RequestID = Column(Integer, primary_key=True, autoincrement=True)
    MemberID = Column(Integer, ForeignKey("Users.UserID"), nullable=False)
    RequestType = Column(String(100), nullable=False)
    Note = Column(Unicode(1000), nullable=True)
    Status = Column(String(50), default="Pending")
    ReviewedBy = Column(Integer, ForeignKey("Users.UserID"), nullable=True)
    ReviewedAt = Column(DateTime, nullable=True)
    CreatedAt = Column(DateTime, default=datetime.utcnow)

    member = relationship("User", foreign_keys=[MemberID])
    reviewer = relationship("User", foreign_keys=[ReviewedBy])
