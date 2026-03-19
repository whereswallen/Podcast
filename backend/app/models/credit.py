"""Credit system models for tracking user credit balances and transactions."""

from datetime import date

from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin


class CreditBalance(TimestampMixin, Base):
    """1:1 per User — tracks current credit balance and usage."""

    __tablename__ = "credit_balances"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False, index=True)
    monthly_credits = Column(Integer, nullable=False, default=50)  # Allocated per plan
    bonus_credits = Column(Integer, nullable=False, default=0)  # Admin-granted or purchased
    used_this_month = Column(Integer, nullable=False, default=0)  # Resets on billing cycle
    used_today = Column(Integer, nullable=False, default=0)  # Resets daily at midnight UTC
    period_start = Column(DateTime(timezone=True), nullable=False)
    period_end = Column(DateTime(timezone=True), nullable=False)
    last_daily_reset = Column(Date, nullable=False)

    user = relationship("User", backref="credit_balance", uselist=False)

    @property
    def available_credits(self) -> int:
        """Total credits available to spend right now."""
        remaining_monthly = max(0, self.monthly_credits - self.used_this_month)
        return remaining_monthly + self.bonus_credits

    @property
    def monthly_remaining(self) -> int:
        return max(0, self.monthly_credits - self.used_this_month)


class CreditTransaction(TimestampMixin, Base):
    """Audit log of every credit change — spend, grant, refund, reset."""

    __tablename__ = "credit_transactions"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    amount = Column(Integer, nullable=False)  # Negative = spent, positive = granted/refunded
    balance_after = Column(Integer, nullable=False)  # Snapshot for auditability
    operation = Column(String(50), nullable=False)  # "script_generate", "rewrite_blocks", etc.
    episode_id = Column(UUID(as_uuid=True), ForeignKey("episodes.id"), nullable=True)
    description = Column(String(255), nullable=False)

    user = relationship("User", backref="credit_transactions")
