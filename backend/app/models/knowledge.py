from sqlalchemy import Boolean, Column, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin


class KnowledgeEntry(TimestampMixin, Base):
    __tablename__ = "knowledge_entries"

    podcast_id = Column(
        UUID(as_uuid=True), ForeignKey("podcasts.id"), nullable=False, index=True
    )
    episode_id = Column(
        UUID(as_uuid=True), ForeignKey("episodes.id"), nullable=True, index=True
    )
    entry_type = Column(String(30), nullable=False)
    # Types: episode_summary, topic, guest, segment_template,
    #        source_material, key_fact, note, business_context
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=True)
    tags = Column(JSON, nullable=True, default=list)
    metadata_ = Column("metadata", JSON, nullable=True, default=dict)
    revisit = Column(String(20), nullable=False, default="never")
    # "never" = fully covered, don't repeat
    # "brief" = can touch on quickly if relevant
    # "recurring" = core theme, weave in naturally
    is_active = Column(Boolean, nullable=False, default=True)

    podcast = relationship("Podcast", backref="knowledge_entries")
    episode = relationship("Episode", backref="knowledge_entries")
