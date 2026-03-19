from uuid import UUID
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.api.deps import get_current_user, get_db
from app.models.episode import Episode
from app.models.podcast import Podcast
from app.models.audio_project import AudioProject
from app.models.user import User
from app.services.audio.music import MusicMixer, MUSIC_LIBRARY
from app.services.audio.sfx import SFXEngine, SFX_LIBRARY

router = APIRouter(prefix="/api/mixer", tags=["mixer"])

# --- Schemas ---
class TrackSegment(BaseModel):
    id: str
    start_ms: int
    end_ms: int
    source_url: Optional[str] = None
    source_type: str = "speech"  # speech, music, sfx
    trim_start_ms: int = 0
    trim_end_ms: int = 0
    fade_in_ms: int = 0
    fade_out_ms: int = 0
    volume_db: float = 0.0

class Track(BaseModel):
    id: str
    type: str  # speech, music, sfx
    name: str
    segments: list[TrackSegment] = []
    volume: float = 0.0
    pan: float = 0.0  # -1.0 (left) to 1.0 (right)
    muted: bool = False
    solo: bool = False

class AudioProjectResponse(BaseModel):
    id: UUID
    episode_id: UUID
    tracks: list[dict]
    master_volume: float
    duration_ms: int

    model_config = {"from_attributes": True}

class UpdateProjectRequest(BaseModel):
    tracks: Optional[list[Track]] = None
    master_volume: Optional[float] = None
    duration_ms: Optional[int] = None

class AddMusicRequest(BaseModel):
    music_id: str
    position_ms: int = 0
    volume_db: float = -10.0

class AddSFXRequest(BaseModel):
    sfx_id: str
    position_ms: int
    volume_db: float = 0.0

# --- Helpers ---
def _get_project(episode_id: UUID, current_user: User, db: Session) -> AudioProject:
    episode = db.query(Episode).filter(Episode.id == episode_id).first()
    if not episode:
        raise HTTPException(status_code=404, detail="Episode not found")
    podcast = db.query(Podcast).filter(Podcast.id == episode.podcast_id).first()
    if not podcast or podcast.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    project = db.query(AudioProject).filter(AudioProject.episode_id == episode_id).first()
    if not project:
        project = AudioProject(episode_id=episode_id, tracks=[], master_volume=0.0, duration_ms=0)
        db.add(project)
        db.commit()
        db.refresh(project)
    return project

# --- Routes ---
@router.get("/projects/{episode_id}", response_model=AudioProjectResponse)
def get_project(episode_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return _get_project(episode_id, current_user, db)

@router.put("/projects/{episode_id}", response_model=AudioProjectResponse)
def update_project(episode_id: UUID, payload: UpdateProjectRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = _get_project(episode_id, current_user, db)
    if payload.tracks is not None:
        project.tracks = [t.model_dump() for t in payload.tracks]
    if payload.master_volume is not None:
        project.master_volume = payload.master_volume
    if payload.duration_ms is not None:
        project.duration_ms = payload.duration_ms
    db.commit()
    db.refresh(project)
    return project

@router.get("/music")
def list_music():
    return {"items": MUSIC_LIBRARY}

@router.get("/sfx")
def list_sfx():
    return {"items": SFX_LIBRARY}

@router.post("/projects/{episode_id}/add-music", response_model=AudioProjectResponse)
def add_music_track(episode_id: UUID, payload: AddMusicRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = _get_project(episode_id, current_user, db)
    music_item = next((m for m in MUSIC_LIBRARY if m["id"] == payload.music_id), None)
    if not music_item:
        raise HTTPException(status_code=404, detail="Music not found")

    tracks = project.tracks or []
    music_track = next((t for t in tracks if t.get("type") == "music"), None)
    if not music_track:
        music_track = {"id": f"track-music-{len(tracks)}", "type": "music", "name": "Background Music", "segments": [], "volume": -10.0, "pan": 0.0, "muted": False, "solo": False}
        tracks.append(music_track)

    segment = {
        "id": f"seg-{music_item['id']}", "start_ms": payload.position_ms,
        "end_ms": payload.position_ms + music_item["duration"] * 1000,
        "source_type": "music", "source_url": music_item["id"],
        "trim_start_ms": 0, "trim_end_ms": 0,
        "fade_in_ms": 500, "fade_out_ms": 2000, "volume_db": payload.volume_db,
    }
    music_track["segments"].append(segment)

    project.tracks = tracks
    db.commit()
    db.refresh(project)
    return project

@router.post("/projects/{episode_id}/add-sfx", response_model=AudioProjectResponse)
def add_sfx(episode_id: UUID, payload: AddSFXRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = _get_project(episode_id, current_user, db)
    sfx_item = next((s for s in SFX_LIBRARY if s["id"] == payload.sfx_id), None)
    if not sfx_item:
        raise HTTPException(status_code=404, detail="SFX not found")

    tracks = project.tracks or []
    sfx_track = next((t for t in tracks if t.get("type") == "sfx"), None)
    if not sfx_track:
        sfx_track = {"id": f"track-sfx-{len(tracks)}", "type": "sfx", "name": "Sound Effects", "segments": [], "volume": 0.0, "pan": 0.0, "muted": False, "solo": False}
        tracks.append(sfx_track)

    segment = {
        "id": f"seg-{sfx_item['id']}-{payload.position_ms}", "start_ms": payload.position_ms,
        "end_ms": payload.position_ms + sfx_item["duration_ms"],
        "source_type": "sfx", "source_url": sfx_item["id"],
        "trim_start_ms": 0, "trim_end_ms": 0,
        "fade_in_ms": 0, "fade_out_ms": 0, "volume_db": payload.volume_db,
    }
    sfx_track["segments"].append(segment)

    project.tracks = tracks
    db.commit()
    db.refresh(project)
    return project
