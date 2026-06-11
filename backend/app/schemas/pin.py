from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class PinCreate(BaseModel):
    daily_entry_id: UUID
    focus_area_id: UUID
    section: Optional[str] = None  # 'activities' | 'notes' | 'ai_summary'
    pin_note: Optional[str] = None


class PinResponse(BaseModel):
    id: UUID
    user_id: UUID
    daily_entry_id: UUID
    focus_area_id: UUID
    section: Optional[str]
    pin_note: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
