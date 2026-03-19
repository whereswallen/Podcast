from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.api.middleware.credit_check import CreditDeduction, require_credits
from app.models.brand import BrandProfile
from app.models.podcast import Podcast
from app.models.user import User
from app.schemas.brand import BrandGenerateRequest, BrandProfileResponse, BrandProfileUpdate
from app.services.llm.script_generator import ScriptGenerator

router = APIRouter(prefix="/api/podcasts/{podcast_id}/brand", tags=["brand"])


def _verify_podcast_ownership(podcast_id: UUID, current_user: User, db: Session) -> Podcast:
    podcast = db.query(Podcast).filter(Podcast.id == podcast_id, Podcast.is_active.is_(True)).first()
    if not podcast:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Podcast not found")
    if podcast.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    return podcast


@router.get("/", response_model=BrandProfileResponse)
def get_brand(
    podcast_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BrandProfileResponse:
    _verify_podcast_ownership(podcast_id, current_user, db)
    brand = db.query(BrandProfile).filter(BrandProfile.podcast_id == podcast_id).first()
    if not brand:
        # Auto-create empty brand profile
        brand = BrandProfile(podcast_id=podcast_id)
        db.add(brand)
        db.commit()
        db.refresh(brand)
    return BrandProfileResponse.model_validate(brand)


@router.put("/", response_model=BrandProfileResponse)
def update_brand(
    podcast_id: UUID,
    payload: BrandProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BrandProfileResponse:
    _verify_podcast_ownership(podcast_id, current_user, db)
    brand = db.query(BrandProfile).filter(BrandProfile.podcast_id == podcast_id).first()
    if not brand:
        brand = BrandProfile(podcast_id=podcast_id)
        db.add(brand)

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(brand, field, value)

    db.commit()
    db.refresh(brand)
    return BrandProfileResponse.model_validate(brand)


@router.post("/generate", response_model=BrandProfileResponse)
async def generate_brand(
    podcast_id: UUID,
    payload: BrandGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    deduction: CreditDeduction = Depends(require_credits(3, "brand_generate")),
) -> BrandProfileResponse:
    """AI-generate brand profile suggestions from podcast info."""
    _verify_podcast_ownership(podcast_id, current_user, db)

    generator = ScriptGenerator()
    prompt = f"""Based on this podcast information, generate a brand profile as JSON:

Podcast Title: {payload.podcast_title}
Description: {payload.podcast_description or 'Not provided'}
Category: {payload.category or 'Not provided'}

Return a JSON object with these fields:
- "show_name": the brand/show name
- "tagline": a catchy tagline (under 100 chars)
- "personality": description of the show's voice/personality (2-3 sentences)
- "target_audience": who the podcast is for (1-2 sentences)
- "tone_guidelines": {{"do": ["list of tone guidelines"], "dont": ["list of things to avoid"]}}
- "key_themes": ["list", "of", "themes"]
- "vocabulary": ["preferred", "terms", "and", "jargon"]
- "content_rules": brief rules about what to always/never include

Output ONLY valid JSON. No markdown, no code fences."""

    import json
    message = await generator.client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2048,
        system="You are a podcast branding expert. Output only valid JSON.",
        messages=[{"role": "user", "content": prompt}],
    )

    response_text = message.content[0].text.strip()
    if response_text.startswith("```"):
        lines = response_text.split("\n")
        lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        response_text = "\n".join(lines)

    brand_data = json.loads(response_text)
    deduction.commit(db, description=f"AI brand profile for '{payload.podcast_title}'")

    brand = db.query(BrandProfile).filter(BrandProfile.podcast_id == podcast_id).first()
    if not brand:
        brand = BrandProfile(podcast_id=podcast_id)
        db.add(brand)

    for field in ["show_name", "tagline", "personality", "target_audience",
                  "tone_guidelines", "key_themes", "vocabulary", "content_rules"]:
        if field in brand_data:
            setattr(brand, field, brand_data[field])

    db.commit()
    db.refresh(brand)
    return BrandProfileResponse.model_validate(brand)
