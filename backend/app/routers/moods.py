from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from datetime import date
from app.database import get_db
from app.auth.dependencies import get_user_id
from app.models.db_models import DailyMood
from app.schemas.mood import MoodUpsert, MoodResponse

router = APIRouter(prefix="/moods", tags=["moods"])


@router.get("", response_model=list[MoodResponse])
async def list_moods(
    month: str = Query(..., description="YYYY-MM"),
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    year, mon = map(int, month.split("-"))
    start = date(year, mon, 1)
    end = date(year + 1, 1, 1) if mon == 12 else date(year, mon + 1, 1)

    result = await db.execute(
        select(DailyMood).where(
            DailyMood.user_id == UUID(user_id),
            DailyMood.entry_date >= start,
            DailyMood.entry_date < end,
        ).order_by(DailyMood.entry_date)
    )
    return result.scalars().all()


@router.post("", response_model=MoodResponse)
async def upsert_mood(
    payload: MoodUpsert,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(
        select(DailyMood).where(
            DailyMood.user_id == UUID(user_id),
            DailyMood.entry_date == payload.entry_date,
        )
    )
    mood_entry = existing.scalar_one_or_none()

    if mood_entry:
        mood_entry.mood = payload.mood
        mood_entry.note = payload.note
    else:
        mood_entry = DailyMood(
            user_id=UUID(user_id),
            entry_date=payload.entry_date,
            mood=payload.mood,
            note=payload.note,
        )
        db.add(mood_entry)

    await db.commit()
    await db.refresh(mood_entry)
    return mood_entry
