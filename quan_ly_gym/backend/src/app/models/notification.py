from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime
from ..database import Base


class Notification(Base):
    __tablename__ = "Notifications"

    NotificationID = Column(Integer, primary_key=True, autoincrement=True)
    UserID = Column(Integer, ForeignKey("Users.UserID"))
    Message = Column(String)  # NVARCHAR(MAX)
    Type = Column(String(50))
    IsRead = Column(Integer, default=0)
    CreatedAt = Column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "AuditLogs"

    AuditID = Column(Integer, primary_key=True, autoincrement=True)
    UserID = Column(Integer)
    Action = Column(String(255))
    TableName = Column(String(100))
    RecordID = Column(Integer)
    OldData = Column(String)
    NewData = Column(String)
    CreatedAt = Column(DateTime, default=datetime.utcnow)
