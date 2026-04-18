from pydantic import BaseModel
from typing import Optional


class MessageResponse(BaseModel):
    message: str


class PaginationParams(BaseModel):
    page: int = 1
    size: int = 20
