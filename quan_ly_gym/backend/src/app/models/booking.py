from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class Booking(Base):
    __tablename__ = "Bookings"

    BookingID = Column(Integer, primary_key=True, autoincrement=True)
    MemberID = Column(Integer, ForeignKey("Users.UserID"))
    PTID = Column(Integer, ForeignKey("Users.UserID"))
    StartTime = Column(DateTime)
    EndTime = Column(DateTime)
    Status = Column(String(50))

    member = relationship("User", foreign_keys=[MemberID])
    pt = relationship("User", foreign_keys=[PTID])


class CheckIn(Base):
    __tablename__ = "CheckIns"

    CheckInID = Column(Integer, primary_key=True, autoincrement=True)
    UserID = Column(Integer, ForeignKey("Users.UserID"))
    ScheduleID = Column(Integer, ForeignKey("Schedules.ScheduleID"), nullable=True)
    BookingID = Column(Integer, ForeignKey("Bookings.BookingID"), nullable=True)
    CheckInTime = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    schedule = relationship("Schedule")
    booking = relationship("Booking")
