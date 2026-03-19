from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class KnowledgeEntryCreate(BaseModel):
    entry_type: str  # episode_summary, topic, guest, key_fact, note, business_context, etc.
    title: str
    content: Optional[str] = None
    tags: Optional[list[str]] = None
    metadata: Optional[dict] = None
    revisit: str = "never"  # never, brief, recurring
    episode_id: Optional[UUID] = None


class KnowledgeEntryUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[list[str]] = None
    metadata: Optional[dict] = None
    revisit: Optional[str] = None
    is_active: Optional[bool] = None


class KnowledgeEntryResponse(BaseModel):
    id: UUID
    podcast_id: UUID
    episode_id: Optional[UUID] = None
    entry_type: str
    title: str
    content: Optional[str] = None
    tags: Optional[list] = None
    metadata_: Optional[dict] = None
    revisit: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class KnowledgeContextResponse(BaseModel):
    never_repeat: list[str]  # bullet points
    brief_recap: list[str]
    recurring: list[str]
    total_entries: int
