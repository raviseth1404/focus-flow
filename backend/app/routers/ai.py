import json
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from uuid import UUID
from app.database import get_db
from app.auth.dependencies import get_user_id
from app.models.db_models import DailyEntry, FocusArea, WeeklyDigest
from app.schemas.ai import SummarizeRequest, WeeklyDigestRequest, WeeklyDigestResponse, FocusAreaSummarizeRequest, FocusAreaSummaryResponse
from app.schemas.entry import EntryResponse
from app.services import ai_service

router = APIRouter(prefix="/ai", tags=["ai"])

# Simple in-memory rate limit: user_id -> last_call_time (per-process, resets on restart)
_rate_limit: dict[str, list] = {}
RATE_LIMIT_PER_HOUR = 20


def _check_rate_limit(user_id: str):
    from datetime import datetime
    now = datetime.utcnow()
    calls = _rate_limit.get(user_id, [])
    # Keep only calls in the last hour
    calls = [c for c in calls if (now - c).seconds < 3600]
    if len(calls) >= RATE_LIMIT_PER_HOUR:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={"code": "RATE_LIMIT_EXCEEDED", "message": "AI rate limit exceeded (20/hour)"},
        )
    calls.append(now)
    _rate_limit[user_id] = calls


@router.post("/summarize", response_model=EntryResponse)
async def summarize_entry(
    payload: SummarizeRequest,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    _check_rate_limit(user_id)

    result = await db.execute(
        select(DailyEntry).where(
            DailyEntry.id == payload.entry_id,
            DailyEntry.user_id == UUID(user_id),
        )
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    fa_result = await db.execute(select(FocusArea).where(FocusArea.id == entry.focus_area_id))
    fa = fa_result.scalar_one_or_none()

    try:
        summary = await ai_service.summarize_entry(
            focus_area_name=fa.name if fa else "Unknown",
            entry_date=str(entry.entry_date),
            activities_text=entry.activities_plain_text or "",
            notes_text=entry.notes_plain_text or "",
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"code": "AI_SERVICE_ERROR", "message": str(e)},
        )

    from datetime import datetime
    entry.ai_summary = summary
    entry.ai_summary_generated_at = datetime.utcnow()
    entry.ai_summary_model = ai_service.MODEL
    await db.commit()
    await db.refresh(entry)
    return entry


@router.post("/summarize-focus-area", response_model=FocusAreaSummaryResponse)
async def summarize_focus_area(
    payload: FocusAreaSummarizeRequest,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    _check_rate_limit(user_id)

    fa_result = await db.execute(
        select(FocusArea).where(FocusArea.id == payload.focus_area_id, FocusArea.user_id == UUID(user_id))
    )
    fa = fa_result.scalar_one_or_none()
    if not fa:
        raise HTTPException(status_code=404, detail="Focus area not found")

    entries_result = await db.execute(
        select(DailyEntry).where(
            DailyEntry.focus_area_id == payload.focus_area_id,
            DailyEntry.user_id == UUID(user_id),
            DailyEntry.notes != None,
        ).order_by(DailyEntry.entry_date.desc())
    )
    entries = entries_result.scalars().all()

    if not entries:
        raise HTTPException(status_code=400, detail="No notes found for this focus area")

    notes_text = "\n\n".join([
        f"[{e.entry_date}]\n{e.notes_plain_text or ''}"
        for e in entries if e.notes_plain_text
    ])
    date_range = f"{entries[-1].entry_date} → {entries[0].entry_date}"

    try:
        summary = await ai_service.summarize_focus_area_notes(
            focus_area_name=fa.name,
            notes_text=notes_text,
            total_notes=len(entries),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail={"code": "AI_SERVICE_ERROR", "message": str(e)})

    return FocusAreaSummaryResponse(
        summary=summary,
        total_notes=len(entries),
        date_range=date_range,
    )


@router.post("/weekly-digest", response_model=WeeklyDigestResponse)
async def weekly_digest(
    payload: WeeklyDigestRequest,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    _check_rate_limit(user_id)

    # Normalize to Monday
    week_start = payload.week_start - timedelta(days=payload.week_start.weekday())
    week_end = week_start + timedelta(days=6)

    # Check cache
    cached = await db.execute(
        select(WeeklyDigest).where(
            WeeklyDigest.user_id == UUID(user_id),
            WeeklyDigest.week_start == week_start,
        )
    )
    existing = cached.scalar_one_or_none()
    if existing:
        return existing

    # Gather entries for the week
    entries_result = await db.execute(
        select(DailyEntry).where(
            DailyEntry.user_id == UUID(user_id),
            DailyEntry.entry_date >= week_start,
            DailyEntry.entry_date <= week_end,
        )
    )
    entries = entries_result.scalars().all()

    # Group by focus area
    fa_ids = list({e.focus_area_id for e in entries})
    fa_map = {}
    for fa_id in fa_ids:
        fa_result = await db.execute(select(FocusArea).where(FocusArea.id == fa_id))
        fa = fa_result.scalar_one_or_none()
        if fa:
            fa_map[str(fa_id)] = fa.name

    days_logged = len({e.entry_date for e in entries})

    entries_data = []
    for e in entries:
        entries_data.append({
            "focus_area_id": str(e.focus_area_id),
            "focus_area_name": fa_map.get(str(e.focus_area_id), "Unknown"),
            "date": str(e.entry_date),
            "activities": e.activities_plain_text or "",
            "notes": e.notes_plain_text or "",
            "mood": e.mood,
        })

    try:
        digest_content = await ai_service.generate_weekly_digest(
            week_start=str(week_start),
            week_end=str(week_end),
            days_logged=days_logged,
            entries_data=entries_data,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"code": "AI_SERVICE_ERROR", "message": str(e)},
        )

    digest = WeeklyDigest(
        user_id=UUID(user_id),
        week_start=week_start,
        week_end=week_end,
        digest_content=digest_content,
    )
    db.add(digest)
    await db.commit()
    await db.refresh(digest)
    return digest
