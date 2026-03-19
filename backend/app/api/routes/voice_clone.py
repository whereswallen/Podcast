import io
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.voice import VoiceProfile
from app.models.voice_clone import VoiceCloneJob
from app.schemas.voice import (
    VoiceCloneCreateRequest,
    VoiceCloneJobResponse,
    VoiceCloneTrainRequest,
    VoiceProfileResponse,
)
from app.services.tts.voice_cloner import VoiceCloner

router = APIRouter(prefix="/api/voice-clone", tags=["voice-clone"])

ALLOWED_AUDIO_TYPES = {
    "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav",
    "audio/ogg", "audio/flac", "audio/m4a", "audio/mp4",
    "audio/webm",
}
MAX_SAMPLE_SIZE_MB = 50
MIN_TOTAL_DURATION_SECONDS = 10  # Minimum total sample duration


@router.post("/", response_model=VoiceCloneJobResponse, status_code=status.HTTP_201_CREATED)
def create_clone_job(
    payload: VoiceCloneCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> VoiceCloneJobResponse:
    """Create a new voice clone job. Upload samples next."""
    job = VoiceCloneJob(
        user_id=current_user.id,
        name=payload.name,
        status="uploading",
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return VoiceCloneJobResponse.model_validate(job)


@router.get("/", response_model=list[VoiceCloneJobResponse])
def list_clone_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[VoiceCloneJobResponse]:
    """List all voice clone jobs for the current user."""
    jobs = (
        db.query(VoiceCloneJob)
        .filter(VoiceCloneJob.user_id == current_user.id)
        .order_by(VoiceCloneJob.created_at.desc())
        .all()
    )
    return [VoiceCloneJobResponse.model_validate(j) for j in jobs]


@router.get("/{job_id}", response_model=VoiceCloneJobResponse)
def get_clone_job(
    job_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> VoiceCloneJobResponse:
    job = (
        db.query(VoiceCloneJob)
        .filter(VoiceCloneJob.id == job_id, VoiceCloneJob.user_id == current_user.id)
        .first()
    )
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clone job not found")
    return VoiceCloneJobResponse.model_validate(job)


@router.post("/{job_id}/upload", response_model=VoiceCloneJobResponse)
async def upload_sample(
    job_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> VoiceCloneJobResponse:
    """Upload an audio sample for voice cloning."""
    job = (
        db.query(VoiceCloneJob)
        .filter(VoiceCloneJob.id == job_id, VoiceCloneJob.user_id == current_user.id)
        .first()
    )
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clone job not found")

    if job.status not in ("uploading", "pending"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot upload samples when job status is '{job.status}'",
        )

    # Validate file type
    content_type = file.content_type or ""
    if content_type not in ALLOWED_AUDIO_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported audio format: {content_type}. Supported: MP3, WAV, OGG, FLAC, M4A, WebM",
        )

    # Read file
    audio_bytes = await file.read()
    size_mb = len(audio_bytes) / (1024 * 1024)
    if size_mb > MAX_SAMPLE_SIZE_MB:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large ({size_mb:.1f}MB). Maximum: {MAX_SAMPLE_SIZE_MB}MB",
        )

    # Analyze and save sample
    cloner = VoiceCloner()
    analysis = cloner.analyze_sample(audio_bytes, file.filename or "sample.mp3")
    sample_url = cloner.save_sample(audio_bytes, str(job.id), file.filename or "sample.mp3")

    # Update job
    current_urls = job.sample_urls or []
    current_urls.append(sample_url)
    job.sample_urls = current_urls
    job.total_duration_seconds += int(analysis.get("duration_seconds", 0))
    job.status = "uploading"

    # Store analysis in training config
    config = job.training_config or {}
    analyses = config.get("analyses", [])
    analyses.append(analysis)
    config["analyses"] = analyses
    job.training_config = config

    db.commit()
    db.refresh(job)
    return VoiceCloneJobResponse.model_validate(job)


@router.post("/{job_id}/train", response_model=VoiceCloneJobResponse)
async def train_voice(
    job_id: UUID,
    payload: VoiceCloneTrainRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> VoiceCloneJobResponse:
    """Start training/processing a cloned voice from uploaded samples."""
    job = (
        db.query(VoiceCloneJob)
        .filter(VoiceCloneJob.id == job_id, VoiceCloneJob.user_id == current_user.id)
        .first()
    )
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clone job not found")

    if not job.sample_urls:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No audio samples uploaded yet",
        )

    if job.total_duration_seconds < MIN_TOTAL_DURATION_SECONDS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Need at least {MIN_TOTAL_DURATION_SECONDS} seconds of audio. Currently have {job.total_duration_seconds}s.",
        )

    # Derive settings from analyses
    cloner = VoiceCloner()
    config = job.training_config or {}
    analyses = config.get("analyses", [])
    derived_settings = cloner.derive_voice_settings(analyses)

    # Merge user-provided settings overrides
    derived_settings["speed"] = payload.speed
    derived_settings["pitch"] = payload.pitch
    derived_settings["emotion"] = payload.emotion
    derived_settings["style"] = payload.style

    # Simulate training
    job.status = "training"
    job.progress = 50
    db.commit()

    result = cloner.simulate_training(job.sample_urls, {"settings": derived_settings})

    # Create the VoiceProfile for the cloned voice
    voice_profile = VoiceProfile(
        user_id=current_user.id,
        name=job.name,
        description=f"Cloned voice from {len(job.sample_urls)} sample(s), {job.total_duration_seconds}s total",
        engine="cloned",
        model_id=result["model_id"],
        settings=result["settings"],
        sample_url=job.sample_urls[0] if job.sample_urls else None,
        sample_urls=job.sample_urls,
        clone_status="ready",
    )
    db.add(voice_profile)
    db.flush()

    # Update job
    job.voice_profile_id = voice_profile.id
    job.status = "ready"
    job.progress = 100
    config["settings"] = derived_settings
    job.training_config = config

    db.commit()
    db.refresh(job)
    return VoiceCloneJobResponse.model_validate(job)


@router.delete("/{job_id}")
def delete_clone_job(
    job_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    job = (
        db.query(VoiceCloneJob)
        .filter(VoiceCloneJob.id == job_id, VoiceCloneJob.user_id == current_user.id)
        .first()
    )
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clone job not found")

    # If a voice profile was created, deactivate it
    if job.voice_profile_id:
        voice = db.query(VoiceProfile).filter(VoiceProfile.id == job.voice_profile_id).first()
        if voice:
            voice.is_active = False

    db.delete(job)
    db.commit()
    return {"status": "deleted"}


@router.get("/{job_id}/voice", response_model=VoiceProfileResponse)
def get_cloned_voice(
    job_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> VoiceProfileResponse:
    """Get the VoiceProfile created from a completed clone job."""
    job = (
        db.query(VoiceCloneJob)
        .filter(VoiceCloneJob.id == job_id, VoiceCloneJob.user_id == current_user.id)
        .first()
    )
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clone job not found")
    if not job.voice_profile_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Voice not yet created. Train the voice first.",
        )

    voice = db.query(VoiceProfile).filter(VoiceProfile.id == job.voice_profile_id).first()
    if not voice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Voice profile not found")
    return VoiceProfileResponse.model_validate(voice)
