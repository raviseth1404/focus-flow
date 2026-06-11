from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class FocusAreaCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    icon: str = "🎯"
    color: str = "#F4A636"
    description: Optional[str] = None
    target_days_per_week: int = Field(default=5, ge=1, le=7)
    display_order: int = 0
    todo_items: List[str] = []


class FocusAreaUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    icon: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None
    target_days_per_week: Optional[int] = Field(None, ge=1, le=7)
    display_order: Optional[int] = None
    is_active: Optional[bool] = None
    is_archived: Optional[bool] = None
    todo_items: Optional[List[str]] = None


class FocusAreaResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    icon: str
    color: str
    description: Optional[str]
    target_days_per_week: int
    display_order: int
    is_active: bool
    is_archived: bool
    todo_items: List[str] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class FocusAreaWithStats(FocusAreaResponse):
    total_days: int = 0
    last_entry_date: Optional[str] = None
    total_words: int = 0


class ReorderRequest(BaseModel):
    ids: list[UUID]
