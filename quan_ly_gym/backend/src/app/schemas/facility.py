from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class EquipmentBase(BaseModel):
    Name:     str
    Category: Optional[str] = None
    Zone:     Optional[str] = None
    Quantity: Optional[int] = Field(default=1, ge=0)
    Status:   Optional[str] = "Hoạt động"

class EquipmentCreate(EquipmentBase):
    pass

class EquipmentUpdate(BaseModel):
    Name:     Optional[str] = None
    Category: Optional[str] = None
    Zone:     Optional[str] = None
    Quantity: Optional[int] = Field(default=None, ge=0)
    Status:   Optional[str] = None

class EquipmentResponse(EquipmentBase):
    EquipmentID: int
    CreatedAt:   Optional[datetime] = None
    UpdatedAt:   Optional[datetime] = None

    class Config:
        from_attributes = True



class ExerciseBase(BaseModel):
    Name:         str
    AssignmentName: Optional[str] = None
    Type:         Optional[str] = None
    TargetMuscle: Optional[str] = None
    MetValue:     Optional[float] = Field(default=0.0, ge=0)
    EquipmentID:  Optional[int] = None

class ExerciseCreate(ExerciseBase):
    pass

class ExerciseUpdate(BaseModel):
    Name:         Optional[str] = None
    AssignmentName: Optional[str] = None
    Type:         Optional[str] = None
    TargetMuscle: Optional[str] = None
    MetValue:     Optional[float] = None
    EquipmentID:  Optional[int] = None

class ExerciseResponse(ExerciseBase):
    ExerciseID:    int
    IsDeleted:     Optional[int] = 0
    CreatedAt:     Optional[datetime] = None
    UpdatedAt:     Optional[datetime] = None
    EquipmentName: Optional[str] = None

    class Config:
        from_attributes = True

class PaginatedExerciseResponse(BaseModel):
    total:   int
    page:    int
    size:    int
    pages:   int
    items:   List[ExerciseResponse]



class GymClassBase(BaseModel):
    Name:           str
    InstructorName: Optional[str] = None
    StudioRoom:     Optional[str] = None
    MaxCapacity:    Optional[int] = Field(default=20, ge=1)
    StartTime:      datetime
    EndTime:        datetime

class GymClassCreate(GymClassBase):
    pass

class GymClassUpdate(BaseModel):
    Name:           Optional[str] = None
    InstructorName: Optional[str] = None
    StudioRoom:     Optional[str] = None
    MaxCapacity:    Optional[int] = Field(default=None, ge=1)
    StartTime:      Optional[datetime] = None
    EndTime:        Optional[datetime] = None

class GymClassResponse(GymClassBase):
    ClassID:         int
    CurrentEnrolled: int = 0
    IsDeleted:       int = 0
    CreatedAt:       Optional[datetime] = None
    UpdatedAt:       Optional[datetime] = None
    AvailableSlots:  Optional[int] = None

    class Config:
        from_attributes = True
