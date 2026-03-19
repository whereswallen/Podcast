from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.podcast import Podcast
from app.models.user import User
from app.schemas.podcast import PodcastCreate, PodcastResponse, PodcastUpdate

router = APIRouter(prefix="/api/podcasts", tags=["podcasts"])


def _podcast_to_response(podcast: Podcast) -> PodcastResponse:
    active_episodes = [ep for ep in podcast.episodes if getattr(ep, "status", "") != "deleted"]
    return PodcastResponse(
        id=podcast.id,
        user_id=podcast.user_id,
        title=podcast.title,
        description=podcast.description,
        artwork_url=podcast.artwork_url,
        category=podcast.category,
        language=podcast.language,
        is_active=podcast.is_active,
        episode_count=len(active_episodes),
        created_at=podcast.created_at,
        updated_at=podcast.updated_at,
    )


@router.get("/", response_model=list[PodcastResponse])
def list_podcasts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[PodcastResponse]:
    podcasts = (
        db.query(Podcast)
        .filter(Podcast.user_id == current_user.id, Podcast.is_active.is_(True))
        .order_by(Podcast.created_at.desc())
        .all()
    )
    return [_podcast_to_response(p) for p in podcasts]


@router.post("/", response_model=PodcastResponse, status_code=status.HTTP_201_CREATED)
def create_podcast(
    payload: PodcastCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PodcastResponse:
    podcast = Podcast(
        user_id=current_user.id,
        title=payload.title,
        description=payload.description,
        category=payload.category,
        language=payload.language,
    )
    db.add(podcast)
    db.commit()
    db.refresh(podcast)
    return _podcast_to_response(podcast)


@router.get("/{podcast_id}", response_model=PodcastResponse)
def get_podcast(
    podcast_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PodcastResponse:
    podcast = (
        db.query(Podcast)
        .filter(Podcast.id == podcast_id, Podcast.is_active.is_(True))
        .first()
    )
    if not podcast:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Podcast not found")
    if podcast.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    return _podcast_to_response(podcast)


@router.put("/{podcast_id}", response_model=PodcastResponse)
def update_podcast(
    podcast_id: UUID,
    payload: PodcastUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PodcastResponse:
    podcast = (
        db.query(Podcast)
        .filter(Podcast.id == podcast_id, Podcast.is_active.is_(True))
        .first()
    )
    if not podcast:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Podcast not found")
    if podcast.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(podcast, field, value)

    db.commit()
    db.refresh(podcast)
    return _podcast_to_response(podcast)


@router.delete("/{podcast_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_podcast(
    podcast_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    podcast = (
        db.query(Podcast)
        .filter(Podcast.id == podcast_id, Podcast.is_active.is_(True))
        .first()
    )
    if not podcast:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Podcast not found")
    if podcast.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    podcast.is_active = False
    db.commit()
