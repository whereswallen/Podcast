from sqlalchemy import Column, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin


class Script(TimestampMixin, Base):
    __tablename__ = "scripts"

    episode_id = Column(
        UUID(as_uuid=True), ForeignKey("episodes.id"), nullable=False, unique=True, index=True
    )
    version = Column(Integer, nullable=False, default=1)
    content = Column(JSON, nullable=False, default=list)  # list of ScriptBlock dicts
    word_count = Column(Integer, nullable=False, default=0)
    estimated_duration = Column(Integer, nullable=False, default=0)  # seconds

    episode = relationship("Episode", back_populates="script")
    revisions = relationship(
        "ScriptRevision", back_populates="script", lazy="selectin", order_by="ScriptRevision.version"
    )


class ScriptRevision(TimestampMixin, Base):
    __tablename__ = "script_revisions"

    script_id = Column(UUID(as_uuid=True), ForeignKey("scripts.id"), nullable=False, index=True)
    version = Column(Integer, nullable=False)
    content = Column(JSON, nullable=False, default=list)

    script = relationship("Script", back_populates="revisions")
