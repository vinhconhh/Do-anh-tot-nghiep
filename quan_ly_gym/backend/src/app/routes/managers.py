from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from ..database import get_db
from datetime import datetime
from ..models.member_pt_relation import MemberPTRelation, MemberRequest
from ..models.user import User
from ..middleware.auth import require_roles, get_current_user

router = APIRouter(prefix="/api/managers", tags=["Managers"])

class AssignPTRequest(BaseModel):
    member_id: int
    pt_id: int

@router.post("/assign-pt")
def assign_pt_to_member(
    req: AssignPTRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("MANAGER"))
):
    member = db.query(User).filter(User.UserID == req.member_id).first()
    if not member or member.role.RoleCode != "MEMBER":
        raise HTTPException(status_code=400, detail="Thành viên không hợp lệ")

    pt = db.query(User).filter(User.UserID == req.pt_id).first()
    if not pt or pt.role.RoleCode != "PT":
        raise HTTPException(status_code=400, detail="PT không hợp lệ")

    relation = db.query(MemberPTRelation).filter(
        MemberPTRelation.MemberID == req.member_id,
        MemberPTRelation.PTID == req.pt_id
    ).first()

    if relation:
        if relation.Status == "Active":
            raise HTTPException(status_code=400, detail="Hội viên này đã được phân bổ cho PT này")
        else:
            relation.Status = "Active"
            relation.AssignedBy = current_user.UserID
    else:
        relation = MemberPTRelation(
            MemberID=req.member_id,
            PTID=req.pt_id,
            AssignedBy=current_user.UserID,
            Status="Active"
        )
        db.add(relation)
    
    db.commit()
    return {"message": "Đã gán PT thành công"}

@router.get("/assigned-pts")
def list_assigned_pts(
    db: Session = Depends(get_db),
    _=Depends(require_roles("MANAGER"))
):
    relations = db.query(MemberPTRelation).filter(MemberPTRelation.Status == "Active").all()
    return [{
        "relation_id": r.RelationID,
        "member_id": r.MemberID,
        "member_name": r.member.FullName if r.member else "",
        "pt_id": r.PTID,
        "pt_name": r.pt.FullName if r.pt else "",
        "assigned_at": r.CreatedAt
    } for r in relations]


class PTRequestApprovePayload(BaseModel):
    pt_id: int

@router.get("/pt-requests")
def list_pt_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("MANAGER")),
):
    reqs = db.query(MemberRequest).filter(
        MemberRequest.RequestType == "PT_REQUEST"
    ).order_by(
        MemberRequest.Status.desc(),
        MemberRequest.CreatedAt.desc()
    ).all()

    return [
        {
            "RequestID": r.RequestID,
            "MemberID": r.MemberID,
            "MemberName": r.member.FullName if r.member else "",
            "Note": r.Note,
            "Status": r.Status,
            "CreatedAt": r.CreatedAt.isoformat() if r.CreatedAt else None,
            "ReviewedAt": r.ReviewedAt.isoformat() if r.ReviewedAt else None,
            "ReviewedBy": r.ReviewedBy,
        } for r in reqs
    ]

@router.post("/pt-requests/{req_id}/approve")
def approve_pt_request(
    req_id: int,
    payload: PTRequestApprovePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("MANAGER")),
):
    r = db.query(MemberRequest).filter(MemberRequest.RequestID == req_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu")
    if r.Status != "Pending":
        raise HTTPException(status_code=400, detail="Yêu cầu không ở trạng thái Pending")

    pt = db.query(User).filter(User.UserID == payload.pt_id).first()
    if not pt or pt.role.RoleCode != "PT":
        raise HTTPException(status_code=400, detail="PT không hợp lệ")

    r.Status = "Approved"
    r.ReviewedBy = current_user.UserID
    r.ReviewedAt = datetime.now()

    relation = MemberPTRelation(
        MemberID=r.MemberID,
        PTID=payload.pt_id,
        AssignedBy=current_user.UserID,
        Status="Active"
    )
    db.add(relation)
    db.commit()
    return {"message": "Đã duyệt yêu cầu và phân bổ PT"}

@router.post("/pt-requests/{req_id}/reject")
def reject_pt_request(
    req_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("MANAGER")),
):
    r = db.query(MemberRequest).filter(MemberRequest.RequestID == req_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu")
    if r.Status != "Pending":
        raise HTTPException(status_code=400, detail="Yêu cầu không ở trạng thái Pending")

    r.Status = "Rejected"
    r.ReviewedBy = current_user.UserID
    r.ReviewedAt = datetime.now()
    db.commit()
    return {"message": "Đã từ chối yêu cầu"}

