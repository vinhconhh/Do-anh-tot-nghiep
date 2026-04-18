from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class AIRequest(Base):
    __tablename__ = "AIRequests"

    RequestID = Column(Integer, primary_key=True, autoincrement=True)
    UserID = Column(Integer, ForeignKey("Users.UserID"))
    Prompt = Column(String)  # NVARCHAR(MAX)
    Model = Column(String(100))
    CreatedAt = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    responses = relationship("AIResponse", back_populates="request")


class AIResponse(Base):
    __tablename__ = "AIResponses"

    ResponseID = Column(Integer, primary_key=True, autoincrement=True)
    RequestID = Column(Integer, ForeignKey("AIRequests.RequestID"))
    ResponseData = Column(String)  # NVARCHAR(MAX)
    TokensUsed = Column(Integer)
    Cost = Column(Numeric(10, 4))
    Status = Column(String(50))
    CreatedAt = Column(DateTime, default=datetime.utcnow)

    request = relationship("AIRequest", back_populates="responses")
