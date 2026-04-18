from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..models.workout import Schedule, WorkoutRoutine
from ..middleware.auth import get_current_user

router = APIRouter(prefix="/api/schedules", tags=["Schedules"])


@router.get("")
def list_schedules(
    user_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Schedule)
    if user_id:
        query = query.filter(Schedule.UserID == user_id)
    schedules = query.order_by(Schedule.WorkoutDate.desc()).all()
    result = []
    for s in schedules:
        routine_name = None
        if s.routine:
            routine_name = s.routine.Name
        result.append({
            "ScheduleID": s.ScheduleID,
            "UserID": s.UserID,
            "RoutineID": s.RoutineID,
            "RoutineName": routine_name,
            "WorkoutDate": s.WorkoutDate.isoformat() if s.WorkoutDate else None,
        })
    return result


@router.get("/my")
def my_schedules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    schedules = (
        db.query(Schedule)
        .filter(Schedule.UserID == current_user.UserID)
        .order_by(Schedule.WorkoutDate.desc())
        .all()
    )
    result = []
    for s in schedules:
        result.append({
            "ScheduleID": s.ScheduleID,
            "RoutineName": s.routine.Name if s.routine else None,
            "WorkoutDate": s.WorkoutDate.isoformat() if s.WorkoutDate else None,
        })
    return result
