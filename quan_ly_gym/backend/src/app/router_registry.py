"""Router registry for FastAPI application.

Each entry is a tuple: (router, optional_prefix, optional_tags).
By centralising registration we keep ``main.py`` stable – adding a new router only requires
adding a new tuple to ``ROUTERS``.
"""

from fastapi import FastAPI

from .routes import (
    auth,
    members,
    trainers,
    dashboard,
    schedules,
    bookings,
    users,
    notifications,
    exercises,
    managers,
    streaks,
    ai,
    facility,
    pt_assignments,
    meal_plans,
    accounts,
    checkins,
)

ROUTERS = [
    auth.router,
    members.router,
    trainers.router,
    dashboard.router,
    schedules.router,
    bookings.router,
    users.router,
    notifications.router,
    exercises.router,
    managers.router,
    streaks.router,
    ai.router,
    facility.router,
    pt_assignments.router,
    meal_plans.router,
    accounts.router,
    checkins.router,
]


def register_routes(app: FastAPI) -> None:
    """Iterate over ``ROUTERS`` and include each router.

    Adding a new router in the future only requires appending to ``ROUTERS`` –
    ``main.py`` remains untouched, satisfying the Open‑Closed Principle.
    """
    for router in ROUTERS:
        app.include_router(router)
