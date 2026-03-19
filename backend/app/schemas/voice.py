from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class VoiceProfileCreate(BaseModel):
    name: str
    engine: str = "cloned"  # builtin/cloned/external
    settings: dict = {}


class VoiceProfileResponse(BaseModel):
    id: UUID
    user_id: Optional[UUID] = None
    name: str
    engine: str
    model_id: Optional[str] = None
    settings: dict
    sample_url: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class VoicePreviewRequest(BaseModel):
    voice_id: UUID
    text: str
