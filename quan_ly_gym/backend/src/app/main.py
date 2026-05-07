from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.cors import CORSMiddleware

# Import all models so SQLAlchemy knows about them
from .models import (
    User,
    Role,
    Permission,
    RolePermission,
    RefreshToken,
    UserSession,
    MemberProfile,
    PTProfile,
    MuscleGroup,
    Equipment,
    Exercise,
    GymEquipment,
    GymExercise,
    GymClass,
    ClassEnrollment,
    WorkoutRoutine,
    WorkoutRoutineDetail,
    Schedule,
    Booking,
    CheckIn,
    LogWorkout,
    LogWorkoutDetail,
    BodyMetric,
    ProgressPhoto,
    Invoice,
    Transaction,
    DietPlan,
    Meal,
    MealItem,
    AIRequest,
    AIResponse,
    Notification,
    AuditLog,
    PTRequest,
    PTScoreLog,
    MemberStreak,
    CheckInLog,
    MembershipPackage,
    AIPackage,
    Promotion,
)

from .routes.auth import router as auth_router
from .routes.members import router as members_router
from .routes.trainers import router as trainers_router
from .routes.dashboard import router as dashboard_router
from .routes.schedules import router as schedules_router
from .routes.bookings import router as bookings_router
from .routes.users import router as users_router
from .routes.notifications import router as notifications_router
from .routes.exercises import router as exercises_router
from .routes.pt_requests import router as pt_requests_router
from .routes.streaks import router as streaks_router
from .routes.ai import router as ai_router
from .routes.packages import router as packages_router
from .routes.facility import router as facility_router

import os
import logging
from fastapi import Request
from fastapi.responses import JSONResponse
from .router_registry import register_routes

# Configure basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="QLGym API",
    description="Hệ thống quản lý phòng gym thông minh",
    version="1.0.0",
)

# CORS – configurable origins via ALLOWED_ORIGINS env var (comma‑separated)
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*")
if allowed_origins.strip() == "*":
    origins = ["*"]
else:
    origins = [origin.strip() for origin in allowed_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers via centralized registry
register_routes(app)


@app.get("/")
def root():
    return {"message": "QLGym API is running", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}

# Global exception handler – returns JSON error and logs traceback
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error"},
    )
