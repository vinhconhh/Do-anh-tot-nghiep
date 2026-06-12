from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional
from pydantic import BaseModel
from datetime import datetime

from ..database import get_db
from ..models.meal_plan import MealPlan
from ..middleware.auth import require_roles

router = APIRouter(prefix="/api/meal-plans", tags=["meal-plans"])



class MealPlanCreate(BaseModel):
    name: str
    category: str
    goal: Optional[str] = None
    calories: int = 0
    protein: float = 0
    carbs: float = 0
    fat: float = 0
    description: Optional[str] = None
    image_url: Optional[str] = None


class MealPlanUpdate(MealPlanCreate):
    pass


def _to_dict(mp: MealPlan) -> dict:
    return {
        "id": mp.PlanID,
        "name": mp.Name,
        "category": mp.Category,
        "goal": mp.Goal,
        "calories": mp.Calories,
        "protein": mp.Protein,
        "carbs": mp.Carbs,
        "fat": mp.Fat,
        "description": mp.Description,
        "imageUrl": mp.ImageURL,
        "createdAt": mp.CreatedAt.strftime("%Y-%m-%d") if mp.CreatedAt else None,
    }



@router.get("", summary="Lấy danh sách thực đơn (member xem)")
def list_meal_plans(
    goal: Optional[str] = Query(None, description="Lọc theo mục tiêu"),
    category: Optional[str] = Query(None, description="Lọc theo loại bữa"),
    db: Session = Depends(get_db),
    _=Depends(require_roles("MEMBER", "MANAGER", "PT")),
):
    q = db.query(MealPlan)
    if goal:
        q = q.filter(MealPlan.Goal.ilike(f"%{goal}%"))
    if category:
        q = q.filter(MealPlan.Category.ilike(f"%{category}%"))
    items = q.order_by(desc(MealPlan.CreatedAt)).all()
    return [_to_dict(m) for m in items]


@router.get("/{plan_id}", summary="Chi tiết một thực đơn")
def get_meal_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_roles("MEMBER", "MANAGER", "PT")),
):
    mp = db.query(MealPlan).filter(MealPlan.PlanID == plan_id).first()
    if not mp:
        raise HTTPException(status_code=404, detail="Không tìm thấy thực đơn")
    return _to_dict(mp)



@router.post("", status_code=201, summary="Tạo thực đơn mới (manager)")
def create_meal_plan(
    body: MealPlanCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("MANAGER")),
):
    mp = MealPlan(
        Name=body.name,
        Category=body.category,
        Goal=body.goal,
        Calories=body.calories,
        Protein=body.protein,
        Carbs=body.carbs,
        Fat=body.fat,
        Description=body.description,
        ImageURL=body.image_url,
        CreatedBy=current_user.UserID,
    )
    db.add(mp)
    db.commit()
    db.refresh(mp)
    return _to_dict(mp)


@router.put("/{plan_id}", summary="Cập nhật thực đơn (manager)")
def update_meal_plan(
    plan_id: int,
    body: MealPlanUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_roles("MANAGER")),
):
    mp = db.query(MealPlan).filter(MealPlan.PlanID == plan_id).first()
    if not mp:
        raise HTTPException(status_code=404, detail="Không tìm thấy thực đơn")
    mp.Name = body.name
    mp.Category = body.category
    mp.Goal = body.goal
    mp.Calories = body.calories
    mp.Protein = body.protein
    mp.Carbs = body.carbs
    mp.Fat = body.fat
    mp.Description = body.description
    mp.ImageURL = body.image_url
    mp.UpdatedAt = datetime.utcnow()
    db.commit()
    db.refresh(mp)
    return _to_dict(mp)


@router.delete("/{plan_id}", summary="Xóa thực đơn (manager)")
def delete_meal_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_roles("MANAGER")),
):
    mp = db.query(MealPlan).filter(MealPlan.PlanID == plan_id).first()
    if not mp:
        raise HTTPException(status_code=404, detail="Không tìm thấy thực đơn")
    db.delete(mp)
    db.commit()
    return {"message": "Đã xóa thực đơn"}
