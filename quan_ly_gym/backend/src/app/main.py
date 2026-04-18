from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import all models so SQLAlchemy knows about them
from .models import *  # noqa: F401, F403

from .routes.auth import router as auth_router
from .routes.members import router as members_router
from .routes.trainers import router as trainers_router
from .routes.dashboard import router as dashboard_router
from .routes.schedules import router as schedules_router
from .routes.bookings import router as bookings_router
from .routes.users import router as users_router
from .routes.notifications import router as notifications_router

app = FastAPI(
    title="QLGym API",
    description="Hệ thống quản lý phòng gym thông minh",
    version="1.0.0",
)

# CORS – allow frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(auth_router)
app.include_router(members_router)
app.include_router(trainers_router)
app.include_router(dashboard_router)
app.include_router(schedules_router)
app.include_router(bookings_router)
app.include_router(users_router)
app.include_router(notifications_router)


@app.get("/")
def root():
    return {"message": "QLGym API is running", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}
