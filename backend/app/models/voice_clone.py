from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin


class VoiceCloneJob(TimestampMixin, Base):
    __tablename__ = "voice_clone_jobs"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    voice_profile_id = Column(
        UUID(as_uuid=True), ForeignKey("voice_profiles.id"), nullable=True, index=True
    )
    name = Column(String(100), nullable=False)
    status = Column(String(20), nullable=False, default="pending")
    # Status flow: pending -> uploading -> processing -> training -> ready -> failed
    sample_urls = Column(JSON, nullable=False, default=list)  # List of uploaded audio file paths
    total_duration_seconds = Column(Integer, nullable=False, default=0)  # Total sample audio duration
    training_config = Column(JSON, nullable=True, default=dict)  # Training parameters
    error_message = Column(Text, nullable=True)
    progress = Column(Integer, nullable=False, default=0)  # 0-100

    # Consent verification
    consent_given = Column(Boolean, nullable=False, default=False)
    consent_name = Column(String(255), nullable=True)  # Name of the person whose voice is being cloned
    consent_email = Column(String(255), nullable=True)  # Email for consent record
    consent_statement = Column(Text, nullable=True)  # Consent statement text
    consent_given_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", backref="voice_clone_jobs")
    voice_profile = relationship("VoiceProfile", backref="clone_job")
