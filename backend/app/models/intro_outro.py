from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin


class IntroOutroTemplate(TimestampMixin, Base):
    __tablename__ = "intro_outro_templates"

    podcast_id = Column(
        UUID(as_uuid=True), ForeignKey("podcasts.id"), nullable=False, index=True
    )
    type = Column(String(10), nullable=False)  # "intro" or "outro"
    name = Column(String(255), nullable=False)
    script_template = Column(Text, nullable=False, default="")
    speaker_id = Column(String(50), nullable=True, default="host")
    voice_id = Column(UUID(as_uuid=True), nullable=True)
    music_id = Column(String(100), nullable=True)
    sfx_id = Column(String(100), nullable=True)
    duration_target = Column(Integer, nullable=True)  # seconds
    is_default = Column(Boolean, nullable=False, default=False)

    podcast = relationship("Podcast", backref="intro_outro_templates")
