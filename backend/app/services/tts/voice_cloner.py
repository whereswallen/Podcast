"""Voice cloning service.

Currently uses a simulated cloning pipeline with gTTS + pydub post-processing
to emulate cloned voice characteristics. In production, this would integrate
with a real voice cloning API (e.g., ElevenLabs, Coqui, or a custom model).

The cloning pipeline:
1. User uploads audio samples (minimum 30 seconds recommended)
2. System analyzes samples to extract voice characteristics
3. A VoiceProfile is created with tuned settings that approximate the source voice
4. The cloned voice can then be used for script synthesis via TTSEngine
"""

import io
import json
import logging
import os

from pydub import AudioSegment

logger = logging.getLogger(__name__)

CLONE_MEDIA_DIR = "/app/media/voice_samples"


class VoiceCloner:
    """Voice cloning pipeline."""

    def analyze_sample(self, audio_bytes: bytes, filename: str) -> dict:
        """Analyze an audio sample to extract voice characteristics.

        Returns a dict with:
        - duration_seconds: float
        - estimated_pitch: str (low/medium/high)
        - estimated_speed: str (slow/medium/fast)
        - sample_rate: int
        """
        try:
            # Determine format from filename
            ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "mp3"
            audio = AudioSegment.from_file(io.BytesIO(audio_bytes), format=ext)

            duration = len(audio) / 1000.0  # seconds
            sample_rate = audio.frame_rate
            dbfs = audio.dBFS

            # Estimate pitch based on spectral analysis (simplified)
            # In production, use librosa or similar for proper pitch detection
            estimated_pitch = "medium"
            if sample_rate > 44100:
                estimated_pitch = "high"
            elif sample_rate < 22050:
                estimated_pitch = "low"

            # Estimate speaking speed from silence ratio (simplified)
            from pydub.silence import detect_nonsilent

            nonsilent_ranges = detect_nonsilent(
                audio, min_silence_len=300, silence_thresh=-40
            )
            speech_duration = sum(
                (end - start) for start, end in nonsilent_ranges
            ) / 1000.0
            speech_ratio = speech_duration / duration if duration > 0 else 0

            estimated_speed = "medium"
            if speech_ratio > 0.85:
                estimated_speed = "fast"
            elif speech_ratio < 0.6:
                estimated_speed = "slow"

            return {
                "duration_seconds": round(duration, 1),
                "estimated_pitch": estimated_pitch,
                "estimated_speed": estimated_speed,
                "sample_rate": sample_rate,
                "average_dbfs": round(dbfs, 1),
                "speech_ratio": round(speech_ratio, 2),
            }
        except Exception as e:
            logger.error(f"Error analyzing audio sample: {e}")
            return {
                "duration_seconds": 0,
                "estimated_pitch": "medium",
                "estimated_speed": "medium",
                "sample_rate": 44100,
                "average_dbfs": -20.0,
                "speech_ratio": 0.7,
            }

    def save_sample(self, audio_bytes: bytes, clone_job_id: str, filename: str) -> str:
        """Save an uploaded audio sample to disk.

        Returns the saved file path (relative URL).
        """
        os.makedirs(CLONE_MEDIA_DIR, exist_ok=True)
        # Sanitize filename
        safe_name = filename.replace("/", "_").replace("\\", "_")
        save_path = os.path.join(CLONE_MEDIA_DIR, f"{clone_job_id}_{safe_name}")
        with open(save_path, "wb") as f:
            f.write(audio_bytes)
        return f"/media/voice_samples/{clone_job_id}_{safe_name}"

    def derive_voice_settings(self, analyses: list[dict]) -> dict:
        """Derive voice profile settings from multiple sample analyses.

        Maps analyzed characteristics to TTSEngine-compatible settings.
        """
        if not analyses:
            return {"speed": 1.0, "pitch": 0.0, "emotion": "neutral", "style": "conversational"}

        # Average the analyses
        total_duration = sum(a.get("duration_seconds", 0) for a in analyses)
        avg_speech_ratio = sum(a.get("speech_ratio", 0.7) for a in analyses) / len(analyses)

        # Map pitch estimates to numerical values
        pitch_map = {"low": -0.15, "medium": 0.0, "high": 0.15}
        pitch_values = [pitch_map.get(a.get("estimated_pitch", "medium"), 0.0) for a in analyses]
        avg_pitch = sum(pitch_values) / len(pitch_values)

        # Map speed estimates
        speed_map = {"slow": 0.9, "medium": 1.0, "fast": 1.1}
        speed_values = [speed_map.get(a.get("estimated_speed", "medium"), 1.0) for a in analyses]
        avg_speed = sum(speed_values) / len(speed_values)

        return {
            "speed": round(avg_speed, 2),
            "pitch": round(avg_pitch, 2),
            "emotion": "neutral",
            "style": "conversational",
        }

    def simulate_training(self, sample_urls: list[str], training_config: dict) -> dict:
        """Simulate voice clone training.

        In production, this would submit to a training pipeline.
        Returns a model_id and settings for the cloned voice.
        """
        # In a real system, this would:
        # 1. Send samples to a training API
        # 2. Wait for training completion
        # 3. Return a model_id for inference

        import uuid

        model_id = f"clone-{uuid.uuid4().hex[:12]}"

        settings = training_config.get("settings", {
            "speed": 1.0,
            "pitch": 0.0,
            "emotion": "neutral",
            "style": "conversational",
        })

        return {
            "model_id": model_id,
            "settings": settings,
            "status": "ready",
        }
