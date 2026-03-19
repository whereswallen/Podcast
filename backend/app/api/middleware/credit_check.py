"""Credit check dependency for FastAPI routes.

Usage in routes:
    @router.post("/generate")
    async def generate_script(
        deduction: CreditDeduction = Depends(require_credits(10, "script_generate")),
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        result = await some_ai_call(...)
        deduction.commit(db)  # Only deducts if we get here (success)
        return result
"""

from typing import Callable
from uuid import UUID

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.services.credit_service import check_credits, deduct_credits, get_operation_cost


class CreditDeduction:
    """Holds a pending credit deduction. Call .commit() after successful operation."""

    def __init__(
        self,
        user_id: UUID,
        cost: int,
        operation: str,
        balance: int,
        episode_id: UUID | None = None,
    ):
        self.user_id = user_id
        self.cost = cost
        self.operation = operation
        self.balance = balance
        self.episode_id = episode_id
        self._committed = False

    def commit(self, db: Session, description: str = "", episode_id: UUID | None = None) -> dict:
        """Commit the deduction after successful API call."""
        if self._committed:
            return {"already_committed": True}
        self._committed = True
        ep_id = episode_id or self.episode_id
        transaction = deduct_credits(
            user_id=self.user_id,
            cost=self.cost,
            operation=self.operation,
            db=db,
            episode_id=ep_id,
            description=description,
        )
        return {
            "credits_used": self.cost,
            "balance_after": transaction.balance_after,
        }


def require_credits(cost: int, operation: str) -> Callable:
    """FastAPI dependency factory that checks if user has enough credits.

    Raises HTTP 402 if insufficient credits or daily cap exceeded.
    Returns a CreditDeduction object that must be committed on success.
    """

    def dependency(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> CreditDeduction:
        result = check_credits(current_user.id, cost, current_user.plan_tier, db)

        if not result["allowed"]:
            if result["reason"] == "insufficient_credits":
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail={
                        "error": "insufficient_credits",
                        "message": f"This operation requires {cost} credits. You have {result['balance']} remaining.",
                        "cost": cost,
                        "balance": result["balance"],
                    },
                )
            elif result["reason"] == "daily_cap_exceeded":
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail={
                        "error": "daily_cap_exceeded",
                        "message": f"Daily credit limit reached. You have {result['daily_remaining']} credits remaining today.",
                        "cost": cost,
                        "daily_remaining": result["daily_remaining"],
                        "daily_cap": result.get("daily_cap", 0),
                    },
                )

        return CreditDeduction(
            user_id=current_user.id,
            cost=cost,
            operation=operation,
            balance=result["balance"],
        )

    return dependency
