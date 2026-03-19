from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.knowledge import KnowledgeEntry
from app.models.podcast import Podcast
from app.models.user import User
from app.schemas.knowledge import (
    KnowledgeContextResponse,
    KnowledgeEntryCreate,
    KnowledgeEntryResponse,
    KnowledgeEntryUpdate,
)
from app.services.llm.knowledge_service import KnowledgeService

router = APIRouter(prefix="/api/podcasts/{podcast_id}/knowledge", tags=["knowledge"])


def _verify_podcast_ownership(podcast_id: UUID, current_user: User, db: Session) -> Podcast:
    podcast = db.query(Podcast).filter(Podcast.id == podcast_id, Podcast.is_active.is_(True)).first()
    if not podcast:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Podcast not found")
    if podcast.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    return podcast


@router.get("/", response_model=list[KnowledgeEntryResponse])
def list_entries(
    podcast_id: UUID,
    entry_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    revisit: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[KnowledgeEntryResponse]:
    _verify_podcast_ownership(podcast_id, current_user, db)

    query = db.query(KnowledgeEntry).filter(
        KnowledgeEntry.podcast_id == podcast_id,
        KnowledgeEntry.is_active.is_(True),
    )

    if entry_type:
        query = query.filter(KnowledgeEntry.entry_type == entry_type)
    if revisit:
        query = query.filter(KnowledgeEntry.revisit == revisit)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                KnowledgeEntry.title.ilike(search_pattern),
                KnowledgeEntry.content.ilike(search_pattern),
            )
        )

    entries = query.order_by(KnowledgeEntry.created_at.desc()).all()
    return [KnowledgeEntryResponse.model_validate(e) for e in entries]


@router.post("/", response_model=KnowledgeEntryResponse)
def create_entry(
    podcast_id: UUID,
    payload: KnowledgeEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> KnowledgeEntryResponse:
    _verify_podcast_ownership(podcast_id, current_user, db)

    entry = KnowledgeEntry(
        podcast_id=podcast_id,
        episode_id=payload.episode_id,
        entry_type=payload.entry_type,
        title=payload.title,
        content=payload.content,
        tags=payload.tags or [],
        metadata_=payload.metadata or {},
        revisit=payload.revisit,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return KnowledgeEntryResponse.model_validate(entry)


@router.put("/{entry_id}", response_model=KnowledgeEntryResponse)
def update_entry(
    podcast_id: UUID,
    entry_id: UUID,
    payload: KnowledgeEntryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> KnowledgeEntryResponse:
    _verify_podcast_ownership(podcast_id, current_user, db)
    entry = (
        db.query(KnowledgeEntry)
        .filter(KnowledgeEntry.id == entry_id, KnowledgeEntry.podcast_id == podcast_id)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")

    update_data = payload.model_dump(exclude_unset=True)
    # Map 'metadata' field name to model column
    if "metadata" in update_data:
        update_data["metadata_"] = update_data.pop("metadata")
    for field, value in update_data.items():
        setattr(entry, field, value)

    db.commit()
    db.refresh(entry)
    return KnowledgeEntryResponse.model_validate(entry)


@router.delete("/{entry_id}")
def delete_entry(
    podcast_id: UUID,
    entry_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    _verify_podcast_ownership(podcast_id, current_user, db)
    entry = (
        db.query(KnowledgeEntry)
        .filter(KnowledgeEntry.id == entry_id, KnowledgeEntry.podcast_id == podcast_id)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")

    db.delete(entry)
    db.commit()
    return {"status": "deleted"}


@router.delete("/")
def bulk_delete_entries(
    podcast_id: UUID,
    entry_ids: list[UUID] = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Bulk delete knowledge entries by IDs."""
    _verify_podcast_ownership(podcast_id, current_user, db)
    deleted = (
        db.query(KnowledgeEntry)
        .filter(
            KnowledgeEntry.id.in_(entry_ids),
            KnowledgeEntry.podcast_id == podcast_id,
        )
        .delete(synchronize_session="fetch")
    )
    db.commit()
    return {"status": "deleted", "count": deleted}


@router.post("/auto-summarize/{episode_id}", response_model=list[KnowledgeEntryResponse])
async def auto_summarize_episode(
    podcast_id: UUID,
    episode_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[KnowledgeEntryResponse]:
    """Auto-generate knowledge entries from an episode's script."""
    _verify_podcast_ownership(podcast_id, current_user, db)

    service = KnowledgeService()
    entries = await service.auto_summarize_episode(podcast_id, episode_id, db)
    return [KnowledgeEntryResponse.model_validate(e) for e in entries]


@router.get("/context", response_model=KnowledgeContextResponse)
def get_knowledge_context(
    podcast_id: UUID,
    topic: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> KnowledgeContextResponse:
    """Get knowledge context organized by revisit level for script generation."""
    _verify_podcast_ownership(podcast_id, current_user, db)

    entries = (
        db.query(KnowledgeEntry)
        .filter(
            KnowledgeEntry.podcast_id == podcast_id,
            KnowledgeEntry.is_active.is_(True),
        )
        .order_by(KnowledgeEntry.created_at.desc())
        .all()
    )

    never_repeat = []
    brief_recap = []
    recurring = []

    for entry in entries:
        bullet = f"{entry.title}"
        if entry.content:
            bullet += f" — {entry.content[:200]}"

        if entry.revisit == "never":
            never_repeat.append(bullet)
        elif entry.revisit == "brief":
            brief_recap.append(bullet)
        elif entry.revisit == "recurring":
            recurring.append(bullet)

    return KnowledgeContextResponse(
        never_repeat=never_repeat,
        brief_recap=brief_recap,
        recurring=recurring,
        total_entries=len(entries),
    )
