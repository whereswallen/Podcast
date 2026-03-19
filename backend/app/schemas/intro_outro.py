from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class IntroOutroCreate(BaseModel):
    type: str  # "intro" or "outro"
    name: str
    script_template: str = ""
    speaker_id: Optional[str] = "host"
    voice_id: Optional[UUID] = None
    music_id: Optional[str] = None
    sfx_id: Optional[str] = None
    duration_target: Optional[int] = None
    is_default: bool = False


class IntroOutroUpdate(BaseModel):
    name: Optional[str] = None
    script_template: Optional[str] = None
    speaker_id: Optional[str] = None
    voice_id: Optional[UUID] = None
    music_id: Optional[str] = None
    sfx_id: Optional[str] = None
    duration_target: Optional[int] = None
    is_default: Optional[bool] = None


class IntroOutroResponse(BaseModel):
    id: UUID
    podcast_id: UUID
    type: str
    name: str
    script_template: str
    speaker_id: Optional[str] = None
    voice_id: Optional[UUID] = None
    music_id: Optional[str] = None
    sfx_id: Optional[str] = None
    duration_target: Optional[int] = None
    is_default: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class IntroOutroGenerateRequest(BaseModel):
    type: str  # "intro" or "outro"
    show_name: Optional[str] = None
    personality: Optional[str] = None
    tagline: Optional[str] = None
