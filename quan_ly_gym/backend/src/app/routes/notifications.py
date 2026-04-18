from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models.user import User
from ..models.notification import Notification
from ..middleware.auth import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("")
def list_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notifs = (
        db.query(Notification)
        .filter(Notification.UserID == current_user.UserID)
        .order_by(Notification.CreatedAt.desc())
        .limit(20)
        .all()
    )
    return [
        {
            "NotificationID": n.NotificationID,
            "message": n.Message,
            "type": n.Type,
            "isRead": n.IsRead,
            "createdAt": n.CreatedAt.isoformat() if n.CreatedAt else None,
        }
        for n in notifs
    ]


@router.get("/unread-count")
def unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    count = db.query(func.count(Notification.NotificationID)).filter(
        Notification.UserID == current_user.UserID,
        Notification.IsRead == 0,
    ).scalar() or 0
    return {"count": count}


@router.put("/{notif_id}/read")
def mark_read(
    notif_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notif = db.query(Notification).filter(
        Notification.NotificationID == notif_id,
        Notification.UserID == current_user.UserID,
    ).first()
    if notif:
        notif.IsRead = 1
        db.commit()
    return {"message": "OK"}
