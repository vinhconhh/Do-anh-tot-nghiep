from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from datetime import datetime, date, timedelta, time as dt_time
from ..database import get_db
from ..models.user import User
from ..models.workout import Schedule
from ..models.facility import GymClass, ClassEnrollment
from ..models.booking import Booking
from ..middleware.auth import get_current_user

router = APIRouter(prefix="/api/schedules", tags=["Schedules"])


def _schedule_events(db, schedules, classes_teaching, classes_enrolled, pt_bookings, target_id):
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
        target_class_ids = [c.ClassID]
        if c.ParentClassID:
            target_class_ids.append(c.ParentClassID)
            
        active_count = db.query(ClassEnrollment.MemberID).filter(
            ClassEnrollment.ClassID.in_(target_class_ids),
            ClassEnrollment.Status == "Active"
        ).distinct().count()
        
        events.append({
            "id": f"teach_{c.ClassID}",
            "start": c.StartTime.isoformat(),
            "end": c.EndTime.isoformat(),
            "title": f"{c.Name} — {c.StudioRoom or 'TBD'}",
            "meta": f"Ca dạy · {active_count}/{c.MaxCapacity or 20} HV",
            "color": "green",
        })
    for c in classes_enrolled:
        target_ids = [c.ClassID]
        if c.ParentClassID:
            target_ids.append(c.ParentClassID)
            
        enrolls = db.query(ClassEnrollment).filter(
            ClassEnrollment.ClassID.in_(target_ids),
            ClassEnrollment.MemberID == target_id,
            ClassEnrollment.Status == "Active"
        ).all()
        
        att_status = None
        for e in enrolls:
            if e.ClassID == c.ClassID and e.AttendanceStatus:
                att_status = e.AttendanceStatus
                break
            if e.AttendanceStatus:
                att_status = e.AttendanceStatus
            
        events.append({
            "id": f"enroll_{c.ClassID}",
            "start": c.StartTime.isoformat(),
            "end": c.EndTime.isoformat(),
            "title": c.Name,
            "meta": f"Lớp học · {c.StudioRoom or ''}",
            "attendanceStatus": att_status,
            "color": "blue",
        })
    for b in pt_bookings:
        if b.MemberID == target_id:
            pt_name = b.pt.FullName if b.pt else "PT"
            title = f"Tập PT: {pt_name}"
            meta = "Lịch tập cùng PT"
            color = "purple"
        elif b.PTID == target_id:
            member_name = b.member.FullName if b.member else "HV"
            title = f"Dạy PT: {member_name}"
            meta = "Lịch hướng dẫn"
            color = "purple"
        else:
            title = "Tập PT"
            meta = "Lịch tập"
            color = "purple"

        events.append({
            "id": f"pt_booking_{b.BookingID}",
            "start": b.StartTime.isoformat() if b.StartTime else "",
            "end": b.EndTime.isoformat() if b.EndTime else "",
            "title": title,
            "meta": meta,
            "color": color,
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

    schedules = db.query(Schedule).filter(Schedule.UserID == target_id).order_by(Schedule.WorkoutDate.desc()).all()

    q_teach = db.query(GymClass).filter(
        GymClass.InstructorID == target_id, 
        GymClass.IsDeleted == 0,
        or_(GymClass.IsRecurring == 0, GymClass.IsRecurring == None)
    )
    enrolled_ids = [r[0] for r in db.query(ClassEnrollment.ClassID).filter(
        ClassEnrollment.MemberID == target_id, ClassEnrollment.Status == "Active"
    ).all()]
    
    if enrolled_ids:
        q_enroll = db.query(GymClass).filter(
            or_(
                GymClass.ClassID.in_(enrolled_ids),
                GymClass.ParentClassID.in_(enrolled_ids)
            ),
            GymClass.IsDeleted == 0,
            or_(GymClass.IsRecurring == 0, GymClass.IsRecurring == None)
        )
    else:
        q_enroll = None

    classes_teaching = q_teach.order_by(GymClass.StartTime).all()
    classes_enrolled = q_enroll.order_by(GymClass.StartTime).all() if q_enroll else []

    pt_bookings = db.query(Booking).filter(
        or_(Booking.MemberID == target_id, Booking.PTID == target_id)
    ).all()

    return _schedule_events(db, schedules, classes_teaching, classes_enrolled, pt_bookings, target_id)


@router.get("/my")
def my_schedules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    uid = current_user.UserID
    schedules = db.query(Schedule).filter(Schedule.UserID == uid).order_by(Schedule.WorkoutDate.desc()).all()

    classes_teaching = db.query(GymClass).filter(
        GymClass.InstructorID == uid, 
        GymClass.IsDeleted == 0,
        or_(GymClass.IsRecurring == 0, GymClass.IsRecurring == None)
    ).order_by(GymClass.StartTime).all()

    enrolled_ids = [r[0] for r in db.query(ClassEnrollment.ClassID).filter(
        ClassEnrollment.MemberID == uid, ClassEnrollment.Status == "Active"
    ).all()]
    
    if enrolled_ids:
        classes_enrolled = db.query(GymClass).filter(
            or_(
                GymClass.ClassID.in_(enrolled_ids),
                GymClass.ParentClassID.in_(enrolled_ids)
            ),
            GymClass.IsDeleted == 0,
            or_(GymClass.IsRecurring == 0, GymClass.IsRecurring == None)
        ).order_by(GymClass.StartTime).all()
    else:
        classes_enrolled = []

    pt_bookings = db.query(Booking).filter(
        or_(Booking.MemberID == uid, Booking.PTID == uid)
    ).all()

    return _schedule_events(db, schedules, classes_teaching, classes_enrolled, pt_bookings, uid)
