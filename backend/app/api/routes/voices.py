from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.voice import VoiceProfile
from app.schemas.voice import VoicePreviewRequest, VoiceProfileCreate, VoiceProfileResponse
from app.services.tts.engine import TTSEngine

router = APIRouter(prefix="/api/voices", tags=["voices"])

tts_engine = TTSEngine()


@router.get("/", response_model=list[VoiceProfileResponse])
def list_voices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[VoiceProfileResponse]:
    voices = (
        db.query(VoiceProfile)
        .filter(
            VoiceProfile.is_active.is_(True),
            (VoiceProfile.user_id.is_(None)) | (VoiceProfile.user_id == current_user.id),
        )
        .order_by(VoiceProfile.name)
        .all()
    )
    # If no voices in DB, return builtin ones
    if not voices:
        builtin = tts_engine.list_builtin_voices()
        return [VoiceProfileResponse.model_validate(v) for v in builtin]
    return [VoiceProfileResponse.model_validate(v) for v in voices]


@router.get("/builtin", response_model=list[VoiceProfileResponse])
def list_builtin_voices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[VoiceProfileResponse]:
    voices = (
        db.query(VoiceProfile)
        .filter(VoiceProfile.user_id.is_(None), VoiceProfile.is_active.is_(True))
        .order_by(VoiceProfile.name)
        .all()
    )
    if not voices:
        builtin = tts_engine.list_builtin_voices()
        return [VoiceProfileResponse.model_validate(v) for v in builtin]
    return [VoiceProfileResponse.model_validate(v) for v in voices]


@router.get("/custom", response_model=list[VoiceProfileResponse])
def list_custom_voices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[VoiceProfileResponse]:
    voices = (
        db.query(VoiceProfile)
        .filter(
            VoiceProfile.user_id == current_user.id,
            VoiceProfile.is_active.is_(True),
        )
        .order_by(VoiceProfile.name)
        .all()
    )
    return [VoiceProfileResponse.model_validate(v) for v in voices]


@router.post("/custom", response_model=VoiceProfileResponse, status_code=status.HTTP_201_CREATED)
def create_custom_voice(
    payload: VoiceProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> VoiceProfileResponse:
    voice = VoiceProfile(
        user_id=current_user.id,
        name=payload.name,
        engine=payload.engine,
        settings=payload.settings,
    )
    db.add(voice)
    db.commit()
    db.refresh(voice)
    return VoiceProfileResponse.model_validate(voice)


@router.post("/preview", status_code=status.HTTP_200_OK)
def preview_voice(
    payload: VoicePreviewRequest,
    current_user: User = Depends(get_current_user),
) -> dict:
    # Stub: TTS preview will be implemented in Phase 2
    return {
        "status": "ok",
        "message": "Voice preview will be available in Phase 2",
        "voice_id": str(payload.voice_id),
        "text": payload.text,
    }


@router.delete("/custom/{voice_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_custom_voice(
    voice_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    voice = (
        db.query(VoiceProfile)
        .filter(
            VoiceProfile.id == voice_id,
            VoiceProfile.user_id == current_user.id,
            VoiceProfile.is_active.is_(True),
        )
        .first()
    )
    if not voice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Voice profile not found",
        )
    voice.is_active = False
    db.commit()
