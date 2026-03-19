"""Stripe billing routes — subscriptions, credit packs, webhooks, customer portal."""

import logging
from typing import Optional

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.config import settings
from app.models.user import User
from app.services.credit_service import grant_credits, update_plan_credits

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/billing", tags=["billing"])

# Configure Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

# Plan price mapping
PLAN_PRICES = {
    "pro": settings.STRIPE_PRO_PRICE_ID,
    "enterprise": settings.STRIPE_ENTERPRISE_PRICE_ID,
}

CREDIT_PACK_PRICES = {
    "credits_100_pro": settings.STRIPE_CREDITS_100_PRO_PRICE_ID,
    "credits_100_ent": settings.STRIPE_CREDITS_100_ENT_PRICE_ID,
}


# ---- Schemas ----

class CheckoutRequest(BaseModel):
    plan: str  # "pro" or "enterprise"


class CreditPackRequest(BaseModel):
    pack: str  # "credits_100"


class PlanInfo(BaseModel):
    name: str
    price: str
    monthly_credits: int
    features: list[str]
    stripe_price_id: str


class SubscriptionResponse(BaseModel):
    plan_tier: str
    stripe_subscription_id: Optional[str] = None
    stripe_customer_id: Optional[str] = None
    status: str = "active"


# ---- Helpers ----

def _get_or_create_stripe_customer(user: User, db: Session) -> str:
    """Get existing or create new Stripe customer for user."""
    if user.stripe_customer_id:
        return user.stripe_customer_id

    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Stripe is not configured",
        )

    customer = stripe.Customer.create(
        email=user.email,
        name=user.name,
        metadata={"user_id": str(user.id)},
    )
    user.stripe_customer_id = customer.id
    db.commit()
    return customer.id


# ---- Endpoints ----

@router.get("/plans", response_model=list[PlanInfo])
def get_plans(
    current_user: User = Depends(get_current_user),
) -> list[PlanInfo]:
    """Return available subscription plans."""
    return [
        PlanInfo(
            name="Free",
            price="$0/month",
            monthly_credits=50,
            features=[
                "50 credits/month",
                "2 podcasts",
                "5 episodes per podcast",
                "Basic TTS voices",
            ],
            stripe_price_id="",
        ),
        PlanInfo(
            name="Pro",
            price="$19/month",
            monthly_credits=500,
            features=[
                "500 credits/month",
                "10 podcasts",
                "50 episodes per podcast",
                "Voice cloning",
                "Buy extra credit packs",
                "Priority support",
            ],
            stripe_price_id=settings.STRIPE_PRO_PRICE_ID,
        ),
        PlanInfo(
            name="Enterprise",
            price="$49/month",
            monthly_credits=2000,
            features=[
                "2,000 credits/month",
                "Unlimited podcasts",
                "Unlimited episodes",
                "Voice cloning",
                "Credit rollover (up to 1,000)",
                "Priority rendering",
                "Buy credit packs at discount",
                "Dedicated support",
            ],
            stripe_price_id=settings.STRIPE_ENTERPRISE_PRICE_ID,
        ),
    ]


@router.post("/checkout/subscription")
def create_subscription_checkout(
    payload: CheckoutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Create a Stripe Checkout session for plan subscription."""
    if payload.plan not in PLAN_PRICES:
        raise HTTPException(status_code=400, detail=f"Invalid plan: {payload.plan}")

    price_id = PLAN_PRICES[payload.plan]
    if not price_id:
        raise HTTPException(status_code=501, detail="Stripe price not configured for this plan")

    customer_id = _get_or_create_stripe_customer(current_user, db)

    session = stripe.checkout.Session.create(
        customer=customer_id,
        mode="subscription",
        line_items=[{"price": price_id, "quantity": 1}],
        success_url=f"{settings.FRONTEND_URL}/settings/billing?success=true",
        cancel_url=f"{settings.FRONTEND_URL}/settings/billing?cancelled=true",
        metadata={
            "user_id": str(current_user.id),
            "plan": payload.plan,
        },
    )

    return {"checkout_url": session.url}


@router.post("/checkout/credits")
def create_credit_pack_checkout(
    payload: CreditPackRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Create a Stripe Checkout session for credit pack purchase."""
    if current_user.plan_tier == "free":
        raise HTTPException(
            status_code=403,
            detail="Credit packs are only available to Pro and Enterprise users. Please upgrade your plan first.",
        )

    # Select price based on user's plan
    if current_user.plan_tier == "enterprise":
        price_id = CREDIT_PACK_PRICES.get("credits_100_ent")
    else:
        price_id = CREDIT_PACK_PRICES.get("credits_100_pro")

    if not price_id:
        raise HTTPException(status_code=501, detail="Stripe price not configured for credit packs")

    customer_id = _get_or_create_stripe_customer(current_user, db)

    session = stripe.checkout.Session.create(
        customer=customer_id,
        mode="payment",
        line_items=[{"price": price_id, "quantity": 1}],
        success_url=f"{settings.FRONTEND_URL}/settings/billing?credits_purchased=true",
        cancel_url=f"{settings.FRONTEND_URL}/settings/billing?cancelled=true",
        metadata={
            "user_id": str(current_user.id),
            "type": "credit_pack",
            "credits": "100",
        },
    )

    return {"checkout_url": session.url}


@router.get("/portal")
def create_portal_session(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Create a Stripe Customer Portal session for managing subscription."""
    if not current_user.stripe_customer_id:
        raise HTTPException(status_code=400, detail="No active subscription to manage")

    session = stripe.billing_portal.Session.create(
        customer=current_user.stripe_customer_id,
        return_url=f"{settings.FRONTEND_URL}/settings/billing",
    )

    return {"portal_url": session.url}


@router.get("/subscription", response_model=SubscriptionResponse)
def get_subscription(
    current_user: User = Depends(get_current_user),
) -> SubscriptionResponse:
    """Get current subscription status."""
    return SubscriptionResponse(
        plan_tier=current_user.plan_tier,
        stripe_subscription_id=current_user.stripe_subscription_id,
        stripe_customer_id=current_user.stripe_customer_id,
    )


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)) -> dict:
    """Handle Stripe webhook events. No auth — verified by webhook signature."""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    if not settings.STRIPE_WEBHOOK_SECRET:
        logger.warning("Stripe webhook secret not configured, skipping verification")
        event = stripe.Event.construct_from(
            stripe.util.convert_to_stripe_object(await request.json()),
            stripe.api_key,
        )
    else:
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError:
            raise HTTPException(status_code=400, detail="Invalid signature")

    event_type = event["type"]
    data = event["data"]["object"]

    if event_type == "checkout.session.completed":
        _handle_checkout_completed(data, db)
    elif event_type == "customer.subscription.updated":
        _handle_subscription_updated(data, db)
    elif event_type == "customer.subscription.deleted":
        _handle_subscription_deleted(data, db)
    elif event_type == "invoice.payment_failed":
        _handle_payment_failed(data, db)
    else:
        logger.info(f"Unhandled Stripe event: {event_type}")

    return {"status": "ok"}


# ---- Webhook handlers ----

def _handle_checkout_completed(data: dict, db: Session) -> None:
    """Process completed checkout — activate subscription or grant credits."""
    metadata = data.get("metadata", {})
    user_id = metadata.get("user_id")
    if not user_id:
        logger.warning("Checkout completed without user_id in metadata")
        return

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        logger.warning(f"User {user_id} not found for checkout completion")
        return

    if metadata.get("type") == "credit_pack":
        # Credit pack purchase
        credits = int(metadata.get("credits", 100))
        grant_credits(user.id, credits, f"Purchased {credits} credit pack", db)
        logger.info(f"Granted {credits} credits to user {user_id}")
    else:
        # Subscription purchase
        plan = metadata.get("plan", "pro")
        subscription_id = data.get("subscription")

        user.plan_tier = plan
        user.stripe_subscription_id = subscription_id
        if not user.stripe_customer_id:
            user.stripe_customer_id = data.get("customer")
        db.commit()

        # Update credit allocation for new plan
        update_plan_credits(user.id, plan, db)
        logger.info(f"Upgraded user {user_id} to {plan} plan")


def _handle_subscription_updated(data: dict, db: Session) -> None:
    """Handle subscription plan changes (upgrade/downgrade)."""
    customer_id = data.get("customer")
    user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
    if not user:
        return

    # Check the price to determine plan
    items = data.get("items", {}).get("data", [])
    if items:
        price_id = items[0].get("price", {}).get("id")
        new_plan = None
        for plan_name, plan_price_id in PLAN_PRICES.items():
            if plan_price_id == price_id:
                new_plan = plan_name
                break

        if new_plan and new_plan != user.plan_tier:
            user.plan_tier = new_plan
            db.commit()
            update_plan_credits(user.id, new_plan, db)
            logger.info(f"User {user.id} plan changed to {new_plan}")


def _handle_subscription_deleted(data: dict, db: Session) -> None:
    """Handle subscription cancellation — downgrade to free."""
    customer_id = data.get("customer")
    user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
    if not user:
        return

    user.plan_tier = "free"
    user.stripe_subscription_id = None
    db.commit()

    update_plan_credits(user.id, "free", db)
    logger.info(f"User {user.id} downgraded to free (subscription cancelled)")


def _handle_payment_failed(data: dict, db: Session) -> None:
    """Handle failed payment — log warning."""
    customer_id = data.get("customer")
    user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
    if not user:
        return
    logger.warning(f"Payment failed for user {user.id} ({user.email})")
