"""Credit balance and transaction API routes."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_admin_user, get_current_user, get_db
from app.models.user import User
from app.services import credit_service

router = APIRouter(prefix="/api/credits", tags=["credits"])


# ---- Schemas ----

class CreditBalanceResponse(BaseModel):
    available_credits: int
    monthly_credits: int
    monthly_remaining: int
    bonus_credits: int
    used_this_month: int
    used_today: int
    daily_cap: int
    period_start: str
    period_end: str
    plan_tier: str


class CreditTransactionResponse(BaseModel):
    id: UUID
    amount: int
    balance_after: int
    operation: str
    episode_id: Optional[UUID] = None
    description: str
    created_at: str

    model_config = {"from_attributes": True}


class OperationCostResponse(BaseModel):
    operation: str
    cost: int


class GrantCreditsRequest(BaseModel):
    amount: int
    reason: str = "Admin credit grant"


# ---- Endpoints ----

@router.get("/balance", response_model=CreditBalanceResponse)
def get_balance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CreditBalanceResponse:
    """Get current credit balance and usage stats."""
    balance = credit_service.get_balance(current_user.id, db)
    config = credit_service.PLAN_CONFIG.get(current_user.plan_tier, credit_service.PLAN_CONFIG["free"])

    return CreditBalanceResponse(
        available_credits=balance.available_credits,
        monthly_credits=balance.monthly_credits,
        monthly_remaining=balance.monthly_remaining,
        bonus_credits=balance.bonus_credits,
        used_this_month=balance.used_this_month,
        used_today=balance.used_today,
        daily_cap=config["daily_cap"],
        period_start=balance.period_start.isoformat(),
        period_end=balance.period_end.isoformat(),
        plan_tier=current_user.plan_tier,
    )


@router.get("/transactions", response_model=list[CreditTransactionResponse])
def get_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[CreditTransactionResponse]:
    """Get paginated credit transaction history."""
    transactions = credit_service.get_transactions(current_user.id, db, page, page_size)
    return [
        CreditTransactionResponse(
            id=t.id,
            amount=t.amount,
            balance_after=t.balance_after,
            operation=t.operation,
            episode_id=t.episode_id,
            description=t.description,
            created_at=t.created_at.isoformat(),
        )
        for t in transactions
    ]


@router.get("/cost/{operation}", response_model=OperationCostResponse)
def get_operation_cost(
    operation: str,
    current_user: User = Depends(get_current_user),
) -> OperationCostResponse:
    """Preview the credit cost for a specific operation."""
    cost = credit_service.get_operation_cost(operation)
    return OperationCostResponse(operation=operation, cost=cost)


@router.get("/costs", response_model=list[OperationCostResponse])
def get_all_costs(
    current_user: User = Depends(get_current_user),
) -> list[OperationCostResponse]:
    """Get credit costs for all operations."""
    return [
        OperationCostResponse(operation=op, cost=cost)
        for op, cost in credit_service.OPERATION_COSTS.items()
    ]


# ---- Admin endpoints ----

@router.post("/admin/{user_id}/grant", status_code=status.HTTP_201_CREATED)
def admin_grant_credits(
    user_id: UUID,
    payload: GrantCreditsRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
) -> dict:
    """Admin: grant bonus credits to a user."""
    transaction = credit_service.grant_credits(user_id, payload.amount, payload.reason, db)
    balance = credit_service.get_balance(user_id, db)
    return {
        "status": "granted",
        "amount": payload.amount,
        "new_balance": balance.available_credits,
        "transaction_id": str(transaction.id),
    }
