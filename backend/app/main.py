import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine
from app.routers import (
    health, profile, focus_areas, entries,
    moods, attachments, ai, search, pins
)

logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"FocusFlow API starting — environment: {settings.ENVIRONMENT}")
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
