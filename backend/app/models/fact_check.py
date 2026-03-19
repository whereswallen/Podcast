"""Persisted fact-check results for episode scripts.

Stores AI-generated fact-check flags with severity, confidence,
sources, and resolution tracking to enforce publish gates.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin


class FactCheckResult(TimestampMixin, Base):
    __tablename__ = "fact_check_results"

    episode_id = Column(UUID(as_uuid=True), ForeignKey("episodes.id"), nullable=False, index=True)
    block_id = Column(String(100), nullable=True)
    claim = Column(Text, nullable=False)
    severity = Column(String(10), nullable=False)  # high / medium / low
    confidence = Column(Float, nullable=False, default=0.0)  # 0.0–1.0 AI self-reported certainty
    suggestion = Column(Text, nullable=False)
    sources = Column(JSON, nullable=False, default=list)  # suggested verification URLs
    context = Column(Text, nullable=True)
    domain = Column(String(30), nullable=True)  # legal / medical / financial / general

    # Resolution tracking
    resolved = Column(Boolean, nullable=False, default=False)
    resolved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    resolution_note = Column(Text, nullable=True)

    episode = relationship("Episode", backref="fact_check_results")
