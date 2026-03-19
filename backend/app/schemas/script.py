from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class ScriptBlockSchema(BaseModel):
    id: str
    order: int
    speaker_id: Optional[str] = None
    speaker_name: str
    text: str
    stage_direction: Optional[str] = None
    voice_overrides: Optional[dict] = None


class ScriptUpdate(BaseModel):
    content: list[ScriptBlockSchema]


class ScriptResponse(BaseModel):
    id: UUID
    episode_id: UUID
    version: int
    content: list[dict]
    word_count: int
    estimated_duration: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ScriptRevisionResponse(BaseModel):
    id: UUID
    script_id: UUID
    version: int
    content: list[dict]
    created_at: datetime

    model_config = {"from_attributes": True}


class GenerateScriptRequest(BaseModel):
    topic: str
    format: str = "solo"  # solo/conversation/interview/panel/narrative
    tone: str = "conversational"
    target_duration: int = 300  # seconds
    source_material: Optional[str] = None


class RewriteRequest(BaseModel):
    block_ids: list[str]
    instruction: str
