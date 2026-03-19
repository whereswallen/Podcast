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
    description: Optional[str] = None
    engine: str
    model_id: Optional[str] = None
    settings: dict
    sample_url: Optional[str] = None
    sample_urls: Optional[list] = None
    clone_status: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class VoicePreviewRequest(BaseModel):
    voice_id: UUID
    text: str


# ---- Voice Cloning ----
class VoiceCloneCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None


class VoiceCloneConsentRequest(BaseModel):
    """Consent verification for voice cloning."""
    consent_name: str  # Name of the voice owner
    consent_email: Optional[str] = None  # Email for consent record
    consent_statement: str = "I confirm that I have the right to clone this voice and the voice owner has given explicit permission."
    consent_given: bool  # Must be True


class VoiceCloneJobResponse(BaseModel):
    id: UUID
    user_id: UUID
    voice_profile_id: Optional[UUID] = None
    name: str
    status: str
    sample_urls: list
    total_duration_seconds: int
    training_config: Optional[dict] = None
    error_message: Optional[str] = None
    progress: int
    consent_given: bool
    consent_name: Optional[str] = None
    consent_email: Optional[str] = None
    consent_given_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class VoiceCloneTrainRequest(BaseModel):
    """Request to start training a cloned voice."""
    speed: float = 1.0
    pitch: float = 0.0
    emotion: str = "neutral"
    style: str = "conversational"
