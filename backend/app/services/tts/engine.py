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
        {
            "id": "00000000-0000-0000-0000-000000000006",
            "user_id": None,
            "name": "Luna",
            "engine": "builtin",
            "model_id": "voice-luna-v1",
            "settings": {"speed": 0.9, "pitch": 0.2, "emotion": "dreamy", "style": "asmr"},
            "sample_url": None,
            "is_active": True,
            "created_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
            "updated_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
        },
        {
            "id": "00000000-0000-0000-0000-000000000007",
            "user_id": None,
            "name": "Marcus",
            "engine": "builtin",
            "model_id": "voice-marcus-v1",
            "settings": {"speed": 0.85, "pitch": -0.2, "emotion": "serious", "style": "documentary"},
            "sample_url": None,
            "is_active": True,
            "created_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
            "updated_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
        },
        {
            "id": "00000000-0000-0000-0000-000000000008",
            "user_id": None,
            "name": "Priya",
            "engine": "builtin",
            "model_id": "voice-priya-v1",
            "settings": {"speed": 1.05, "pitch": 0.1, "emotion": "cheerful", "style": "tech"},
            "sample_url": None,
            "is_active": True,
            "created_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
            "updated_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
        },
        {
            "id": "00000000-0000-0000-0000-000000000009",
            "user_id": None,
            "name": "Diego",
            "engine": "builtin",
            "model_id": "voice-diego-v1",
            "settings": {"speed": 1.0, "pitch": -0.05, "emotion": "passionate", "style": "sports"},
            "sample_url": None,
            "is_active": True,
            "created_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
            "updated_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
        },
        {
            "id": "00000000-0000-0000-0000-000000000010",
            "user_id": None,
            "name": "Aisha",
            "engine": "builtin",
            "model_id": "voice-aisha-v1",
            "settings": {"speed": 1.0, "pitch": 0.15, "emotion": "empathetic", "style": "wellness"},
            "sample_url": None,
            "is_active": True,
            "created_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
            "updated_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
        },
        {
            "id": "00000000-0000-0000-0000-000000000011",
            "user_id": None,
            "name": "Kai",
            "engine": "builtin",
            "model_id": "voice-kai-v1",
            "settings": {"speed": 1.1, "pitch": 0.0, "emotion": "witty", "style": "comedy"},
            "sample_url": None,
            "is_active": True,
            "created_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
            "updated_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
        },
        {
            "id": "00000000-0000-0000-0000-000000000012",
            "user_id": None,
            "name": "Elena",
            "engine": "builtin",
            "model_id": "voice-elena-v1",
            "settings": {"speed": 0.95, "pitch": 0.1, "emotion": "elegant", "style": "culture"},
            "sample_url": None,
            "is_active": True,
            "created_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
            "updated_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
        },
        {
            "id": "00000000-0000-0000-0000-000000000013",
            "user_id": None,
            "name": "Ravi",
            "engine": "builtin",
            "model_id": "voice-ravi-v1",
            "settings": {"speed": 1.0, "pitch": -0.1, "emotion": "scholarly", "style": "science"},
            "sample_url": None,
            "is_active": True,
            "created_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
            "updated_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
        },
        {
            "id": "00000000-0000-0000-0000-000000000014",
            "user_id": None,
            "name": "Zara",
            "engine": "builtin",
            "model_id": "voice-zara-v1",
            "settings": {"speed": 1.15, "pitch": 0.05, "emotion": "bold", "style": "business"},
            "sample_url": None,
            "is_active": True,
            "created_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
            "updated_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
        },
        {
            "id": "00000000-0000-0000-0000-000000000015",
            "user_id": None,
            "name": "Oliver",
            "engine": "builtin",
            "model_id": "voice-oliver-v1",
            "settings": {"speed": 0.9, "pitch": -0.15, "emotion": "reflective", "style": "philosophy"},
            "sample_url": None,
            "is_active": True,
            "created_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
            "updated_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
        },
        {
            "id": "00000000-0000-0000-0000-000000000016",
            "user_id": None,
            "name": "Mei",
            "engine": "builtin",
            "model_id": "voice-mei-v1",
            "settings": {"speed": 1.05, "pitch": 0.2, "emotion": "gentle", "style": "meditation"},
            "sample_url": None,
            "is_active": True,
            "created_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
            "updated_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
        },
        {
            "id": "00000000-0000-0000-0000-000000000017",
            "user_id": None,
            "name": "Andre",
            "engine": "builtin",
            "model_id": "voice-andre-v1",
            "settings": {"speed": 1.0, "pitch": -0.1, "emotion": "smooth", "style": "jazz"},
            "sample_url": None,
            "is_active": True,
            "created_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
            "updated_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
        },
        {
            "id": "00000000-0000-0000-0000-000000000018",
            "user_id": None,
            "name": "Sofia",
            "engine": "builtin",
            "model_id": "voice-sofia-v1",
            "settings": {"speed": 1.1, "pitch": 0.1, "emotion": "vibrant", "style": "travel"},
            "sample_url": None,
            "is_active": True,
            "created_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
            "updated_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
        },
        {
            "id": "00000000-0000-0000-0000-000000000019",
            "user_id": None,
            "name": "Niko",
            "engine": "builtin",
            "model_id": "voice-niko-v1",
            "settings": {"speed": 0.95, "pitch": -0.05, "emotion": "gritty", "style": "true-crime"},
            "sample_url": None,
            "is_active": True,
            "created_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
            "updated_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
        },
        {
            "id": "00000000-0000-0000-0000-000000000020",
            "user_id": None,
            "name": "Yuki",
            "engine": "builtin",
            "model_id": "voice-yuki-v1",
            "settings": {"speed": 1.0, "pitch": 0.15, "emotion": "bright", "style": "kids"},
            "sample_url": None,
            "is_active": True,
            "created_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
            "updated_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
        },
        {
            "id": "00000000-0000-0000-0000-000000000021",
            "user_id": None,
            "name": "Hassan",
            "engine": "builtin",
            "model_id": "voice-hassan-v1",
            "settings": {"speed": 0.9, "pitch": -0.2, "emotion": "commanding", "style": "history"},
            "sample_url": None,
            "is_active": True,
            "created_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
            "updated_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
        },
        {
            "id": "00000000-0000-0000-0000-000000000022",
            "user_id": None,
            "name": "Chloe",
            "engine": "builtin",
            "model_id": "voice-chloe-v1",
            "settings": {"speed": 1.05, "pitch": 0.1, "emotion": "bubbly", "style": "pop-culture"},
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

    def apply_compression(
        self, audio: AudioSegment, threshold_db: float = -20.0, ratio: float = 4.0
    ) -> AudioSegment:
        """Apply simple dynamic range compression using pydub gain adjustments.

        Analyzes audio in chunks and reduces gain on segments that exceed the threshold.

        Args:
            audio: Input audio segment.
            threshold_db: dBFS level above which compression is applied.
            ratio: Compression ratio (e.g., 4.0 means 4:1 compression).

        Returns:
            Compressed audio segment.
        """
        chunk_ms = 50  # Process in 50ms chunks
        compressed = AudioSegment.empty()

        for i in range(0, len(audio), chunk_ms):
            chunk = audio[i : i + chunk_ms]
            if chunk.dBFS > threshold_db:
                # Amount over threshold
                over_db = chunk.dBFS - threshold_db
                # Reduce gain based on ratio
                gain_reduction = over_db * (1 - 1 / ratio)
                chunk = chunk.apply_gain(-gain_reduction)
            compressed += chunk

        return compressed

    def apply_eq(
        self,
        audio: AudioSegment,
        low_gain: float = 0.0,
        mid_gain: float = 0.0,
        high_gain: float = 0.0,
    ) -> AudioSegment:
        """Apply simple 3-band EQ using pydub filters.

        Splits audio into low/mid/high frequency bands and applies gain to each.

        Args:
            audio: Input audio segment.
            low_gain: Gain in dB for low frequencies (below 300Hz).
            mid_gain: Gain in dB for mid frequencies (300Hz - 4000Hz).
            high_gain: Gain in dB for high frequencies (above 4000Hz).

        Returns:
            EQ-adjusted audio segment.
        """
        from pydub.effects import low_pass_filter, high_pass_filter

        # Split into bands
        low_band = low_pass_filter(audio, 300)
        mid_band = high_pass_filter(low_pass_filter(audio, 4000), 300)
        high_band = high_pass_filter(audio, 4000)

        # Apply gains
        if low_gain != 0.0:
            low_band = low_band.apply_gain(low_gain)
        if mid_gain != 0.0:
            mid_band = mid_band.apply_gain(mid_gain)
        if high_gain != 0.0:
            high_band = high_band.apply_gain(high_gain)

        # Recombine bands by overlaying
        result = low_band.overlay(mid_band).overlay(high_band)
        return result

    def apply_post_processing(self, audio_bytes: bytes) -> bytes:
        """Apply post-processing to audio: normalization, compression, and EQ.

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

        # Apply compression to tame dynamic range
        audio = self.apply_compression(audio, threshold_db=-20.0, ratio=4.0)

        # Apply EQ: slight boost to mids for voice clarity, gentle high-end presence
        audio = self.apply_eq(audio, low_gain=-1.0, mid_gain=1.5, high_gain=0.5)

        # Export processed audio
        output_buffer = io.BytesIO()
        audio.export(output_buffer, format="mp3")
        return output_buffer.getvalue()
