from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, date, timedelta, time as dt_time

from ..database import get_db
from ..models.user import User
from ..models.workout import Schedule
from ..models.facility import GymClass, ClassEnrollment
from ..middleware.auth import get_current_user

router = APIRouter(prefix="/api/schedules", tags=["Schedules"])


def _schedule_events(schedules, classes_teaching, classes_enrolled):
    """Merge workout schedules + class events into ScheduleWeek format."""
    events = []
    for s in schedules:
        if s.WorkoutDate:
            d = s.WorkoutDate
            events.append({
                "id": f"sched_{s.ScheduleID}",
                "start": datetime.combine(d, dt_time(8, 0)).isoformat(),
                "end": datetime.combine(d, dt_time(9, 0)).isoformat(),
                "title": s.routine.Name if s.routine else "Buổi tập",
                "meta": "Lịch tập",
                "color": "orange",
            })
    for c in classes_teaching:
        events.append({
            "id": f"teach_{c.ClassID}",
            "start": c.StartTime.isoformat(),
            "end": c.EndTime.isoformat(),
            "title": f"{c.Name} — {c.StudioRoom or 'TBD'}",
            "meta": f"Ca dạy · {c.CurrentEnrolled or 0}/{c.MaxCapacity} HV",
            "color": "green",
        })
    for c in classes_enrolled:
        events.append({
            "id": f"enroll_{c.ClassID}",
            "start": c.StartTime.isoformat(),
            "end": c.EndTime.isoformat(),
            "title": c.Name,
            "meta": f"Lớp học · {c.StudioRoom or ''}",
            "color": "blue",
        })
    return events


@router.get("")
def list_schedules(
    user_id: int = None,
    week_start: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target_id = user_id or current_user.UserID

    # Workout schedules
    schedules = db.query(Schedule).filter(Schedule.UserID == target_id).order_by(Schedule.WorkoutDate.desc()).all()

    # Classes teaching (PT)
    q_teach = db.query(GymClass).filter(
        GymClass.InstructorID == target_id, GymClass.IsDeleted == 0
    )
    # Classes enrolled (Member)
    enrolled_ids = [r[0] for r in db.query(ClassEnrollment.ClassID).filter(
        ClassEnrollment.MemberID == target_id, ClassEnrollment.Status == "Active"
    ).all()]
    q_enroll = db.query(GymClass).filter(
        GymClass.ClassID.in_(enrolled_ids), GymClass.IsDeleted == 0
    ) if enrolled_ids else None

    classes_teaching = q_teach.order_by(GymClass.StartTime).all()
    classes_enrolled = q_enroll.order_by(GymClass.StartTime).all() if q_enroll else []

    return _schedule_events(schedules, classes_teaching, classes_enrolled)


@router.get("/my")
def my_schedules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    uid = current_user.UserID
    schedules = db.query(Schedule).filter(Schedule.UserID == uid).order_by(Schedule.WorkoutDate.desc()).all()

    classes_teaching = db.query(GymClass).filter(
        GymClass.InstructorID == uid, GymClass.IsDeleted == 0
    ).order_by(GymClass.StartTime).all()

    enrolled_ids = [r[0] for r in db.query(ClassEnrollment.ClassID).filter(
        ClassEnrollment.MemberID == uid, ClassEnrollment.Status == "Active"
    ).all()]
    classes_enrolled = db.query(GymClass).filter(
        GymClass.ClassID.in_(enrolled_ids), GymClass.IsDeleted == 0
    ).order_by(GymClass.StartTime).all() if enrolled_ids else []

    return _schedule_events(schedules, classes_teaching, classes_enrolled)
