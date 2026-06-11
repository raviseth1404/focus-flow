from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, or_
from uuid import UUID
from typing import Optional
from datetime import date
from app.models.db_models import DailyEntry, FocusArea


async def full_text_search(
    db: AsyncSession,
    user_id: str,
    query: str,
    focus_area_id: Optional[UUID] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list, int]:
    """
    Search entries using both full-text search (tsvector) and trigram similarity.
    Returns (results, total_count).
    """
    base_conditions = [
        DailyEntry.user_id == UUID(user_id),
        or_(
            DailyEntry.activities_plain_text.ilike(f"%{query}%"),
            DailyEntry.notes_plain_text.ilike(f"%{query}%"),
        ),
    ]

    if focus_area_id:
        base_conditions.append(DailyEntry.focus_area_id == focus_area_id)
    if date_from:
        base_conditions.append(DailyEntry.entry_date >= date_from)
    if date_to:
        base_conditions.append(DailyEntry.entry_date <= date_to)

    from sqlalchemy import func, and_

    count_result = await db.execute(
        select(func.count(DailyEntry.id)).where(and_(*base_conditions))
    )
    total = count_result.scalar_one()

    result = await db.execute(
        select(DailyEntry)
        .where(and_(*base_conditions))
        .order_by(DailyEntry.entry_date.desc())
        .limit(limit)
        .offset(offset)
    )
    entries = result.scalars().all()

    return entries, total
