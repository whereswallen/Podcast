from sqlalchemy import Boolean, Column, String
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin


class User(TimestampMixin, Base):
    __tablename__ = "users"

    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    avatar_url = Column(String(512), nullable=True)
    plan_tier = Column(String(20), nullable=False, default="free")  # free/pro/enterprise
    is_active = Column(Boolean, default=True, nullable=False)

    podcasts = relationship("Podcast", back_populates="user", lazy="selectin")
    voice_profiles = relationship("VoiceProfile", back_populates="user", lazy="selectin")
