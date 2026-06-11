from pydantic import BaseModel
from typing import Optional, Any
from uuid import UUID
from datetime import date, datetime


class EntryUpsert(BaseModel):
    focus_area_id: UUID
    entry_date: date
    activities: Optional[Any] = None   # Tiptap JSON
    notes: Optional[Any] = None        # Tiptap JSON
    mood: Optional[str] = None


class EntryUpdate(BaseModel):
    activities: Optional[Any] = None
    notes: Optional[Any] = None
    mood: Optional[str] = None


class AISummarySchema(BaseModel):
    one_liner: str
    accomplishments: list[str] = []
    learnings: list[str] = []
    follow_ups: list[str] = []
    keywords: list[str] = []


class EntryResponse(BaseModel):
    id: UUID
    user_id: UUID
    focus_area_id: UUID
    entry_date: date
    activities: Optional[Any]
    activities_plain_text: Optional[str]
    notes: Optional[Any]
    notes_plain_text: Optional[str]
    ai_summary: Optional[Any]
    ai_summary_generated_at: Optional[datetime]
    ai_summary_model: Optional[str]
    mood: Optional[str]
    word_count: int
    todo_completions: Optional[Any] = {}
    is_pinned: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CalendarHeatmapItem(BaseModel):
    date: str
    completion_pct: float
    mood: Optional[str]
    entry_count: int
