from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.exercise import Exercise, MuscleGroup, Equipment
from ..middleware.auth import get_current_user

router = APIRouter(prefix="/api/exercises", tags=["Exercises"])

@router.get("")
def list_exercises(db: Session = Depends(get_db)):
    exercises = db.query(Exercise).filter(Exercise.IsDeleted == 0).all()
    return [
        {
            "id": ex.ExerciseID,
            "name": ex.Name,
            "muscleGroup": ex.muscle_group.Name if ex.muscle_group else "",
            "equipment": ex.equipment.Name if ex.equipment else "",
        }
        for ex in exercises
    ]

@router.get("/groups")
def list_muscle_groups(db: Session = Depends(get_db)):
    groups = db.query(MuscleGroup).all()
    return [{"id": g.MuscleGroupID, "name": g.Name} for g in groups]
