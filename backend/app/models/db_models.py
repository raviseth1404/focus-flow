from sqlalchemy import (
    Column, String, Boolean, Integer, Text, Date, DateTime,
    ForeignKey, UniqueConstraint, CheckConstraint, func
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.database import Base
import uuid


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(UUID(as_uuid=True), primary_key=True)
    display_name = Column(Text)
    avatar_url = Column(Text)
    timezone = Column(Text, default="Asia/Kolkata")
    plan = Column(Text, default="free")
    onboarding_done = Column(Boolean, default=False)
    # AI rate limiting — persists across redeploys
    ai_calls_this_hour = Column(Integer, default=0, nullable=False)
    ai_window_start = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class UserPreferences(Base):
    __tablename__ = "user_preferences"

    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), primary_key=True)
    theme = Column(Text, default="dark")
    default_editor_font = Column(Text, default="DM Sans")
    calendar_start_month = Column(Date, default="2025-06-01")
    calendar_end_month = Column(Date, default="2027-03-31")
    sidebar_collapsed = Column(Boolean, default=False)
    email_weekly_digest = Column(Boolean, default=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class FocusArea(Base):
    __tablename__ = "focus_areas"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    name = Column(Text, nullable=False)
    icon = Column(Text, default="🎯")
    color = Column(Text, default="#F4A636")
    description = Column(Text)
    target_days_per_week = Column(Integer, default=5)
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    is_archived = Column(Boolean, default=False)
    todo_items = Column(JSONB, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    entries = relationship("DailyEntry", back_populates="focus_area", cascade="all, delete-orphan")


class DailyEntry(Base):
    __tablename__ = "daily_entries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    focus_area_id = Column(UUID(as_uuid=True), ForeignKey("focus_areas.id", ondelete="CASCADE"), nullable=False)
    entry_date = Column(Date, nullable=False)
    activities = Column(JSONB)
    activities_plain_text = Column(Text)
    notes = Column(JSONB)
    notes_plain_text = Column(Text)
    ai_summary = Column(JSONB)
    ai_summary_generated_at = Column(DateTime(timezone=True))
    ai_summary_model = Column(Text)
    mood = Column(Text)
    word_count = Column(Integer, default=0)
    todo_completions = Column(JSONB, default=dict)
    is_pinned = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    focus_area = relationship("FocusArea", back_populates="entries")
    attachments = relationship("Attachment", back_populates="entry", cascade="all, delete-orphan")
    pins = relationship("PinnedItem", back_populates="entry", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("user_id", "focus_area_id", "entry_date", name="unique_user_focusarea_date"),
    )


class DailyMood(Base):
    __tablename__ = "daily_moods"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    entry_date = Column(Date, nullable=False)
    mood = Column(Text, nullable=False)
    note = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("user_id", "entry_date", name="unique_user_date_mood"),
    )


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    daily_entry_id = Column(UUID(as_uuid=True), ForeignKey("daily_entries.id", ondelete="CASCADE"), nullable=False)
    section = Column(Text, nullable=False)
    file_name = Column(Text, nullable=False)
    file_size_bytes = Column(Integer)
    mime_type = Column(Text)
    storage_path = Column(Text, nullable=False)
    thumbnail_path = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    entry = relationship("DailyEntry", back_populates="attachments")


class PinnedItem(Base):
    __tablename__ = "pinned_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    daily_entry_id = Column(UUID(as_uuid=True), ForeignKey("daily_entries.id", ondelete="CASCADE"), nullable=False)
    focus_area_id = Column(UUID(as_uuid=True), ForeignKey("focus_areas.id", ondelete="CASCADE"), nullable=False)
    section = Column(Text)
    pin_note = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    entry = relationship("DailyEntry", back_populates="pins")

    __table_args__ = (
        UniqueConstraint("user_id", "daily_entry_id", "section", name="unique_pin"),
    )


class WeeklyDigest(Base):
    __tablename__ = "weekly_digests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    week_start = Column(Date, nullable=False)
    week_end = Column(Date, nullable=False)
    digest_content = Column(JSONB)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("user_id", "week_start", name="unique_user_week"),
    )
