"""Credit service — check, deduct, grant, and manage user credits."""

from datetime import date, datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.credit import CreditBalance, CreditTransaction

# Plan tier configurations
PLAN_CONFIG = {
    "free": {"monthly_credits": 50, "daily_cap": 20, "rollover": False},
    "pro": {"monthly_credits": 500, "daily_cap": 100, "rollover": False},
    "enterprise": {"monthly_credits": 2000, "daily_cap": 500, "rollover": True},
}

# Credit costs per operation
OPERATION_COSTS = {
    "script_generate": 10,
    "rewrite_blocks": 5,
    "rewrite_inline": 2,
    "show_notes": 3,
    "seo_metadata": 2,
    "fact_check": 5,
    "suggest_content": 3,
    "translate": 8,
    "auto_summarize": 3,
    "brand_generate": 3,
    "intro_outro_generate": 3,
    "transcript": 2,
}


def get_operation_cost(operation: str) -> int:
    """Get the credit cost for an operation."""
    return OPERATION_COSTS.get(operation, 0)


def initialize_balance(user_id: UUID, plan_tier: str, db: Session) -> CreditBalance:
    """Create initial credit balance for a new user."""
    config = PLAN_CONFIG.get(plan_tier, PLAN_CONFIG["free"])
    now = datetime.now(timezone.utc)

    balance = CreditBalance(
        user_id=user_id,
        monthly_credits=config["monthly_credits"],
        bonus_credits=0,
        used_this_month=0,
        used_today=0,
        period_start=now,
        period_end=now + timedelta(days=30),
        last_daily_reset=now.date(),
    )
    db.add(balance)
    db.commit()
    db.refresh(balance)
    return balance


def get_balance(user_id: UUID, db: Session) -> CreditBalance:
    """Get (or lazy-create) user's credit balance, applying resets as needed."""
    balance = db.query(CreditBalance).filter(CreditBalance.user_id == user_id).first()
    if not balance:
        # Auto-create for existing users who don't have one yet
        from app.models.user import User

        user = db.query(User).filter(User.id == user_id).first()
        plan_tier = user.plan_tier if user else "free"
        balance = initialize_balance(user_id, plan_tier, db)

    now = datetime.now(timezone.utc)
    today = now.date()
    changed = False

    # Daily reset check
    if balance.last_daily_reset < today:
        balance.used_today = 0
        balance.last_daily_reset = today
        changed = True

    # Monthly reset check
    if balance.period_end and now >= balance.period_end:
        from app.models.user import User

        user = db.query(User).filter(User.id == user_id).first()
        config = PLAN_CONFIG.get(user.plan_tier if user else "free", PLAN_CONFIG["free"])

        # Handle rollover for enterprise
        if config["rollover"]:
            rollover = min(balance.monthly_remaining, 1000)
            balance.bonus_credits = min(balance.bonus_credits + rollover, 1000)
        else:
            balance.bonus_credits = max(balance.bonus_credits, 0)  # Keep purchased bonus

        balance.monthly_credits = config["monthly_credits"]
        balance.used_this_month = 0
        balance.period_start = now
        balance.period_end = now + timedelta(days=30)
        changed = True

    if changed:
        db.commit()
        db.refresh(balance)

    return balance


def check_credits(user_id: UUID, cost: int, plan_tier: str, db: Session) -> dict:
    """Check if user has enough credits. Returns status dict."""
    balance = get_balance(user_id, db)
    config = PLAN_CONFIG.get(plan_tier, PLAN_CONFIG["free"])
    daily_cap = config["daily_cap"]
    daily_remaining = max(0, daily_cap - balance.used_today)

    if balance.available_credits < cost:
        return {
            "allowed": False,
            "reason": "insufficient_credits",
            "balance": balance.available_credits,
            "cost": cost,
            "daily_remaining": daily_remaining,
        }

    if balance.used_today + cost > daily_cap:
        return {
            "allowed": False,
            "reason": "daily_cap_exceeded",
            "balance": balance.available_credits,
            "cost": cost,
            "daily_remaining": daily_remaining,
            "daily_cap": daily_cap,
        }

    return {
        "allowed": True,
        "balance": balance.available_credits,
        "cost": cost,
        "daily_remaining": daily_remaining,
    }


def deduct_credits(
    user_id: UUID,
    cost: int,
    operation: str,
    db: Session,
    episode_id: UUID | None = None,
    description: str = "",
) -> CreditTransaction:
    """Deduct credits from user's balance. Call ONLY after successful API operation."""
    balance = get_balance(user_id, db)

    # Deduct from monthly first, then bonus
    monthly_remaining = balance.monthly_remaining
    if monthly_remaining >= cost:
        balance.used_this_month += cost
    else:
        # Use remaining monthly + take rest from bonus
        balance.used_this_month += monthly_remaining
        balance.bonus_credits -= cost - monthly_remaining

    balance.used_today += cost

    # Create transaction record
    transaction = CreditTransaction(
        user_id=user_id,
        amount=-cost,
        balance_after=balance.available_credits,
        operation=operation,
        episode_id=episode_id,
        description=description or f"Used {cost} credits for {operation}",
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


def grant_credits(
    user_id: UUID,
    amount: int,
    reason: str,
    db: Session,
) -> CreditTransaction:
    """Grant bonus credits to a user (admin action or purchase)."""
    balance = get_balance(user_id, db)
    balance.bonus_credits += amount

    transaction = CreditTransaction(
        user_id=user_id,
        amount=amount,
        balance_after=balance.available_credits,
        operation="credit_grant",
        description=reason,
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


def update_plan_credits(user_id: UUID, new_plan: str, db: Session) -> CreditBalance:
    """Update credit allocation when user changes plan."""
    balance = get_balance(user_id, db)
    config = PLAN_CONFIG.get(new_plan, PLAN_CONFIG["free"])

    balance.monthly_credits = config["monthly_credits"]
    # Reset usage on plan change to give full allocation immediately
    balance.used_this_month = 0
    now = datetime.now(timezone.utc)
    balance.period_start = now
    balance.period_end = now + timedelta(days=30)

    db.commit()
    db.refresh(balance)
    return balance


def get_transactions(
    user_id: UUID,
    db: Session,
    page: int = 1,
    page_size: int = 20,
) -> list[CreditTransaction]:
    """Get paginated transaction history for a user."""
    return (
        db.query(CreditTransaction)
        .filter(CreditTransaction.user_id == user_id)
        .order_by(CreditTransaction.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
