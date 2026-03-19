import io
import uuid
from datetime import datetime, timezone

from gtts import gTTS
from pydub import AudioSegment
from pydub.effects import normalize

from app.schemas.voice import VoiceProfileResponse


class TTSEngine:
    """Text-to-Speech engine using gTTS with pydub post-processing."""

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
        """Synthesize text to speech using gTTS with voice profile adjustments.

        Args:
            text: The text to synthesize.
            voice_profile: Dict with optional keys: speed (0.5-2.0), pitch (-1.0 to 1.0).

        Returns:
            MP3 audio bytes.
        """
        # Generate base speech with gTTS
        tts = gTTS(text=text, lang="en")
        mp3_buffer = io.BytesIO()
        tts.write_to_fp(mp3_buffer)
        mp3_buffer.seek(0)

        # Load into pydub for processing
        audio = AudioSegment.from_mp3(mp3_buffer)

        # Extract settings from voice_profile
        settings = voice_profile.get("settings", voice_profile)
        speed = float(settings.get("speed", 1.0))
        pitch = float(settings.get("pitch", 0.0))

        # Clamp speed to valid range
        speed = max(0.5, min(2.0, speed))

        # Apply pitch shift by adjusting sample rate then resampling back
        if pitch != 0.0:
            # Pitch shift: change frame rate to alter pitch, then resample back
            # Positive pitch = higher, negative = lower
            # A pitch of 1.0 corresponds to roughly one octave up
            pitch_factor = 2.0 ** pitch  # semitone-ish scaling
            new_frame_rate = int(audio.frame_rate * pitch_factor)
            # Override frame rate (changes pitch and speed)
            pitched_audio = audio._spawn(audio.raw_data, overrides={"frame_rate": new_frame_rate})
            # Resample back to original frame rate to fix speed change from pitch shift
            audio = pitched_audio.set_frame_rate(audio.frame_rate)

        # Apply speed adjustment
        if speed != 1.0:
            if speed > 1.0:
                # Speed up using pydub's speedup (uses chunking approach)
                try:
                    audio = audio.speedup(playback_speed=speed)
                except Exception:
                    # Fallback: change frame rate
                    new_frame_rate = int(audio.frame_rate * speed)
                    audio = audio._spawn(audio.raw_data, overrides={"frame_rate": new_frame_rate})
                    audio = audio.set_frame_rate(44100)
            else:
                # Slow down by changing frame rate
                new_frame_rate = int(audio.frame_rate * speed)
                audio = audio._spawn(audio.raw_data, overrides={"frame_rate": new_frame_rate})
                audio = audio.set_frame_rate(44100)

        # Export to MP3 bytes
        output_buffer = io.BytesIO()
        audio.export(output_buffer, format="mp3")
        return output_buffer.getvalue()

    def synthesize_blocks(
        self,
        blocks: list[dict],
        voice_assignments: dict[str, dict],
        silence_between_ms: int = 500,
    ) -> bytes:
        """Synthesize multiple script blocks with assigned voices.

        Args:
            blocks: List of script block dicts with 'speaker_name' and 'text' keys.
            voice_assignments: Mapping of speaker_name -> voice_profile dict.
            silence_between_ms: Milliseconds of silence between speakers (default 500).

        Returns:
            Combined MP3 audio bytes.
        """
        silence = AudioSegment.silent(duration=silence_between_ms)
        combined = AudioSegment.empty()

        for i, block in enumerate(blocks):
            speaker_name = block.get("speaker_name", "Host")
            text = block.get("text", "")
            if not text.strip():
                continue

            # Get voice profile for this speaker, or use default
            voice_profile = voice_assignments.get(speaker_name, {"speed": 1.0, "pitch": 0.0})

            # Synthesize this block
            audio_bytes = self.synthesize(text, voice_profile)

            # Load the synthesized audio
            segment = AudioSegment.from_mp3(io.BytesIO(audio_bytes))

            # Add silence between blocks (but not before the first one)
            if len(combined) > 0:
                combined += silence

            combined += segment

        # Export combined audio to MP3
        output_buffer = io.BytesIO()
        combined.export(output_buffer, format="mp3")
        return output_buffer.getvalue()

    def apply_post_processing(self, audio_bytes: bytes) -> bytes:
        """Apply post-processing to audio: normalization to approximately -16 LUFS.

        Args:
            audio_bytes: Raw MP3 audio bytes.

        Returns:
            Processed MP3 audio bytes.
        """
        audio = AudioSegment.from_mp3(io.BytesIO(audio_bytes))

        # Apply normalization using pydub's normalize (targets 0 dBFS headroom)
        audio = normalize(audio)

        # Adjust to target roughly -16 LUFS by setting target dBFS
        # pydub normalize brings to max, then we reduce to approximate -16 LUFS
        target_dbfs = -16.0
        change_in_dbfs = target_dbfs - audio.dBFS
        audio = audio.apply_gain(change_in_dbfs)

        # Export processed audio
        output_buffer = io.BytesIO()
        audio.export(output_buffer, format="mp3")
        return output_buffer.getvalue()
