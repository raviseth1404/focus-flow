from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from uuid import UUID
from app.database import get_db
from app.auth.dependencies import get_user_id
from app.models.db_models import PinnedItem, DailyEntry, FocusArea
from app.schemas.pin import PinCreate, PinResponse

router = APIRouter(prefix="/pins", tags=["pins"])


@router.get("", response_model=list[PinResponse])
async def list_pins(
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PinnedItem)
        .where(PinnedItem.user_id == UUID(user_id))
        .order_by(PinnedItem.created_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=PinResponse, status_code=status.HTTP_201_CREATED)
async def create_pin(
    payload: PinCreate,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    # Verify entry belongs to user
    entry_result = await db.execute(
        select(DailyEntry).where(
            DailyEntry.id == payload.daily_entry_id,
            DailyEntry.user_id == UUID(user_id),
        )
    )
    if not entry_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Entry not found")

    pin = PinnedItem(
        user_id=UUID(user_id),
        daily_entry_id=payload.daily_entry_id,
        focus_area_id=payload.focus_area_id,
        section=payload.section,
        pin_note=payload.pin_note,
    )
    db.add(pin)
    await db.commit()
    await db.refresh(pin)
    return pin


@router.delete("/{pin_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pin(
    pin_id: UUID,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PinnedItem).where(
            PinnedItem.id == pin_id,
            PinnedItem.user_id == UUID(user_id),
        )
    )
    pin = result.scalar_one_or_none()
    if not pin:
        raise HTTPException(status_code=404, detail="Pin not found")
    await db.delete(pin)
    await db.commit()
