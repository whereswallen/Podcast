from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin


class Episode(TimestampMixin, Base):
    __tablename__ = "episodes"

    podcast_id = Column(UUID(as_uuid=True), ForeignKey("podcasts.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(String(5000), nullable=True)
    status = Column(
        String(20), nullable=False, default="draft"
    )  # draft/script/recording/editing/published
    format = Column(
        String(20), nullable=False, default="solo"
    )  # solo/conversation/interview/panel/narrative
    target_duration = Column(Integer, nullable=True)  # seconds
    audio_url = Column(String(512), nullable=True)
    published_at = Column(DateTime(timezone=True), nullable=True)

    podcast = relationship("Podcast", back_populates="episodes")
    script = relationship("Script", back_populates="episode", uselist=False, lazy="selectin")
