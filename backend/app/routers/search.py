from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from datetime import date
from typing import Optional
from app.database import get_db
from app.auth.dependencies import get_user_id
from app.services.search_service import full_text_search
from app.schemas.entry import EntryResponse

router = APIRouter(prefix="/search", tags=["search"])


@router.get("")
async def search(
    q: str = Query(..., min_length=1),
    focus_area_id: Optional[UUID] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    results, total = await full_text_search(
        db=db,
        user_id=user_id,
        query=q,
        focus_area_id=focus_area_id,
        date_from=date_from,
        date_to=date_to,
        limit=limit,
        offset=offset,
    )

    return {
        "results": [EntryResponse.model_validate(r) for r in results],
        "total": total,
    }
