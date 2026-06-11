from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class PresignRequest(BaseModel):
    entry_id: UUID
    section: str  # 'activities' | 'notes'
    file_name: str
    mime_type: str


class PresignResponse(BaseModel):
    upload_url: str
    storage_path: str
    attachment_id: UUID


class ConfirmRequest(BaseModel):
    attachment_id: UUID


class AttachmentResponse(BaseModel):
    id: UUID
    user_id: UUID
    daily_entry_id: UUID
    section: str
    file_name: str
    file_size_bytes: Optional[int]
    mime_type: Optional[str]
    storage_path: str
    thumbnail_path: Optional[str]
    created_at: datetime
    signed_url: Optional[str] = None  # populated on read

    model_config = {"from_attributes": True}
