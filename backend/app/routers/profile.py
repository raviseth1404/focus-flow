from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, distinct
from uuid import UUID
from datetime import date, timedelta
from typing import List
from app.database import get_db
from app.auth.dependencies import get_user_id
from app.models.db_models import Profile, UserPreferences, DailyEntry
from app.schemas.profile import ProfileUpdate, ProfileResponse, PreferencesUpdate, PreferencesResponse, StreakResponse

router = APIRouter(tags=["profile"])


@router.get("/me", response_model=ProfileResponse)
async def get_profile(
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Profile).where(Profile.id == UUID(user_id)))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return profile


@router.put("/me", response_model=ProfileResponse)
async def update_profile(
    payload: ProfileUpdate,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Profile).where(Profile.id == UUID(user_id)))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)

    await db.commit()
    await db.refresh(profile)
    return profile


@router.get("/me/preferences", response_model=PreferencesResponse)
async def get_preferences(
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserPreferences).where(UserPreferences.user_id == UUID(user_id))
    )
    prefs = result.scalar_one_or_none()
    if not prefs:
        # Create default preferences
        prefs = UserPreferences(user_id=UUID(user_id))
        db.add(prefs)
        await db.commit()
        await db.refresh(prefs)
    return prefs


@router.put("/me/preferences", response_model=PreferencesResponse)
async def update_preferences(
    payload: PreferencesUpdate,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserPreferences).where(UserPreferences.user_id == UUID(user_id))
    )
    prefs = result.scalar_one_or_none()
    if not prefs:
        prefs = UserPreferences(user_id=UUID(user_id))
        db.add(prefs)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(prefs, field, value)

    await db.commit()
    await db.refresh(prefs)
    return prefs


@router.get("/me/streak", response_model=StreakResponse)
async def get_streak(
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    # Get all distinct dates the user has logged an entry
    result = await db.execute(
        select(distinct(DailyEntry.entry_date))
        .where(DailyEntry.user_id == UUID(user_id))
        .order_by(DailyEntry.entry_date.desc())
    )
    dates: List[date] = [row[0] for row in result.fetchall()]

    if not dates:
        return StreakResponse(current_streak=0, longest_streak=0, total_days=0, last_logged_date=None)

    today = date.today()
    date_set = set(dates)

    # Current streak — must include today or yesterday to be "active"
    current_streak = 0
    check = today
    if check not in date_set:
        check = today - timedelta(days=1)
    while check in date_set:
        current_streak += 1
        check -= timedelta(days=1)

    # Longest streak
    longest = 1
    run = 1
    for i in range(len(dates) - 1):
        if (dates[i] - dates[i + 1]).days == 1:
            run += 1
            longest = max(longest, run)
        else:
            run = 1

    return StreakResponse(
        current_streak=current_streak,
        longest_streak=max(longest, current_streak),
        total_days=len(dates),
        last_logged_date=dates[0],
    )


@router.patch("/me/onboarding", response_model=ProfileResponse)
async def complete_onboarding(
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Profile).where(Profile.id == UUID(user_id)))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    profile.onboarding_done = True
    await db.commit()
    await db.refresh(profile)
    return profile
