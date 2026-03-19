from sqlalchemy import Boolean, Column, String
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin


class User(TimestampMixin, Base):
    __tablename__ = "users"

    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=True)  # Nullable for OAuth users
    name = Column(String(255), nullable=False)
    avatar_url = Column(String(512), nullable=True)
    plan_tier = Column(String(20), nullable=False, default="free")  # free/pro/enterprise
    is_active = Column(Boolean, default=True, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    auth_provider = Column(String(20), nullable=False, default="email")  # email/google/github
    provider_id = Column(String(255), nullable=True)  # OAuth provider's user ID
    stripe_customer_id = Column(String(255), nullable=True)  # Stripe customer ID
    stripe_subscription_id = Column(String(255), nullable=True)  # Active subscription ID

    podcasts = relationship("Podcast", back_populates="user", lazy="selectin")
    voice_profiles = relationship("VoiceProfile", back_populates="user", lazy="selectin")
