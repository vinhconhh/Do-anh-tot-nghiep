from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from datetime import datetime, timedelta
from ..database import get_db
from ..models.user import User, Role
from ..models.profile import PTProfile, MemberProfile
from ..models.pt_request import PTRequest, PTScoreLog
from ..models.notification import Notification
from ..middleware.auth import get_current_user, require_roles
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/pt-requests", tags=["PT Requests"])


# ─── Schemas ───
class CreatePTRequestBody(BaseModel):
    ptId: int
    goal: Optional[str] = ""
    note: Optional[str] = ""


class RespondBody(BaseModel):
    status: str  # "approved" or "rejected"


class AssignBody(BaseModel):
    ptId: int


# ─── Helpers ───
def _expire_pending(db: Session):
    """Lazy check: mark expired requests, deduct PT points, notify managers."""
    now = datetime.utcnow()
    expired = (
        db.query(PTRequest)
        .filter(PTRequest.Status == "Pending", PTRequest.ExpiresAt < now)
        .all()
    )
    if not expired:
        return

    manager_role = db.query(Role).filter(Role.RoleCode == "MANAGER").first()
    managers = []
    if manager_role:
        managers = db.query(User).filter(
            User.RoleID == manager_role.RoleID, User.IsDeleted == 0
        ).all()

    for req in expired:
        req.Status = "Expired"

        # Deduct PT score
        score_log = PTScoreLog(
            PTID=req.PTID, Points=-15,
            Reason="EXPIRED_NO_RESPONSE", ReferenceID=req.RequestID,
        )
        db.add(score_log)

        # Update PT profile score
        pt_profile = db.query(PTProfile).filter(PTProfile.UserID == req.PTID).first()
        if pt_profile:
            pt_profile.TotalScore = max(0, (pt_profile.TotalScore or 100) - 15)
            # Recalc response rate
            total = db.query(func.count(PTRequest.RequestID)).filter(
                PTRequest.PTID == req.PTID,
                PTRequest.Status.in_(["Approved", "Rejected", "Expired"]),
            ).scalar() or 1
            responded = db.query(func.count(PTRequest.RequestID)).filter(
                PTRequest.PTID == req.PTID,
                PTRequest.Status.in_(["Approved", "Rejected"]),
            ).scalar() or 0
            pt_profile.ResponseRate = round((responded / total) * 100, 2)

        # Notify managers
        pt_user = db.query(User).filter(User.UserID == req.PTID).first()
        pt_name = pt_user.FullName if pt_user else f"PT #{req.PTID}"
        for mgr in managers:
            db.add(Notification(
                UserID=mgr.UserID,
                Message=f"⚠️ PT {pt_name} chậm phản hồi yêu cầu #{req.RequestID}. Cần phân công lại.",
                Type="PTExpired",
            ))

    db.commit()


def _award_pt_points(db: Session, pt_request: PTRequest):
    """Award points to PT based on response time."""
    if not pt_request.RespondedAt or not pt_request.CreatedAt:
        return
    diff = pt_request.RespondedAt - pt_request.CreatedAt
    hours = diff.total_seconds() / 3600

    if hours < 24:
        points, reason = 15, "FAST_RESPONSE"
    elif hours < 48:
        points, reason = 10, "NORMAL_RESPONSE"
    else:
        points, reason = 5, "SLOW_RESPONSE"

    db.add(PTScoreLog(
        PTID=pt_request.PTID, Points=points,
        Reason=reason, ReferenceID=pt_request.RequestID,
    ))

    pt_profile = db.query(PTProfile).filter(PTProfile.UserID == pt_request.PTID).first()
    if pt_profile:
        pt_profile.TotalScore = (pt_profile.TotalScore or 100) + points
        # Recalc response rate
        total = db.query(func.count(PTRequest.RequestID)).filter(
            PTRequest.PTID == pt_request.PTID,
            PTRequest.Status.in_(["Approved", "Rejected", "Expired"]),
        ).scalar() or 1
        responded = db.query(func.count(PTRequest.RequestID)).filter(
            PTRequest.PTID == pt_request.PTID,
            PTRequest.Status.in_(["Approved", "Rejected"]),
        ).scalar() or 0
        pt_profile.ResponseRate = round((responded / total) * 100, 2)

    db.commit()


def _format_request(r: PTRequest) -> dict:
    m = r.member
    p = r.pt
    m_profile = m.member_profile if m else None
    p_profile = p.pt_profile if p else None
    return {
        "id": r.RequestID,
        "memberId": r.MemberID,
        "memberName": m.FullName if m else "Unknown",
        "memberGoal": r.MemberGoal or (m_profile.Goal if m_profile else ""),
        "ptId": r.PTID,
        "ptName": p.FullName if p else "Unknown",
        "ptSpecialty": p_profile.Specialty if p_profile else "",
        "ptScore": float(p_profile.TotalScore) if p_profile and p_profile.TotalScore else 100,
        "status": r.Status.lower() if r.Status else "pending",
        "note": r.Note or "",
        "expiresAt": r.ExpiresAt.isoformat() if r.ExpiresAt else None,
        "respondedAt": r.RespondedAt.isoformat() if r.RespondedAt else None,
        "createdAt": r.CreatedAt.strftime("%d/%m/%Y %H:%M") if r.CreatedAt else "",
    }


# ─── Endpoints ───

@router.get("/available-pts")
def available_pts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Member: list PTs with profiles, filtered and sorted by score."""
    role = db.query(Role).filter(Role.RoleCode == "PT").first()
    if not role:
        return []
    pts = (
        db.query(User)
        .options(joinedload(User.pt_profile), joinedload(User.role))
        .filter(User.RoleID == role.RoleID, User.IsDeleted == 0, User.IsActive == 1)
        .all()
    )
    result = []
    for p in pts:
        prof = p.pt_profile
        result.append({
            "UserID": p.UserID,
            "hoTen": p.FullName,
            "email": p.Email,
            "specialty": prof.Specialty if prof else "",
            "experienceYears": prof.ExperienceYears if prof else 0,
            "certifications": prof.Certifications if prof else "",
            "totalScore": float(prof.TotalScore) if prof and prof.TotalScore else 100,
            "responseRate": float(prof.ResponseRate) if prof and prof.ResponseRate else 100,
        })
    # Sort by score descending
    result.sort(key=lambda x: x["totalScore"], reverse=True)
    return result


@router.get("")
def list_all(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "MANAGER")),
):
    """Admin/Manager: all requests."""
    _expire_pending(db)
    requests = (
        db.query(PTRequest)
        .options(
            joinedload(PTRequest.member).joinedload(User.member_profile),
            joinedload(PTRequest.pt).joinedload(User.pt_profile),
        )
        .order_by(PTRequest.CreatedAt.desc())
        .all()
    )
    return [_format_request(r) for r in requests]


@router.get("/my-requests")
def my_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Member: my submitted requests."""
    _expire_pending(db)
    requests = (
        db.query(PTRequest)
        .options(
            joinedload(PTRequest.member).joinedload(User.member_profile),
            joinedload(PTRequest.pt).joinedload(User.pt_profile),
        )
        .filter(PTRequest.MemberID == current_user.UserID)
        .order_by(PTRequest.CreatedAt.desc())
        .all()
    )
    return [_format_request(r) for r in requests]


@router.get("/incoming")
def incoming(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """PT: requests sent to me."""
    _expire_pending(db)
    requests = (
        db.query(PTRequest)
        .options(
            joinedload(PTRequest.member).joinedload(User.member_profile),
            joinedload(PTRequest.pt).joinedload(User.pt_profile),
        )
        .filter(PTRequest.PTID == current_user.UserID)
        .order_by(PTRequest.CreatedAt.desc())
        .all()
    )
    return [_format_request(r) for r in requests]


@router.post("")
def create_request(
    body: CreatePTRequestBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Member: create a new PT hire request."""
    # Check PT exists
    pt = db.query(User).filter(User.UserID == body.ptId, User.IsDeleted == 0).first()
    if not pt:
        raise HTTPException(status_code=404, detail="PT không tồn tại")

    # Check no duplicate pending request
    existing = db.query(PTRequest).filter(
        PTRequest.MemberID == current_user.UserID,
        PTRequest.PTID == body.ptId,
        PTRequest.Status == "Pending",
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bạn đã có yêu cầu đang chờ duyệt cho PT này")

    now = datetime.utcnow()
    req = PTRequest(
        MemberID=current_user.UserID,
        PTID=body.ptId,
        MemberGoal=body.goal,
        Note=body.note,
        Status="Pending",
        ExpiresAt=now + timedelta(days=3),
        CreatedAt=now,
    )
    db.add(req)

    # Notify PT
    db.add(Notification(
        UserID=body.ptId,
        Message=f"📩 {current_user.FullName} muốn thuê bạn làm PT. Hãy phản hồi trong 3 ngày!",
        Type="PTRequest",
    ))

    db.commit()
    db.refresh(req)
    return {"message": "Đã gửi yêu cầu", "requestId": req.RequestID}


@router.put("/{request_id}/respond")
def respond(
    request_id: int,
    body: RespondBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """PT: approve or reject a request."""
    req = db.query(PTRequest).filter(
        PTRequest.RequestID == request_id,
        PTRequest.PTID == current_user.UserID,
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Yêu cầu không tồn tại")
    if req.Status != "Pending":
        raise HTTPException(status_code=400, detail=f"Yêu cầu đã ở trạng thái: {req.Status}")

    status = body.status.capitalize()  # "Approved" or "Rejected"
    if status not in ("Approved", "Rejected"):
        raise HTTPException(status_code=400, detail="Status phải là 'approved' hoặc 'rejected'")

    req.Status = status
    req.RespondedAt = datetime.utcnow()
    db.commit()

    # Award PT points
    _award_pt_points(db, req)

    # Notify member
    action_text = "đồng ý" if status == "Approved" else "từ chối"
    db.add(Notification(
        UserID=req.MemberID,
        Message=f"PT {current_user.FullName} đã {action_text} yêu cầu thuê PT của bạn.",
        Type="PTResponse",
    ))
    db.commit()

    return {"message": f"Đã {action_text} yêu cầu", "status": status.lower()}


@router.put("/{request_id}/assign")
def assign_pt(
    request_id: int,
    body: AssignBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "MANAGER")),
):
    """Manager: reassign a PT to an expired request."""
    req = db.query(PTRequest).filter(PTRequest.RequestID == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Yêu cầu không tồn tại")

    new_pt = db.query(User).filter(User.UserID == body.ptId, User.IsDeleted == 0).first()
    if not new_pt:
        raise HTTPException(status_code=404, detail="PT mới không tồn tại")

    req.PTID = body.ptId
    req.Status = "Pending"
    req.ExpiresAt = datetime.utcnow() + timedelta(days=3)
    req.RespondedAt = None
    db.commit()

    # Notify new PT
    db.add(Notification(
        UserID=body.ptId,
        Message=f"📋 Quản lý đã phân công bạn cho yêu cầu #{request_id}. Hãy phản hồi trong 3 ngày!",
        Type="PTAssigned",
    ))
    db.commit()

    return {"message": "Đã phân công PT mới"}
