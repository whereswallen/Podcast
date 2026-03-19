from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.api.middleware.credit_check import CreditDeduction, require_credits
from app.models.brand import BrandProfile
from app.models.episode import Episode
from app.models.intro_outro import IntroOutroTemplate
from app.models.podcast import Podcast
from app.models.script import Script, ScriptRevision
from app.models.user import User
from app.schemas.script import (
    GenerateScriptRequest,
    RewriteRequest,
    ScriptBlockSchema,
    ScriptResponse,
    ScriptRevisionResponse,
    ScriptUpdate,
)
from app.services.llm.knowledge_service import KnowledgeService
from app.services.llm.script_generator import ScriptGenerator

router = APIRouter(prefix="/api/episodes/{episode_id}/script", tags=["scripts"])


def _get_script_for_episode(
    episode_id: UUID, current_user: User, db: Session
) -> Script:
    episode = db.query(Episode).filter(Episode.id == episode_id).first()
    if not episode or episode.status == "deleted":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Episode not found")
    podcast = db.query(Podcast).filter(Podcast.id == episode.podcast_id).first()
    if not podcast or podcast.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    script = db.query(Script).filter(Script.episode_id == episode_id).first()
    if not script:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Script not found")
    return script


def _calculate_word_count(blocks: list[dict]) -> int:
    return sum(len(block.get("text", "").split()) for block in blocks)


def _estimate_duration(word_count: int) -> int:
    # Average speaking rate: ~150 words per minute
    return int((word_count / 150) * 60)


@router.get("/", response_model=ScriptResponse)
def get_script(
    episode_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ScriptResponse:
    script = _get_script_for_episode(episode_id, current_user, db)
    return ScriptResponse.model_validate(script)


@router.put("/", response_model=ScriptResponse)
def update_script(
    episode_id: UUID,
    payload: ScriptUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ScriptResponse:
    script = _get_script_for_episode(episode_id, current_user, db)

    # Save current version as a revision before updating
    revision = ScriptRevision(
        script_id=script.id,
        version=script.version,
        content=script.content,
    )
    db.add(revision)

    # Update the script
    content_dicts = [block.model_dump() for block in payload.content]
    word_count = _calculate_word_count(content_dicts)

    script.content = content_dicts
    script.version += 1
    script.word_count = word_count
    script.estimated_duration = _estimate_duration(word_count)

    db.commit()
    db.refresh(script)
    return ScriptResponse.model_validate(script)


@router.post("/generate", response_model=ScriptResponse)
async def generate_script(
    episode_id: UUID,
    payload: GenerateScriptRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    deduction: CreditDeduction = Depends(require_credits(10, "script_generate")),
) -> ScriptResponse:
    script = _get_script_for_episode(episode_id, current_user, db)

    # Auto-fetch brand profile for the podcast
    episode = db.query(Episode).filter(Episode.id == episode_id).first()
    podcast = db.query(Podcast).filter(Podcast.id == episode.podcast_id).first()
    brand_dict = None
    brand = db.query(BrandProfile).filter(BrandProfile.podcast_id == episode.podcast_id).first()
    if brand:
        brand_dict = {
            "show_name": brand.show_name,
            "tagline": brand.tagline,
            "personality": brand.personality,
            "target_audience": brand.target_audience,
            "tone_guidelines": brand.tone_guidelines,
            "key_themes": brand.key_themes,
            "vocabulary": brand.vocabulary,
            "content_rules": brand.content_rules,
        }

    # Auto-fetch knowledge context (MANDATORY — prevents content repetition)
    knowledge_svc = KnowledgeService()
    knowledge_context = knowledge_svc.get_context_for_generation(
        episode.podcast_id, db, topic=payload.topic
    )

    # Auto-fetch default intro/outro templates
    intro_text = None
    outro_text = None
    default_intro = (
        db.query(IntroOutroTemplate)
        .filter(
            IntroOutroTemplate.podcast_id == episode.podcast_id,
            IntroOutroTemplate.type == "intro",
            IntroOutroTemplate.is_default.is_(True),
        )
        .first()
    )
    if default_intro:
        intro_text = default_intro.script_template

    default_outro = (
        db.query(IntroOutroTemplate)
        .filter(
            IntroOutroTemplate.podcast_id == episode.podcast_id,
            IntroOutroTemplate.type == "outro",
            IntroOutroTemplate.is_default.is_(True),
        )
        .first()
    )
    if default_outro:
        outro_text = default_outro.script_template

    generator = ScriptGenerator()
    blocks = await generator.generate_script(
        topic=payload.topic,
        format=payload.format,
        tone=payload.tone,
        target_duration=payload.target_duration,
        source_material=payload.source_material,
        brand_profile=brand_dict,
        knowledge_context=knowledge_context,
        intro_template=intro_text,
        outro_template=outro_text,
    )

    # Deduct credits after successful generation
    deduction.commit(db, description=f"Generated script for '{payload.topic}'", episode_id=episode_id)

    # Save current content as revision if it has content
    if script.content:
        revision = ScriptRevision(
            script_id=script.id,
            version=script.version,
            content=script.content,
        )
        db.add(revision)

    content_dicts = [block.model_dump() for block in blocks]
    word_count = _calculate_word_count(content_dicts)

    script.content = content_dicts
    script.version += 1
    script.word_count = word_count
    script.estimated_duration = _estimate_duration(word_count)

    # Update episode status
    episode = db.query(Episode).filter(Episode.id == episode_id).first()
    if episode and episode.status == "draft":
        episode.status = "script"

    db.commit()
    db.refresh(script)
    return ScriptResponse.model_validate(script)


@router.post("/rewrite", response_model=ScriptResponse)
async def rewrite_blocks(
    episode_id: UUID,
    payload: RewriteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    deduction: CreditDeduction = Depends(require_credits(5, "rewrite_blocks")),
) -> ScriptResponse:
    script = _get_script_for_episode(episode_id, current_user, db)

    # Find the blocks to rewrite
    existing_blocks = script.content or []
    blocks_to_rewrite = [
        ScriptBlockSchema(**block)
        for block in existing_blocks
        if block.get("id") in payload.block_ids
    ]

    if not blocks_to_rewrite:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No matching blocks found",
        )

    generator = ScriptGenerator()
    rewritten = await generator.rewrite_blocks(
        blocks=blocks_to_rewrite,
        instruction=payload.instruction,
    )

    # Deduct credits after successful rewrite
    deduction.commit(db, description=f"Rewrote {len(blocks_to_rewrite)} blocks", episode_id=episode_id)

    # Save revision
    revision = ScriptRevision(
        script_id=script.id,
        version=script.version,
        content=script.content,
    )
    db.add(revision)

    # Replace blocks in content
    rewritten_map = {block.id: block.model_dump() for block in rewritten}
    new_content = []
    for block in existing_blocks:
        if block.get("id") in rewritten_map:
            new_content.append(rewritten_map[block["id"]])
        else:
            new_content.append(block)

    word_count = _calculate_word_count(new_content)
    script.content = new_content
    script.version += 1
    script.word_count = word_count
    script.estimated_duration = _estimate_duration(word_count)

    db.commit()
    db.refresh(script)
    return ScriptResponse.model_validate(script)


@router.get("/revisions", response_model=list[ScriptRevisionResponse])
def list_revisions(
    episode_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ScriptRevisionResponse]:
    script = _get_script_for_episode(episode_id, current_user, db)
    revisions = (
        db.query(ScriptRevision)
        .filter(ScriptRevision.script_id == script.id)
        .order_by(ScriptRevision.version.desc())
        .all()
    )
    return [ScriptRevisionResponse.model_validate(r) for r in revisions]


@router.post("/revisions/{version}/restore", response_model=ScriptResponse)
def restore_revision(
    episode_id: UUID,
    version: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ScriptResponse:
    script = _get_script_for_episode(episode_id, current_user, db)

    revision = (
        db.query(ScriptRevision)
        .filter(ScriptRevision.script_id == script.id, ScriptRevision.version == version)
        .first()
    )
    if not revision:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Revision version {version} not found",
        )

    # Save current as revision
    current_revision = ScriptRevision(
        script_id=script.id,
        version=script.version,
        content=script.content,
    )
    db.add(current_revision)

    # Restore
    word_count = _calculate_word_count(revision.content)
    script.content = revision.content
    script.version += 1
    script.word_count = word_count
    script.estimated_duration = _estimate_duration(word_count)

    db.commit()
    db.refresh(script)
    return ScriptResponse.model_validate(script)
