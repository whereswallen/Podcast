import json
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.brand import BrandProfile
from app.models.intro_outro import IntroOutroTemplate
from app.models.podcast import Podcast
from app.models.user import User
from app.schemas.intro_outro import (
    IntroOutroCreate,
    IntroOutroGenerateRequest,
    IntroOutroResponse,
    IntroOutroUpdate,
)
from app.services.llm.script_generator import ScriptGenerator

router = APIRouter(prefix="/api/podcasts/{podcast_id}/intro-outro", tags=["intro-outro"])


def _verify_podcast_ownership(podcast_id: UUID, current_user: User, db: Session) -> Podcast:
    podcast = db.query(Podcast).filter(Podcast.id == podcast_id, Podcast.is_active.is_(True)).first()
    if not podcast:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Podcast not found")
    if podcast.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    return podcast


@router.get("/", response_model=list[IntroOutroResponse])
def list_templates(
    podcast_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[IntroOutroResponse]:
    _verify_podcast_ownership(podcast_id, current_user, db)
    templates = (
        db.query(IntroOutroTemplate)
        .filter(IntroOutroTemplate.podcast_id == podcast_id)
        .order_by(IntroOutroTemplate.type, IntroOutroTemplate.created_at)
        .all()
    )
    return [IntroOutroResponse.model_validate(t) for t in templates]


@router.post("/", response_model=IntroOutroResponse)
def create_template(
    podcast_id: UUID,
    payload: IntroOutroCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> IntroOutroResponse:
    _verify_podcast_ownership(podcast_id, current_user, db)

    # If this is set as default, unset other defaults of same type
    if payload.is_default:
        db.query(IntroOutroTemplate).filter(
            IntroOutroTemplate.podcast_id == podcast_id,
            IntroOutroTemplate.type == payload.type,
            IntroOutroTemplate.is_default.is_(True),
        ).update({"is_default": False})

    template = IntroOutroTemplate(
        podcast_id=podcast_id,
        **payload.model_dump(),
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return IntroOutroResponse.model_validate(template)


@router.put("/{template_id}", response_model=IntroOutroResponse)
def update_template(
    podcast_id: UUID,
    template_id: UUID,
    payload: IntroOutroUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> IntroOutroResponse:
    _verify_podcast_ownership(podcast_id, current_user, db)
    template = (
        db.query(IntroOutroTemplate)
        .filter(IntroOutroTemplate.id == template_id, IntroOutroTemplate.podcast_id == podcast_id)
        .first()
    )
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")

    update_data = payload.model_dump(exclude_unset=True)

    # If setting as default, unset other defaults of same type
    if update_data.get("is_default"):
        db.query(IntroOutroTemplate).filter(
            IntroOutroTemplate.podcast_id == podcast_id,
            IntroOutroTemplate.type == template.type,
            IntroOutroTemplate.is_default.is_(True),
            IntroOutroTemplate.id != template_id,
        ).update({"is_default": False})

    for field, value in update_data.items():
        setattr(template, field, value)

    db.commit()
    db.refresh(template)
    return IntroOutroResponse.model_validate(template)


@router.delete("/{template_id}")
def delete_template(
    podcast_id: UUID,
    template_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    _verify_podcast_ownership(podcast_id, current_user, db)
    template = (
        db.query(IntroOutroTemplate)
        .filter(IntroOutroTemplate.id == template_id, IntroOutroTemplate.podcast_id == podcast_id)
        .first()
    )
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")

    db.delete(template)
    db.commit()
    return {"status": "deleted"}


@router.post("/generate", response_model=IntroOutroResponse)
async def generate_template(
    podcast_id: UUID,
    payload: IntroOutroGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> IntroOutroResponse:
    """AI-generate an intro or outro template from brand profile."""
    _verify_podcast_ownership(podcast_id, current_user, db)

    brand = db.query(BrandProfile).filter(BrandProfile.podcast_id == podcast_id).first()

    show_name = payload.show_name or (brand.show_name if brand else "the podcast")
    personality = payload.personality or (brand.personality if brand else "conversational and engaging")
    tagline = payload.tagline or (brand.tagline if brand else "")

    section = "introduction" if payload.type == "intro" else "conclusion/outro"
    prompt = f"""Write a podcast {section} script template for a show called "{show_name}".

Show personality: {personality}
{f'Tagline: {tagline}' if tagline else ''}

The template should use these variables where appropriate:
- {{episode_title}} - the episode's title
- {{episode_number}} - the episode number
- {{topic}} - the main topic
- {{guest_name}} - guest name (if applicable)
- {{date}} - the recording date

Write ONLY the template text. It should be 2-4 sentences, natural and engaging.
Include the variable placeholders in curly braces where they fit naturally."""

    generator = ScriptGenerator()
    message = await generator.client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        system="You are a podcast script writer. Output only the template text.",
        messages=[{"role": "user", "content": prompt}],
    )

    generated_text = message.content[0].text.strip()

    template = IntroOutroTemplate(
        podcast_id=podcast_id,
        type=payload.type,
        name=f"AI Generated {payload.type.title()}",
        script_template=generated_text,
        speaker_id="host",
        is_default=False,
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return IntroOutroResponse.model_validate(template)
