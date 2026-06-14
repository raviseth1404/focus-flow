from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import date


class SummarizeRequest(BaseModel):
    entry_id: UUID


class FocusAreaSummarizeRequest(BaseModel):
    focus_area_id: UUID


class FocusAreaSummaryResponse(BaseModel):
    summary: str
    total_notes: int
    date_range: str


class WeeklyDigestRequest(BaseModel):
    week_start: date


class WeeklyDigestHighlight(BaseModel):
    focus_area_id: str
    focus_area_name: str
    days_logged: int
    summary: str
    top_insight: str


class WeeklyDigestContent(BaseModel):
    overall_summary: str
    momentum_score: int
    highlights_by_area: list[WeeklyDigestHighlight]
    top_learnings: list[str]
    next_week_suggestions: list[str]


class WeeklyDigestResponse(BaseModel):
    id: UUID
    user_id: UUID
    week_start: date
    week_end: date
    digest_content: Optional[WeeklyDigestContent]
    generated_at: str

    model_config = {"from_attributes": True}
