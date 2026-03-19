"""API routes for AI-powered content tools.

Provides endpoints for show notes, transcripts, SEO metadata,
fact-checking, content suggestions, and multi-language translation.
"""

from datetime import datetime, timezone
from typing import Literal, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.api.middleware.credit_check import CreditDeduction, require_credits
from app.models.brand import BrandProfile
from app.models.episode import Episode
from app.models.fact_check import FactCheckResult
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


class FactCheckItemResponse(BaseModel):
    id: str
    block_id: Optional[str] = None
    claim: str
    severity: Literal["high", "medium", "low"]
    confidence: float
    suggestion: str
    sources: list[str]
    context: Optional[str] = None
    domain: Optional[str] = None
    resolved: bool
    resolved_at: Optional[str] = None
    resolution_note: Optional[str] = None

    model_config = {"from_attributes": True}


class FactCheckResolveRequest(BaseModel):
    resolution_note: str


class FactCheckSummary(BaseModel):
    items: list[FactCheckItemResponse]
    total: int
    unresolved_high: int
    unresolved_medium: int
    unresolved_low: int
    publish_blocked: bool
    domain: Optional[str] = None


class ContentSuggestion(BaseModel):
    title: str
    description: str
    format: str
    angle: str
    connects_to: str


class VisualCardsResponse(BaseModel):
    quote_card: str  # base64 PNG
    topic_card: str  # base64 PNG
    audiogram_preview: str  # base64 PNG
    best_quote: str
    takeaways: list[str]


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


def _get_brand_context(podcast_id: UUID, db: Session) -> tuple[Optional[BrandProfile], str, list[str]]:
    """Fetch brand profile, domain, and content rules for fact-check context."""
    brand = db.query(BrandProfile).filter(BrandProfile.podcast_id == podcast_id).first()
    domain = (brand.domain or "general") if brand else "general"
    content_rules = []
    if brand and brand.content_rules:
        content_rules.append(brand.content_rules)
    return brand, domain, content_rules


def _get_knowledge_facts(podcast_id: UUID, db: Session) -> list[str]:
    """Fetch key_fact entries from knowledge base for cross-referencing."""
    entries = (
        db.query(KnowledgeEntry)
        .filter(
            KnowledgeEntry.podcast_id == podcast_id,
            KnowledgeEntry.entry_type.in_(["key_fact", "source_material"]),
            KnowledgeEntry.is_active.is_(True),
        )
        .limit(100)
        .all()
    )
    facts = []
    for e in entries:
        line = e.title
        if e.content:
            line += f" — {e.content[:200]}"
        facts.append(line)
    return facts


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


@router.post("/episodes/{episode_id}/visual-cards", response_model=VisualCardsResponse)
async def generate_visual_cards(
    episode_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    deduction: CreditDeduction = Depends(require_credits(3, "visual_cards")),
) -> VisualCardsResponse:
    """Generate branded social media cards (quote, topic, audiogram) for an episode."""
    import base64

    from app.services.image.card_generator import CardGenerator

    episode, script = _get_episode_with_script(episode_id, current_user, db)
    podcast = db.query(Podcast).filter(Podcast.id == episode.podcast_id).first()
    brand, _, _ = _get_brand_context(podcast.id, db)

    brand_colors = brand.brand_colors if brand and brand.brand_colors else None
    show_name = (brand.show_name if brand and brand.show_name else podcast.title) or "CastNode"

    tools = ContentTools()
    visual = await tools.extract_visual_content(
        episode_title=episode.title,
        script_blocks=script.content,
    )
    deduction.commit(db, description=f"Visual cards for '{episode.title}'", episode_id=episode_id)

    generator = CardGenerator(brand_colors=brand_colors, show_name=show_name)

    quote_card_bytes = generator.generate_quote_card(visual["best_quote"], episode.title)
    topic_card_bytes = generator.generate_topic_card(episode.title, visual["takeaways"])
    audiogram_bytes = generator.generate_audiogram_preview(
        visual.get("audiogram_quote", visual["best_quote"]), episode.title
    )

    return VisualCardsResponse(
        quote_card=base64.b64encode(quote_card_bytes).decode(),
        topic_card=base64.b64encode(topic_card_bytes).decode(),
        audiogram_preview=base64.b64encode(audiogram_bytes).decode(),
        best_quote=visual["best_quote"],
        takeaways=visual["takeaways"],
    )


@router.post("/episodes/{episode_id}/fact-check", response_model=FactCheckSummary)
async def fact_check_script(
    episode_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    deduction: CreditDeduction = Depends(require_credits(5, "fact_check")),
) -> FactCheckSummary:
    """Flag claims in the script that may need fact-checking.

    Results are persisted to the database. Episodes with unresolved
    high-severity flags in regulated domains cannot be published.
    """
    episode, script = _get_episode_with_script(episode_id, current_user, db)
    podcast = db.query(Podcast).filter(Podcast.id == episode.podcast_id).first()

    # Gather context for domain-aware checking
    brand, domain, content_rules = _get_brand_context(podcast.id, db)
    known_facts = _get_knowledge_facts(podcast.id, db)

    tools = ContentTools()
    result = await tools.fact_check(
        script_blocks=script.content,
        domain=domain,
        content_rules=content_rules,
        known_facts=known_facts,
    )
    deduction.commit(db, description=f"Fact check for '{episode.title}'", episode_id=episode_id)

    # Clear previous results for this episode and persist new ones
    db.query(FactCheckResult).filter(FactCheckResult.episode_id == episode_id).delete(
        synchronize_session="fetch"
    )

    persisted = []
    for item in result:
        row = FactCheckResult(
            episode_id=episode_id,
            block_id=item.get("block_id"),
            claim=item["claim"],
            severity=item.get("severity", "medium"),
            confidence=item.get("confidence", 0.5),
            suggestion=item["suggestion"],
            sources=item.get("sources", []),
            context=item.get("context"),
            domain=domain,
        )
        db.add(row)
        persisted.append(row)

    db.commit()
    for row in persisted:
        db.refresh(row)

    return _build_fact_check_summary(persisted, domain)


@router.get("/episodes/{episode_id}/fact-check", response_model=FactCheckSummary)
def get_fact_check_results(
    episode_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FactCheckSummary:
    """Retrieve persisted fact-check results for an episode."""
    episode = db.query(Episode).filter(Episode.id == episode_id).first()
    if not episode or episode.status == "deleted":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Episode not found")
    podcast = db.query(Podcast).filter(Podcast.id == episode.podcast_id).first()
    if not podcast or podcast.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    results = (
        db.query(FactCheckResult)
        .filter(FactCheckResult.episode_id == episode_id)
        .order_by(FactCheckResult.created_at)
        .all()
    )

    _, domain, _ = _get_brand_context(podcast.id, db)
    return _build_fact_check_summary(results, domain)


@router.post("/episodes/{episode_id}/fact-check/{item_id}/resolve", response_model=FactCheckItemResponse)
def resolve_fact_check_item(
    episode_id: UUID,
    item_id: UUID,
    payload: FactCheckResolveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FactCheckItemResponse:
    """Mark a fact-check flag as resolved with a verification note.

    Requires an explicit resolution_note explaining how the claim was
    verified — the reviewer must attest they checked the claim.
    """
    # Verify ownership
    episode = db.query(Episode).filter(Episode.id == episode_id).first()
    if not episode or episode.status == "deleted":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Episode not found")
    podcast = db.query(Podcast).filter(Podcast.id == episode.podcast_id).first()
    if not podcast or podcast.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    item = db.query(FactCheckResult).filter(
        FactCheckResult.id == item_id,
        FactCheckResult.episode_id == episode_id,
    ).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fact-check item not found")

    if not payload.resolution_note.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resolution note is required — explain how this claim was verified.",
        )

    item.resolved = True
    item.resolved_by = current_user.id
    item.resolved_at = datetime.now(timezone.utc)
    item.resolution_note = payload.resolution_note.strip()
    db.commit()
    db.refresh(item)

    return FactCheckItemResponse(
        id=str(item.id),
        block_id=item.block_id,
        claim=item.claim,
        severity=item.severity,
        confidence=item.confidence,
        suggestion=item.suggestion,
        sources=item.sources or [],
        context=item.context,
        domain=item.domain,
        resolved=item.resolved,
        resolved_at=item.resolved_at.isoformat() if item.resolved_at else None,
        resolution_note=item.resolution_note,
    )


@router.post("/episodes/{episode_id}/fact-check/{item_id}/unresolve", response_model=FactCheckItemResponse)
def unresolve_fact_check_item(
    episode_id: UUID,
    item_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FactCheckItemResponse:
    """Re-open a previously resolved fact-check flag."""
    episode = db.query(Episode).filter(Episode.id == episode_id).first()
    if not episode or episode.status == "deleted":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Episode not found")
    podcast = db.query(Podcast).filter(Podcast.id == episode.podcast_id).first()
    if not podcast or podcast.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    item = db.query(FactCheckResult).filter(
        FactCheckResult.id == item_id,
        FactCheckResult.episode_id == episode_id,
    ).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fact-check item not found")

    item.resolved = False
    item.resolved_by = None
    item.resolved_at = None
    item.resolution_note = None
    db.commit()
    db.refresh(item)

    return FactCheckItemResponse(
        id=str(item.id),
        block_id=item.block_id,
        claim=item.claim,
        severity=item.severity,
        confidence=item.confidence,
        suggestion=item.suggestion,
        sources=item.sources or [],
        context=item.context,
        domain=item.domain,
        resolved=item.resolved,
        resolved_at=None,
        resolution_note=None,
    )


def _build_fact_check_summary(results: list[FactCheckResult], domain: str) -> FactCheckSummary:
    """Build summary with publish-gate logic from persisted results."""
    items = []
    for r in results:
        items.append(FactCheckItemResponse(
            id=str(r.id),
            block_id=r.block_id,
            claim=r.claim,
            severity=r.severity,
            confidence=r.confidence,
            suggestion=r.suggestion,
            sources=r.sources or [],
            context=r.context,
            domain=r.domain,
            resolved=r.resolved,
            resolved_at=r.resolved_at.isoformat() if r.resolved_at else None,
            resolution_note=r.resolution_note,
        ))

    unresolved_high = sum(1 for r in results if r.severity == "high" and not r.resolved)
    unresolved_medium = sum(1 for r in results if r.severity == "medium" and not r.resolved)
    unresolved_low = sum(1 for r in results if r.severity == "low" and not r.resolved)

    # Publish gate: regulated domains block on ANY unresolved high-severity flag.
    # General domain blocks only if 3+ unresolved high-severity flags exist.
    regulated_domains = {"legal", "medical", "financial"}
    if domain in regulated_domains:
        publish_blocked = unresolved_high > 0
    else:
        publish_blocked = unresolved_high >= 3

    return FactCheckSummary(
        items=items,
        total=len(items),
        unresolved_high=unresolved_high,
        unresolved_medium=unresolved_medium,
        unresolved_low=unresolved_low,
        publish_blocked=publish_blocked,
        domain=domain,
    )


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
