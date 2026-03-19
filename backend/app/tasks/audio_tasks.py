import logging
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.celery_app import celery_app
from app.core.config import settings
from app.models.episode import Episode
from app.models.script import Script
from app.services.tts.engine import TTSEngine

logger = logging.getLogger(__name__)

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

MEDIA_DIR = "/app/media/episodes"


@celery_app.task(bind=True, name="render_episode_audio")
def render_episode_audio(self, episode_id: str) -> dict:
    """
    Render episode audio by synthesizing script blocks with assigned voices.

    Steps:
    1. Fetch the episode and its script
    2. Extract voice assignments from script blocks
    3. Synthesize all blocks with TTSEngine
    4. Apply post-processing (normalization)
    5. Save the output MP3 to local file
    6. Update episode status and audio_url
    """
    logger.info(f"Starting audio render for episode {episode_id}")
    self.update_state(state="PROGRESS", meta={"step": "initializing", "progress": 0})

    db = SessionLocal()
    try:
        # Step 1: Fetch episode
        episode = db.query(Episode).filter(Episode.id == episode_id).first()
        if not episode:
            logger.error(f"Episode {episode_id} not found")
            return {"status": "error", "message": "Episode not found"}

        # Update status to editing
        episode.status = "editing"
        db.commit()

        self.update_state(state="PROGRESS", meta={"step": "fetching_script", "progress": 10})

        # Step 2: Fetch the script
        script = db.query(Script).filter(Script.episode_id == episode.id).first()
        if not script:
            logger.error(f"Script not found for episode {episode_id}")
            return {"status": "error", "message": "Script not found for episode"}

        blocks = script.content or []
        if not blocks:
            logger.error(f"No script blocks found for episode {episode_id}")
            return {"status": "error", "message": "No script blocks in script"}

        self.update_state(state="PROGRESS", meta={"step": "preparing_voices", "progress": 20})

        # Step 3: Build voice assignments from blocks
        tts_engine = TTSEngine()
        builtin_voices = {v["name"]: v for v in tts_engine.BUILTIN_VOICES}

        # Build voice_assignments: speaker_name -> voice_profile
        voice_assignments: dict[str, dict] = {}
        for block in blocks:
            speaker_name = block.get("speaker_name", "Host")
            if speaker_name not in voice_assignments:
                # Check if block has voice_overrides
                voice_overrides = block.get("voice_overrides")
                if voice_overrides:
                    voice_assignments[speaker_name] = voice_overrides
                else:
                    # Try to find a matching builtin voice, otherwise use default
                    if speaker_name in builtin_voices:
                        voice_assignments[speaker_name] = builtin_voices[speaker_name].get(
                            "settings", {"speed": 1.0, "pitch": 0.0}
                        )
                    else:
                        # Assign builtin voices round-robin
                        voice_names = list(builtin_voices.keys())
                        idx = len(voice_assignments) % len(voice_names)
                        voice_assignments[speaker_name] = builtin_voices[voice_names[idx]].get(
                            "settings", {"speed": 1.0, "pitch": 0.0}
                        )

        self.update_state(state="PROGRESS", meta={"step": "synthesizing", "progress": 30})

        # Step 4: Synthesize all blocks
        logger.info(f"Synthesizing {len(blocks)} blocks for episode {episode_id}")
        audio_bytes = tts_engine.synthesize_blocks(blocks, voice_assignments)

        self.update_state(state="PROGRESS", meta={"step": "post_processing", "progress": 80})

        # Step 5: Apply post-processing
        logger.info(f"Applying post-processing for episode {episode_id}")
        processed_audio = tts_engine.apply_post_processing(audio_bytes)

        self.update_state(state="PROGRESS", meta={"step": "saving", "progress": 90})

        # Step 6: Save to local file
        os.makedirs(MEDIA_DIR, exist_ok=True)
        output_path = os.path.join(MEDIA_DIR, f"{episode_id}.mp3")
        with open(output_path, "wb") as f:
            f.write(processed_audio)

        logger.info(f"Saved audio to {output_path}")

        # Step 7: Update episode with audio URL and status
        audio_url = f"/media/episodes/{episode_id}.mp3"
        episode.audio_url = audio_url
        episode.status = "rendered"
        db.commit()

        self.update_state(state="PROGRESS", meta={"step": "complete", "progress": 100})

        logger.info(f"Audio render complete for episode {episode_id}")
        return {
            "status": "complete",
            "episode_id": episode_id,
            "audio_url": audio_url,
        }
    except Exception as e:
        logger.exception(f"Error rendering audio for episode {episode_id}: {e}")
        # Try to update episode status to indicate failure
        try:
            episode = db.query(Episode).filter(Episode.id == episode_id).first()
            if episode:
                episode.status = "draft"
                db.commit()
        except Exception:
            pass
        return {"status": "error", "message": str(e)}
    finally:
        db.close()
