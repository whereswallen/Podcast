from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.episode import Episode
from app.models.podcast import Podcast
from app.models.script import Script
from app.models.user import User
from app.schemas.episode import EpisodeCreate, EpisodeResponse, EpisodeUpdate

podcast_episodes_router = APIRouter(prefix="/api/podcasts/{podcast_id}/episodes", tags=["episodes"])
episodes_router = APIRouter(prefix="/api/episodes", tags=["episodes"])


def _verify_podcast_ownership(
    podcast_id: UUID, current_user: User, db: Session
) -> Podcast:
    podcast = (
        db.query(Podcast)
        .filter(Podcast.id == podcast_id, Podcast.is_active.is_(True))
        .first()
    )
    if not podcast:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Podcast not found")
    if podcast.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    return podcast


def _verify_episode_ownership(
    episode_id: UUID, current_user: User, db: Session
) -> Episode:
    episode = db.query(Episode).filter(Episode.id == episode_id).first()
    if not episode or episode.status == "deleted":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Episode not found")
    podcast = db.query(Podcast).filter(Podcast.id == episode.podcast_id).first()
    if not podcast or podcast.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    return episode


@podcast_episodes_router.get("/", response_model=list[EpisodeResponse])
def list_episodes(
    podcast_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[EpisodeResponse]:
    _verify_podcast_ownership(podcast_id, current_user, db)
    episodes = (
        db.query(Episode)
        .filter(Episode.podcast_id == podcast_id, Episode.status != "deleted")
        .order_by(Episode.created_at.desc())
        .all()
    )
    return [EpisodeResponse.model_validate(ep) for ep in episodes]


@podcast_episodes_router.post("/", response_model=EpisodeResponse, status_code=status.HTTP_201_CREATED)
def create_episode(
    podcast_id: UUID,
    payload: EpisodeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> EpisodeResponse:
    _verify_podcast_ownership(podcast_id, current_user, db)
    episode = Episode(
        podcast_id=podcast_id,
        title=payload.title,
        format=payload.format,
        target_duration=payload.target_duration,
    )
    db.add(episode)
    db.flush()

    # Create empty script for the episode
    script = Script(
        episode_id=episode.id,
        version=1,
        content=[],
        word_count=0,
        estimated_duration=0,
    )
    db.add(script)
    db.commit()
    db.refresh(episode)
    return EpisodeResponse.model_validate(episode)


@episodes_router.get("/{episode_id}", response_model=EpisodeResponse)
def get_episode(
    episode_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> EpisodeResponse:
    episode = _verify_episode_ownership(episode_id, current_user, db)
    return EpisodeResponse.model_validate(episode)


@episodes_router.put("/{episode_id}", response_model=EpisodeResponse)
def update_episode(
    episode_id: UUID,
    payload: EpisodeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> EpisodeResponse:
    episode = _verify_episode_ownership(episode_id, current_user, db)
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(episode, field, value)
    db.commit()
    db.refresh(episode)
    return EpisodeResponse.model_validate(episode)


@episodes_router.delete("/{episode_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_episode(
    episode_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    episode = _verify_episode_ownership(episode_id, current_user, db)
    episode.status = "deleted"
    db.commit()
