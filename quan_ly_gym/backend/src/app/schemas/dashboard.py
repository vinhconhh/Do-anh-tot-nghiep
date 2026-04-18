from pydantic import BaseModel
from typing import Optional, List


class DashboardStats(BaseModel):
    totalMembers: int = 0
    totalTrainers: int = 0
    totalRevenue: float = 0
    aiUsed: int = 0
    aiTotal: int = 0
    pendingRequests: int = 0


class RevenueItem(BaseModel):
    month: str
    revenue: float
    newMembers: int = 0


class RecentMember(BaseModel):
    UserID: int
    FullName: Optional[str] = None
    Email: Optional[str] = None
    CreatedAt: Optional[str] = None
    RoleCode: Optional[str] = None
    Goal: Optional[str] = None

    class Config:
        from_attributes = True


class MemberDashboardStats(BaseModel):
    aiQuota: int = 0
    aiUsed: int = 0
    sessionsCompleted: int = 0
    totalSchedules: int = 0
    streak: int = 0
    weight: Optional[float] = None
