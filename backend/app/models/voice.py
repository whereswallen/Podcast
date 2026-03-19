from sqlalchemy import Boolean, Column, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin


class VoiceProfile(TimestampMixin, Base):
    __tablename__ = "voice_profiles"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    name = Column(String(100), nullable=False)
    engine = Column(String(20), nullable=False, default="builtin")  # builtin/cloned/external
    model_id = Column(String(255), nullable=True)
    settings = Column(
        JSON, nullable=False, default=dict
    )  # speed, pitch, emotion, style
    sample_url = Column(String(512), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    user = relationship("User", back_populates="voice_profiles")
