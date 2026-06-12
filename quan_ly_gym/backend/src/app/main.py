from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.cors import CORSMiddleware

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
    MealPlan,
    AssignedMeal,
    AIRequest,
    AIResponse,
    Notification,
    AuditLog,
    MemberPTRelation,
    MemberRequest,
)



import os
import logging
from fastapi import Request
from fastapi.responses import JSONResponse
from .router_registry import register_routes

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="QLGym API",
    description="Hệ thống quản lý phòng gym thông minh",
    version="1.0.0",
)

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

register_routes(app)


@app.get("/")
def root():
    return {"message": "QLGym API is running", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error"},
    )
