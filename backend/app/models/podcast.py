from sqlalchemy import Boolean, Column, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin


class Podcast(TimestampMixin, Base):
    __tablename__ = "podcasts"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(String(2000), nullable=True)
    artwork_url = Column(String(512), nullable=True)
    category = Column(String(100), nullable=True)
    language = Column(String(10), nullable=False, default="en")
    is_active = Column(Boolean, default=True, nullable=False)

    user = relationship("User", back_populates="podcasts")
    episodes = relationship("Episode", back_populates="podcast", lazy="selectin")
