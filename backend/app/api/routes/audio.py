from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.episode import Episode
from app.models.podcast import Podcast
from app.models.user import User
from app.tasks.audio_tasks import render_episode_audio

router = APIRouter(prefix="/api/episodes/{episode_id}/audio", tags=["audio"])


def _verify_episode_access(
    episode_id: UUID, current_user: User, db: Session
) -> Episode:
    episode = db.query(Episode).filter(Episode.id == episode_id).first()
    if not episode or episode.status == "deleted":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Episode not found")
    podcast = db.query(Podcast).filter(Podcast.id == episode.podcast_id).first()
    if not podcast or podcast.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    return episode


@router.post("/render", status_code=status.HTTP_202_ACCEPTED)
def start_render(
    episode_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    episode = _verify_episode_access(episode_id, current_user, db)

    if not episode.script or not episode.script.content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Episode has no script content to render",
        )

    # Queue the Celery task
    task = render_episode_audio.delay(str(episode_id))

    # Update episode status
    episode.status = "recording"
    db.commit()

    return {
        "task_id": task.id,
        "status": "queued",
        "episode_id": str(episode_id),
    }


@router.get("/render/status")
def render_status(
    episode_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    episode = _verify_episode_access(episode_id, current_user, db)

    if episode.audio_url:
        return {"status": "complete", "audio_url": episode.audio_url}
    elif episode.status == "recording":
        return {"status": "pending"}
    elif episode.status == "editing":
        return {"status": "processing"}
    else:
        return {"status": "not_started"}


@router.get("/")
def get_audio(
    episode_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    episode = _verify_episode_access(episode_id, current_user, db)

    if not episode.audio_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No rendered audio available for this episode",
        )

    return {
        "audio_url": episode.audio_url,
        "episode_id": str(episode_id),
    }
