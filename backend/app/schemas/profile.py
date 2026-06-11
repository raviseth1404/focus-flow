from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime, date


class ProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    timezone: Optional[str] = None


class ProfileResponse(BaseModel):
    id: UUID
    display_name: Optional[str]
    avatar_url: Optional[str]
    timezone: str
    plan: str
    onboarding_done: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PreferencesUpdate(BaseModel):
    theme: Optional[str] = None
    default_editor_font: Optional[str] = None
    calendar_start_month: Optional[date] = None
    calendar_end_month: Optional[date] = None
    sidebar_collapsed: Optional[bool] = None
    email_weekly_digest: Optional[bool] = None


class PreferencesResponse(BaseModel):
    user_id: UUID
    theme: str
    default_editor_font: str
    calendar_start_month: date
    calendar_end_month: date
    sidebar_collapsed: bool
    email_weekly_digest: bool

    model_config = {"from_attributes": True}
