import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.routes.ai import router as ai_router
from app.api.routes.audio import router as audio_router
from app.api.routes.auth import router as auth_router
from app.api.routes.brand import router as brand_router
from app.api.routes.episodes import episodes_router, podcast_episodes_router
from app.api.routes.intro_outro import router as intro_outro_router
from app.api.routes.knowledge import router as knowledge_router
from app.api.routes.podcasts import router as podcasts_router
from app.api.routes.scripts import router as scripts_router
from app.api.routes.voices import router as voices_router
from app.api.routes.mixer import router as mixer_router
from app.core.config import settings

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Podcast API started")
    yield
    logger.info("Podcast API shutting down")


app = FastAPI(
    title="AI Podcast Generator API",
    description="Backend API for generating AI-powered podcast scripts and audio",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(podcasts_router)
app.include_router(podcast_episodes_router)
app.include_router(episodes_router)
app.include_router(scripts_router)
app.include_router(voices_router)
app.include_router(audio_router)
app.include_router(ai_router)
app.include_router(mixer_router)
app.include_router(brand_router)
app.include_router(intro_outro_router)
app.include_router(knowledge_router)

# Mount static files for serving rendered audio
media_dir = "/app/media"
os.makedirs(media_dir, exist_ok=True)
app.mount("/media", StaticFiles(directory=media_dir), name="media")


@app.get("/api/health")
def health_check() -> dict:
    return {"status": "healthy", "service": "podcast-api"}
