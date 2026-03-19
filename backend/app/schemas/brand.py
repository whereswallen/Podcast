from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class BrandProfileUpdate(BaseModel):
    show_name: Optional[str] = None
    tagline: Optional[str] = None
    personality: Optional[str] = None
    target_audience: Optional[str] = None
    tone_guidelines: Optional[dict] = None  # {"do": [], "dont": []}
    key_themes: Optional[list[str]] = None
    vocabulary: Optional[list[str]] = None
    content_rules: Optional[str] = None
    default_voice_assignments: Optional[dict] = None
    default_music_id: Optional[str] = None
    default_sfx_ids: Optional[list[str]] = None
    brand_colors: Optional[dict] = None


class BrandProfileResponse(BaseModel):
    id: UUID
    podcast_id: UUID
    show_name: Optional[str] = None
    tagline: Optional[str] = None
    personality: Optional[str] = None
    target_audience: Optional[str] = None
    tone_guidelines: Optional[dict] = None
    key_themes: Optional[list] = None
    vocabulary: Optional[list] = None
    content_rules: Optional[str] = None
    default_voice_assignments: Optional[dict] = None
    default_music_id: Optional[str] = None
    default_sfx_ids: Optional[list] = None
    brand_colors: Optional[dict] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BrandGenerateRequest(BaseModel):
    podcast_title: str
    podcast_description: Optional[str] = None
    category: Optional[str] = None
