"""Admin panel API routes.

All routes require admin authentication via get_admin_user dependency.
"""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_admin_user, get_db
from app.models.episode import Episode
from app.models.podcast import Podcast
from app.models.user import User

router = APIRouter(prefix="/api/admin", tags=["admin"])


# ---- Schemas ----

class PlatformStats(BaseModel):
    total_users: int
    active_users: int
    total_podcasts: int
    total_episodes: int
    admin_count: int
    provider_breakdown: dict  # {"email": N, "google": N, "github": N}
    plan_breakdown: dict  # {"free": N, "pro": N, "enterprise": N}


class AdminUserResponse(BaseModel):
    id: UUID
    email: str
    name: str
    avatar_url: Optional[str] = None
    plan_tier: str
    is_active: bool
    is_admin: bool
    auth_provider: str
    podcast_count: int = 0
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}


class AdminUserUpdate(BaseModel):
    plan_tier: Optional[str] = None
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None


class AdminPodcastResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    user_email: str
    user_name: str
    episode_count: int
    is_active: bool
    created_at: str

    model_config = {"from_attributes": True}


class AdminEpisodeResponse(BaseModel):
    id: UUID
    title: str
    podcast_title: str
    user_email: str
    status: str
    format: str
    created_at: str

    model_config = {"from_attributes": True}


# ---- Endpoints ----

@router.get("/stats", response_model=PlatformStats)
def get_platform_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
) -> PlatformStats:
    """Get platform-wide statistics."""
    total_users = db.query(func.count(User.id)).scalar() or 0
    active_users = db.query(func.count(User.id)).filter(User.is_active.is_(True)).scalar() or 0
    total_podcasts = db.query(func.count(Podcast.id)).filter(Podcast.is_active.is_(True)).scalar() or 0
    total_episodes = db.query(func.count(Episode.id)).scalar() or 0
    admin_count = db.query(func.count(User.id)).filter(User.is_admin.is_(True)).scalar() or 0

    # Provider breakdown
    provider_counts = (
        db.query(User.auth_provider, func.count(User.id))
        .group_by(User.auth_provider)
        .all()
    )
    provider_breakdown = {provider: count for provider, count in provider_counts}

    # Plan breakdown
    plan_counts = (
        db.query(User.plan_tier, func.count(User.id))
        .group_by(User.plan_tier)
        .all()
    )
    plan_breakdown = {plan: count for plan, count in plan_counts}

    return PlatformStats(
        total_users=total_users,
        active_users=active_users,
        total_podcasts=total_podcasts,
        total_episodes=total_episodes,
        admin_count=admin_count,
        provider_breakdown=provider_breakdown,
        plan_breakdown=plan_breakdown,
    )


@router.get("/users", response_model=list[AdminUserResponse])
def list_users(
    search: Optional[str] = Query(None),
    plan_tier: Optional[str] = Query(None),
    provider: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
) -> list[AdminUserResponse]:
    """List all users with filtering and pagination."""
    query = db.query(User)

    if search:
        pattern = f"%{search}%"
        query = query.filter(
            (User.name.ilike(pattern)) | (User.email.ilike(pattern))
        )
    if plan_tier:
        query = query.filter(User.plan_tier == plan_tier)
    if provider:
        query = query.filter(User.auth_provider == provider)

    users = (
        query.order_by(User.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    result = []
    for user in users:
        podcast_count = len([p for p in user.podcasts if p.is_active]) if user.podcasts else 0
        result.append(AdminUserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            avatar_url=user.avatar_url,
            plan_tier=user.plan_tier,
            is_active=user.is_active,
            is_admin=user.is_admin,
            auth_provider=user.auth_provider,
            podcast_count=podcast_count,
            created_at=user.created_at.isoformat(),
            updated_at=user.updated_at.isoformat(),
        ))
    return result


@router.get("/users/{user_id}", response_model=AdminUserResponse)
def get_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
) -> AdminUserResponse:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    podcast_count = len([p for p in user.podcasts if p.is_active]) if user.podcasts else 0
    return AdminUserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        avatar_url=user.avatar_url,
        plan_tier=user.plan_tier,
        is_active=user.is_active,
        is_admin=user.is_admin,
        auth_provider=user.auth_provider,
        podcast_count=podcast_count,
        created_at=user.created_at.isoformat(),
        updated_at=user.updated_at.isoformat(),
    )


@router.put("/users/{user_id}", response_model=AdminUserResponse)
def update_user(
    user_id: UUID,
    payload: AdminUserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
) -> AdminUserResponse:
    """Update user plan, status, or admin role."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    podcast_count = len([p for p in user.podcasts if p.is_active]) if user.podcasts else 0
    return AdminUserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        avatar_url=user.avatar_url,
        plan_tier=user.plan_tier,
        is_active=user.is_active,
        is_admin=user.is_admin,
        auth_provider=user.auth_provider,
        podcast_count=podcast_count,
        created_at=user.created_at.isoformat(),
        updated_at=user.updated_at.isoformat(),
    )


@router.get("/content/podcasts", response_model=list[AdminPodcastResponse])
def list_all_podcasts(
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
) -> list[AdminPodcastResponse]:
    """List all podcasts across all users."""
    query = db.query(Podcast)
    if search:
        query = query.filter(Podcast.title.ilike(f"%{search}%"))

    podcasts = (
        query.order_by(Podcast.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    result = []
    for podcast in podcasts:
        user = db.query(User).filter(User.id == podcast.user_id).first()
        episode_count = len([e for e in podcast.episodes if e.status != "deleted"]) if podcast.episodes else 0
        result.append(AdminPodcastResponse(
            id=podcast.id,
            title=podcast.title,
            description=podcast.description,
            category=podcast.category,
            user_email=user.email if user else "Unknown",
            user_name=user.name if user else "Unknown",
            episode_count=episode_count,
            is_active=podcast.is_active,
            created_at=podcast.created_at.isoformat(),
        ))
    return result


@router.get("/content/episodes", response_model=list[AdminEpisodeResponse])
def list_all_episodes(
    search: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
) -> list[AdminEpisodeResponse]:
    """List all episodes across all users."""
    query = db.query(Episode)
    if search:
        query = query.filter(Episode.title.ilike(f"%{search}%"))
    if status_filter:
        query = query.filter(Episode.status == status_filter)

    episodes = (
        query.order_by(Episode.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    result = []
    for ep in episodes:
        podcast = db.query(Podcast).filter(Podcast.id == ep.podcast_id).first()
        user = db.query(User).filter(User.id == podcast.user_id).first() if podcast else None
        result.append(AdminEpisodeResponse(
            id=ep.id,
            title=ep.title,
            podcast_title=podcast.title if podcast else "Unknown",
            user_email=user.email if user else "Unknown",
            status=ep.status,
            format=ep.format,
            created_at=ep.created_at.isoformat(),
        ))
    return result
