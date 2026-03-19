import uuid
from sqlalchemy import Column, String, ForeignKey, JSON, Integer, Float, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin


class AudioProject(TimestampMixin, Base):
    __tablename__ = "audio_projects"

    episode_id = Column(UUID(as_uuid=True), ForeignKey("episodes.id"), unique=True, nullable=False)
    tracks = Column(JSON, default=list)  # List of track objects
    # Track object: {id, type: "speech"|"music"|"sfx", name, segments: [...], volume, pan, muted, solo}
    # Segment object: {id, start_ms, end_ms, source_url, trim_start_ms, trim_end_ms, fade_in_ms, fade_out_ms, volume_db}
    master_volume = Column(Float, default=0.0)
    sample_rate = Column(Integer, default=44100)
    duration_ms = Column(Integer, default=0)

    episode = relationship("Episode", backref="audio_project")
