import uuid
from datetime import datetime, timezone

from app.schemas.voice import VoiceProfileResponse


class TTSEngine:
    """Text-to-Speech engine. Stub implementation for Phase 1."""

    BUILTIN_VOICES = [
        {
            "id": "00000000-0000-0000-0000-000000000001",
            "user_id": None,
            "name": "Alex",
            "engine": "builtin",
            "model_id": "voice-alex-v1",
            "settings": {
                "speed": 1.0,
                "pitch": 0.0,
                "emotion": "neutral",
                "style": "professional",
            },
            "sample_url": None,
            "is_active": True,
            "created_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
            "updated_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
        },
        {
            "id": "00000000-0000-0000-0000-000000000002",
            "user_id": None,
            "name": "Sarah",
            "engine": "builtin",
            "model_id": "voice-sarah-v1",
            "settings": {
                "speed": 1.05,
                "pitch": 0.1,
                "emotion": "warm",
                "style": "conversational",
            },
            "sample_url": None,
            "is_active": True,
            "created_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
            "updated_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
        },
        {
            "id": "00000000-0000-0000-0000-000000000003",
            "user_id": None,
            "name": "James",
            "engine": "builtin",
            "model_id": "voice-james-v1",
            "settings": {
                "speed": 0.95,
                "pitch": -0.1,
                "emotion": "authoritative",
                "style": "news",
            },
            "sample_url": None,
            "is_active": True,
            "created_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
            "updated_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
        },
        {
            "id": "00000000-0000-0000-0000-000000000004",
            "user_id": None,
            "name": "Maya",
            "engine": "builtin",
            "model_id": "voice-maya-v1",
            "settings": {
                "speed": 1.1,
                "pitch": 0.15,
                "emotion": "energetic",
                "style": "storytelling",
            },
            "sample_url": None,
            "is_active": True,
            "created_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
            "updated_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
        },
        {
            "id": "00000000-0000-0000-0000-000000000005",
            "user_id": None,
            "name": "Chris",
            "engine": "builtin",
            "model_id": "voice-chris-v1",
            "settings": {
                "speed": 1.0,
                "pitch": 0.0,
                "emotion": "calm",
                "style": "educational",
            },
            "sample_url": None,
            "is_active": True,
            "created_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
            "updated_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
        },
    ]

    def list_builtin_voices(self) -> list[VoiceProfileResponse]:
        return [VoiceProfileResponse(**voice) for voice in self.BUILTIN_VOICES]

    def synthesize(self, text: str, voice_profile: dict) -> bytes:
        raise NotImplementedError("TTS engine will be integrated in Phase 2")
