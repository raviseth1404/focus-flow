from pydantic import BaseModel, field_validator
from typing import Optional, Literal
from uuid import UUID
from datetime import datetime

ALLOWED_MIME_TYPES = {
    # Images
    "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
    # Documents
    "application/pdf", "text/plain", "text/markdown",
    # Office
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    # Audio / Video
    "audio/mpeg", "audio/wav", "audio/ogg",
    "video/mp4", "video/webm",
}

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


class PresignRequest(BaseModel):
    entry_id: UUID
    section: Literal["activities", "notes"]
    file_name: str
    mime_type: str
    file_size_bytes: int

    @field_validator("mime_type")
    @classmethod
    def validate_mime_type(cls, v: str) -> str:
        if v not in ALLOWED_MIME_TYPES:
            raise ValueError(f"File type '{v}' is not allowed.")
        return v

    @field_validator("file_size_bytes")
    @classmethod
    def validate_file_size(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("file_size_bytes must be positive.")
        if v > MAX_FILE_SIZE_BYTES:
            raise ValueError(f"File exceeds the 10 MB size limit.")
        return v

    @field_validator("file_name")
    @classmethod
    def validate_file_name(cls, v: str) -> str:
        # Strip any path components — only bare filename allowed
        import os
        name = os.path.basename(v)
        if not name:
            raise ValueError("Invalid file name.")
        return name


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
    file_size_bytes: Optional[int] = None
    mime_type: Optional[str] = None
    storage_path: str
    thumbnail_path: Optional[str] = None
    created_at: datetime
    signed_url: Optional[str] = None  # populated on read

    model_config = {"from_attributes": True}
