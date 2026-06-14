import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.config import settings
from app.database import engine
from app.routers import (
    health, profile, focus_areas, entries,
    moods, attachments, ai, search, pins
)

logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger(__name__)

# Idempotent schema migrations — safe to run on every startup
STARTUP_MIGRATIONS = [
    # AI rate-limit columns (added 2026-06-14)
    "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ai_calls_this_hour INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ai_window_start TIMESTAMPTZ",
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"FocusFlow API starting — environment: {settings.ENVIRONMENT}")
    async with engine.begin() as conn:
        for migration in STARTUP_MIGRATIONS:
            try:
                await conn.execute(text(migration))
                logger.info(f"Migration OK: {migration[:60]}…")
            except Exception as exc:
                logger.warning(f"Migration skipped ({exc}): {migration[:60]}…")
    yield
    await engine.dispose()
    logger.info("FocusFlow API shut down cleanly")


app = FastAPI(
    title="FocusFlow API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(profile.router)
app.include_router(focus_areas.router)
app.include_router(entries.router)
app.include_router(moods.router)
app.include_router(attachments.router)
app.include_router(ai.router)
app.include_router(search.router)
app.include_router(pins.router)
