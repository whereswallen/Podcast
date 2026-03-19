from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class PodcastCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    language: str = "en"


class PodcastUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    language: Optional[str] = None
    artwork_url: Optional[str] = None


class PodcastResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    description: Optional[str] = None
    artwork_url: Optional[str] = None
    category: Optional[str] = None
    language: str
    is_active: bool
    episode_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
