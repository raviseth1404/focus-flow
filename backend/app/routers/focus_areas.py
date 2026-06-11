from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from uuid import UUID
from app.database import get_db
from app.auth.dependencies import get_user_id
from app.models.db_models import FocusArea, DailyEntry
from app.schemas.focus_area import (
    FocusAreaCreate, FocusAreaUpdate, FocusAreaResponse,
    FocusAreaWithStats, ReorderRequest
)

router = APIRouter(prefix="/focus-areas", tags=["focus-areas"])


@router.get("", response_model=list[FocusAreaResponse])
async def list_focus_areas(
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(FocusArea)
        .where(FocusArea.user_id == UUID(user_id), FocusArea.is_archived == False)
        .order_by(FocusArea.display_order)
    )
    return result.scalars().all()


@router.post("", response_model=FocusAreaResponse, status_code=status.HTTP_201_CREATED)
async def create_focus_area(
    payload: FocusAreaCreate,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    fa = FocusArea(user_id=UUID(user_id), **payload.model_dump())
    db.add(fa)
    await db.commit()
    await db.refresh(fa)
    return fa


@router.get("/{fa_id}", response_model=FocusAreaWithStats)
async def get_focus_area(
    fa_id: UUID,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(FocusArea).where(FocusArea.id == fa_id, FocusArea.user_id == UUID(user_id))
    )
    fa = result.scalar_one_or_none()
    if not fa:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Focus area not found")

    # Aggregate stats
    stats = await db.execute(
        select(
            func.count(DailyEntry.id).label("total_days"),
            func.max(DailyEntry.entry_date).label("last_entry_date"),
            func.coalesce(func.sum(DailyEntry.word_count), 0).label("total_words"),
        ).where(DailyEntry.focus_area_id == fa_id, DailyEntry.user_id == UUID(user_id))
    )
    row = stats.one()

    response = FocusAreaWithStats.model_validate(fa)
    response.total_days = row.total_days or 0
    response.last_entry_date = str(row.last_entry_date) if row.last_entry_date else None
    response.total_words = row.total_words or 0
    return response


@router.put("/{fa_id}", response_model=FocusAreaResponse)
async def update_focus_area(
    fa_id: UUID,
    payload: FocusAreaUpdate,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(FocusArea).where(FocusArea.id == fa_id, FocusArea.user_id == UUID(user_id))
    )
    fa = result.scalar_one_or_none()
    if not fa:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Focus area not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(fa, field, value)

    await db.commit()
    await db.refresh(fa)
    return fa


@router.delete("/{fa_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_focus_area(
    fa_id: UUID,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(FocusArea).where(FocusArea.id == fa_id, FocusArea.user_id == UUID(user_id))
    )
    fa = result.scalar_one_or_none()
    if not fa:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Focus area not found")
    await db.delete(fa)
    await db.commit()


@router.put("/reorder", response_model=list[FocusAreaResponse])
async def reorder_focus_areas(
    payload: ReorderRequest,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    for order, fa_id in enumerate(payload.ids):
        result = await db.execute(
            select(FocusArea).where(FocusArea.id == fa_id, FocusArea.user_id == UUID(user_id))
        )
        fa = result.scalar_one_or_none()
        if fa:
            fa.display_order = order

    await db.commit()

    result = await db.execute(
        select(FocusArea)
        .where(FocusArea.user_id == UUID(user_id), FocusArea.is_archived == False)
        .order_by(FocusArea.display_order)
    )
    return result.scalars().all()
