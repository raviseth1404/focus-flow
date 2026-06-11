from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import date, datetime

VALID_MOODS = ("great", "good", "okay", "low", "rough")


class MoodUpsert(BaseModel):
    entry_date: date
    mood: str
    note: Optional[str] = None


class MoodResponse(BaseModel):
    id: UUID
    user_id: UUID
    entry_date: date
    mood: str
    note: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
