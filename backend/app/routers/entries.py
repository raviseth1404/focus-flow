from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, extract
from sqlalchemy.dialects.postgresql import insert as pg_insert
from uuid import UUID
from datetime import date, timedelta
from typing import Optional, Union, List, Dict
from pydantic import BaseModel
from app.database import get_db
from app.auth.dependencies import get_user_id
from app.models.db_models import DailyEntry, FocusArea, DailyMood
from app.schemas.entry import EntryUpsert, EntryUpdate, EntryResponse, CalendarHeatmapItem
from app.schemas.common import PaginatedResponse


class TodoCompletionUpdate(BaseModel):
    todo_completions: Dict[str, bool]


class PinUpdate(BaseModel):
    is_pinned: bool

router = APIRouter(prefix="/entries", tags=["entries"])


def extract_plain_text(tiptap_json: Optional[dict]) -> str:
    """Recursively extract plain text from Tiptap JSON."""
    if not tiptap_json:
        return ""
    if isinstance(tiptap_json, str):
        return tiptap_json
    text_parts = []
    if isinstance(tiptap_json, dict):
        if tiptap_json.get("type") == "text":
            text_parts.append(tiptap_json.get("text", ""))
        for child in tiptap_json.get("content", []):
            text_parts.append(extract_plain_text(child))
    return " ".join(filter(None, text_parts))


@router.get("", response_model=Union[List[EntryResponse], PaginatedResponse])
async def list_entries(
    date_param: Optional[date] = Query(None, alias="date"),
    focus_area_id: Optional[UUID] = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    if date_param:
        # All focus areas for a given date
        result = await db.execute(
            select(DailyEntry).where(
                DailyEntry.user_id == UUID(user_id),
                DailyEntry.entry_date == date_param,
            )
        )
        return result.scalars().all()

    if focus_area_id:
        count_result = await db.execute(
            select(func.count(DailyEntry.id)).where(
                DailyEntry.user_id == UUID(user_id),
                DailyEntry.focus_area_id == focus_area_id,
            )
        )
        total = count_result.scalar_one()

        result = await db.execute(
            select(DailyEntry)
            .where(
                DailyEntry.user_id == UUID(user_id),
                DailyEntry.focus_area_id == focus_area_id,
            )
            .order_by(DailyEntry.entry_date.desc())
            .limit(limit)
            .offset(offset)
        )
        items = result.scalars().all()
        return PaginatedResponse(
            items=[EntryResponse.model_validate(item) for item in items],
            total=total,
            limit=limit,
            offset=offset,
        )

    raise HTTPException(status_code=400, detail="Provide either 'date' or 'focus_area_id' query parameter")


@router.get("/calendar-heatmap", response_model=list[CalendarHeatmapItem])
async def calendar_heatmap(
    year: int,
    month: int,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    # Get total active focus areas count
    fa_count_result = await db.execute(
        select(func.count(FocusArea.id)).where(
            FocusArea.user_id == UUID(user_id),
            FocusArea.is_active == True,
            FocusArea.is_archived == False,
        )
    )
    total_areas = fa_count_result.scalar_one() or 1

    # Get entries for the month
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1)
    else:
        end_date = date(year, month + 1, 1)

    result = await db.execute(
        select(
            DailyEntry.entry_date,
            func.count(DailyEntry.id).label("entry_count"),
        )
        .where(
            DailyEntry.user_id == UUID(user_id),
            DailyEntry.entry_date >= start_date,
            DailyEntry.entry_date < end_date,
        )
        .group_by(DailyEntry.entry_date)
    )
    entry_counts = {row.entry_date: row.entry_count for row in result}

    # Get moods for the month
    mood_result = await db.execute(
        select(DailyMood.entry_date, DailyMood.mood).where(
            DailyMood.user_id == UUID(user_id),
            DailyMood.entry_date >= start_date,
            DailyMood.entry_date < end_date,
        )
    )
    moods = {row.entry_date: row.mood for row in mood_result}

    heatmap = []
    current = start_date
    while current < end_date:
        count = entry_counts.get(current, 0)
        heatmap.append(CalendarHeatmapItem(
            date=str(current),
            completion_pct=round((count / total_areas) * 100, 1),
            mood=moods.get(current),
            entry_count=count,
        ))
        current += timedelta(days=1)

    return heatmap


@router.get("/{entry_id}", response_model=EntryResponse)
async def get_entry(
    entry_id: UUID,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(DailyEntry).where(DailyEntry.id == entry_id, DailyEntry.user_id == UUID(user_id))
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")
    return entry


@router.post("", response_model=EntryResponse, status_code=status.HTTP_201_CREATED)
async def upsert_entry(
    payload: EntryUpsert,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    # Verify focus area belongs to user
    fa_result = await db.execute(
        select(FocusArea).where(
            FocusArea.id == payload.focus_area_id,
            FocusArea.user_id == UUID(user_id),
        )
    )
    if not fa_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Focus area not found")

    # Check existing
    existing = await db.execute(
        select(DailyEntry).where(
            DailyEntry.user_id == UUID(user_id),
            DailyEntry.focus_area_id == payload.focus_area_id,
            DailyEntry.entry_date == payload.entry_date,
        )
    )
    entry = existing.scalar_one_or_none()

    if entry:
        if payload.activities is not None:
            entry.activities = payload.activities
            entry.activities_plain_text = extract_plain_text(payload.activities)
        if payload.notes is not None:
            entry.notes = payload.notes
            entry.notes_plain_text = extract_plain_text(payload.notes)
        if payload.mood is not None:
            entry.mood = payload.mood
        # Recalculate word count from the final saved values (not raw payload)
        # so partial saves (notes-only or activities-only) don't reset the other field's count
        texts = (entry.activities_plain_text or "") + " " + (entry.notes_plain_text or "")
        entry.word_count = len(texts.split())
    else:
        activities_text = extract_plain_text(payload.activities)
        notes_text = extract_plain_text(payload.notes)
        entry = DailyEntry(
            user_id=UUID(user_id),
            focus_area_id=payload.focus_area_id,
            entry_date=payload.entry_date,
            activities=payload.activities,
            activities_plain_text=activities_text,
            notes=payload.notes,
            notes_plain_text=notes_text,
            mood=payload.mood,
            word_count=len((activities_text + " " + notes_text).split()),
        )
        db.add(entry)

    await db.commit()
    await db.refresh(entry)
    return entry


@router.put("/{entry_id}", response_model=EntryResponse)
async def update_entry(
    entry_id: UUID,
    payload: EntryUpdate,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(DailyEntry).where(DailyEntry.id == entry_id, DailyEntry.user_id == UUID(user_id))
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")

    if payload.activities is not None:
        entry.activities = payload.activities
        entry.activities_plain_text = extract_plain_text(payload.activities)
    if payload.notes is not None:
        entry.notes = payload.notes
        entry.notes_plain_text = extract_plain_text(payload.notes)
    if payload.mood is not None:
        entry.mood = payload.mood

    texts = (entry.activities_plain_text or "") + " " + (entry.notes_plain_text or "")
    entry.word_count = len(texts.split())

    await db.commit()
    await db.refresh(entry)
    return entry


@router.patch("/{entry_id}/todos", response_model=EntryResponse)
async def update_todo_completions(
    entry_id: UUID,
    payload: TodoCompletionUpdate,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(DailyEntry).where(DailyEntry.id == entry_id, DailyEntry.user_id == UUID(user_id))
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")
    entry.todo_completions = payload.todo_completions
    await db.commit()
    await db.refresh(entry)
    return entry


@router.patch("/{entry_id}/pin", response_model=EntryResponse)
async def toggle_pin(
    entry_id: UUID,
    payload: PinUpdate,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(DailyEntry).where(DailyEntry.id == entry_id, DailyEntry.user_id == UUID(user_id))
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")
    entry.is_pinned = payload.is_pinned
    await db.commit()
    await db.refresh(entry)
    return entry


@router.delete("/{entry_id}/notes", status_code=status.HTTP_204_NO_CONTENT)
async def delete_entry_notes(
    entry_id: UUID,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Clear the notes from an entry (keeps activities/todos intact)."""
    result = await db.execute(
        select(DailyEntry).where(DailyEntry.id == entry_id, DailyEntry.user_id == UUID(user_id))
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")
    entry.notes = None
    entry.notes_plain_text = None
    texts = (entry.activities_plain_text or "") + " " + (entry.notes_plain_text or "")
    entry.word_count = len(texts.split()) if texts.strip() else 0
    await db.commit()
