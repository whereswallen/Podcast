from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class EpisodeCreate(BaseModel):
    title: str
    format: str = "solo"  # solo/conversation/interview/panel/narrative
    target_duration: Optional[int] = None  # seconds


class EpisodeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    format: Optional[str] = None
    target_duration: Optional[int] = None


class EpisodeResponse(BaseModel):
    id: UUID
    podcast_id: UUID
    title: str
    description: Optional[str] = None
    status: str
    format: str
    target_duration: Optional[int] = None
    audio_url: Optional[str] = None
    published_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
