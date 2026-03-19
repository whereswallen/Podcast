from sqlalchemy import Boolean, Column, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin


class VoiceProfile(TimestampMixin, Base):
    __tablename__ = "voice_profiles"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    engine = Column(String(20), nullable=False, default="builtin")  # builtin/cloned/external
    model_id = Column(String(255), nullable=True)
    settings = Column(
        JSON, nullable=False, default=dict
    )  # speed, pitch, emotion, style
    sample_url = Column(String(512), nullable=True)
    sample_urls = Column(JSON, nullable=True, default=list)  # Multiple sample URLs for cloned voices
    clone_status = Column(String(20), nullable=True)  # null for builtin, pending/training/ready/failed for cloned
    is_active = Column(Boolean, default=True, nullable=False)

    user = relationship("User", back_populates="voice_profiles")
