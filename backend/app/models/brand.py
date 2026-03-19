from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin


class BrandProfile(TimestampMixin, Base):
    __tablename__ = "brand_profiles"

    podcast_id = Column(
        UUID(as_uuid=True), ForeignKey("podcasts.id"), nullable=False, unique=True, index=True
    )
    show_name = Column(String(255), nullable=True)
    tagline = Column(String(500), nullable=True)
    personality = Column(Text, nullable=True)
    target_audience = Column(Text, nullable=True)
    tone_guidelines = Column(JSON, nullable=True, default=dict)  # {"do": [], "dont": []}
    key_themes = Column(JSON, nullable=True, default=list)  # ["tech", "startups"]
    vocabulary = Column(JSON, nullable=True, default=list)  # preferred terms
    content_rules = Column(Text, nullable=True)
    default_voice_assignments = Column(JSON, nullable=True, default=dict)  # {"Host": "voice-uuid"}
    default_music_id = Column(String(100), nullable=True)
    default_sfx_ids = Column(JSON, nullable=True, default=list)
    brand_colors = Column(JSON, nullable=True, default=dict)  # {"primary": "#hex"}

    podcast = relationship("Podcast", backref="brand_profile")
