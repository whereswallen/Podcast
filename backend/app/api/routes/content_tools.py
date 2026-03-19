"""API routes for AI-powered content tools.

Provides endpoints for show notes, transcripts, SEO metadata,
fact-checking, content suggestions, and multi-language translation.
"""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.api.middleware.credit_check import CreditDeduction, require_credits
from app.models.episode import Episode
from app.models.knowledge import KnowledgeEntry
from app.models.podcast import Podcast
from app.models.script import Script
from app.models.user import User
from app.services.llm.content_tools import ContentTools

router = APIRouter(prefix="/api/ai", tags=["ai-tools"])


# ---- Request/Response schemas ----

class ShowNotesResponse(BaseModel):
    summary: str
    key_takeaways: list[str]
    timestamps: list[dict]
    resources: list[str]
    guests: list[str]
    quotes: list[str]


class TranscriptLine(BaseModel):
    timestamp: str
    speaker: str
    text: str


class TranscriptResponse(BaseModel):
    lines: list[TranscriptLine]
    total_duration: str
    word_count: int


class SEOMetadataResponse(BaseModel):
    seo_title: str
    meta_description: str
    tags: list[str]
    social_post_twitter: str
    social_post_linkedin: str
    social_post_short: str
    episode_description: str


class FactCheckItem(BaseModel):
    block_id: Optional[str] = None
    claim: str
    severity: str  # high, medium, low
    suggestion: str
    context: Optional[str] = None


class ContentSuggestion(BaseModel):
    title: str
    description: str
    format: str
    angle: str
    connects_to: str


class TranslateRequest(BaseModel):
    target_language: str  # ISO 639-1 code


# ---- Helper ----

def _get_episode_with_script(
    episode_id: UUID, current_user: User, db: Session
) -> tuple[Episode, Script]:
    episode = db.query(Episode).filter(Episode.id == episode_id).first()
    if not episode or episode.status == "deleted":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Episode not found")
    podcast = db.query(Podcast).filter(Podcast.id == episode.podcast_id).first()
    if not podcast or podcast.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    script = db.query(Script).filter(Script.episode_id == episode_id).first()
    if not script or not script.content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Episode has no script content")
    return episode, script


# ---- Endpoints ----

@router.post("/episodes/{episode_id}/show-notes", response_model=ShowNotesResponse)
async def generate_show_notes(
    episode_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    deduction: CreditDeduction = Depends(require_credits(3, "show_notes")),
) -> ShowNotesResponse:
    """Generate show notes with timestamps and key takeaways."""
    episode, script = _get_episode_with_script(episode_id, current_user, db)

    tools = ContentTools()
    result = await tools.generate_show_notes(
        episode_title=episode.title,
        script_blocks=script.content,
        format=episode.format,
    )
    deduction.commit(db, description=f"Show notes for '{episode.title}'", episode_id=episode_id)
    return ShowNotesResponse(**result)


@router.post("/episodes/{episode_id}/transcript", response_model=TranscriptResponse)
async def generate_transcript(
    episode_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    deduction: CreditDeduction = Depends(require_credits(2, "transcript")),
) -> TranscriptResponse:
    """Generate a formatted transcript with timestamps."""
    episode, script = _get_episode_with_script(episode_id, current_user, db)

    tools = ContentTools()
    result = await tools.generate_transcript(script.content)
    deduction.commit(db, description=f"Transcript for '{episode.title}'", episode_id=episode_id)
    return TranscriptResponse(**result)


@router.post("/episodes/{episode_id}/seo", response_model=SEOMetadataResponse)
async def generate_seo_metadata(
    episode_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    deduction: CreditDeduction = Depends(require_credits(2, "seo_metadata")),
) -> SEOMetadataResponse:
    """Generate SEO-optimized metadata and social media posts."""
    episode, script = _get_episode_with_script(episode_id, current_user, db)
    podcast = db.query(Podcast).filter(Podcast.id == episode.podcast_id).first()

    tools = ContentTools()
    result = await tools.generate_seo_metadata(
        episode_title=episode.title,
        script_blocks=script.content,
        podcast_category=podcast.category if podcast else None,
    )
    deduction.commit(db, description=f"SEO metadata for '{episode.title}'", episode_id=episode_id)
    return SEOMetadataResponse(**result)


@router.post("/episodes/{episode_id}/fact-check", response_model=list[FactCheckItem])
async def fact_check_script(
    episode_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    deduction: CreditDeduction = Depends(require_credits(5, "fact_check")),
) -> list[FactCheckItem]:
    """Flag claims in the script that may need fact-checking."""
    episode, script = _get_episode_with_script(episode_id, current_user, db)

    tools = ContentTools()
    result = await tools.fact_check(script.content)
    deduction.commit(db, description=f"Fact check for '{episode.title}'", episode_id=episode_id)
    return [FactCheckItem(**item) for item in result]


@router.post("/podcasts/{podcast_id}/content-suggestions", response_model=list[ContentSuggestion])
async def suggest_content(
    podcast_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    deduction: CreditDeduction = Depends(require_credits(3, "suggest_content")),
) -> list[ContentSuggestion]:
    """Suggest future episode topics based on podcast history."""
    podcast = db.query(Podcast).filter(
        Podcast.id == podcast_id, Podcast.is_active.is_(True)
    ).first()
    if not podcast:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Podcast not found")
    if podcast.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    # Get previous topics from knowledge base
    previous_topics = []
    summaries = (
        db.query(KnowledgeEntry)
        .filter(
            KnowledgeEntry.podcast_id == podcast_id,
            KnowledgeEntry.entry_type.in_(["episode_summary", "topic"]),
            KnowledgeEntry.is_active.is_(True),
        )
        .order_by(KnowledgeEntry.created_at.desc())
        .limit(50)
        .all()
    )
    previous_topics = [s.title for s in summaries]

    # Fallback: get episode titles if no knowledge entries
    if not previous_topics:
        episodes = (
            db.query(Episode)
            .filter(Episode.podcast_id == podcast_id)
            .order_by(Episode.created_at.desc())
            .limit(20)
            .all()
        )
        previous_topics = [ep.title for ep in episodes]

    tools = ContentTools()
    result = await tools.suggest_content(
        podcast_title=podcast.title,
        podcast_description=podcast.description,
        previous_topics=previous_topics,
        category=podcast.category,
    )
    deduction.commit(db, description=f"Content suggestions for '{podcast.title}'")
    return [ContentSuggestion(**item) for item in result]


@router.post("/episodes/{episode_id}/translate", response_model=dict)
async def translate_script(
    episode_id: UUID,
    payload: TranslateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    deduction: CreditDeduction = Depends(require_credits(8, "translate")),
) -> dict:
    """Translate episode script to another language."""
    episode, script = _get_episode_with_script(episode_id, current_user, db)

    tools = ContentTools()
    supported = tools.get_supported_languages()
    if payload.target_language not in supported:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported language: {payload.target_language}. Supported: {', '.join(supported.keys())}",
        )

    translated_blocks = await tools.translate_script(
        script_blocks=script.content,
        target_language=payload.target_language,
    )
    deduction.commit(db, description=f"Translate to {payload.target_language}", episode_id=episode_id)

    return {
        "source_language": "en",
        "target_language": payload.target_language,
        "target_language_name": supported[payload.target_language],
        "blocks": translated_blocks,
        "block_count": len(translated_blocks),
    }


@router.get("/languages", response_model=dict)
def list_supported_languages(
    current_user: User = Depends(get_current_user),
) -> dict:
    """List supported languages for translation."""
    tools = ContentTools()
    return {"languages": tools.get_supported_languages()}
