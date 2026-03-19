import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.config import settings
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.auth import Token, UserCreate, UserLogin, UserResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _is_first_user(db: Session) -> bool:
    """Check if no users exist yet (first user becomes admin)."""
    return db.query(User).count() == 0


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)) -> Token:
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )
    first_user = _is_first_user(db)
    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        name=payload.name,
        is_admin=first_user,
        auth_provider="email",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    access_token = create_access_token(data={"sub": str(user.id)})
    return Token(access_token=access_token)


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)) -> Token:
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )
    access_token = create_access_token(data={"sub": str(user.id)})
    return Token(access_token=access_token)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse.model_validate(current_user)


# ---- OAuth: Google ----

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


@router.get("/google")
def google_login() -> RedirectResponse:
    """Redirect user to Google's OAuth consent screen."""
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Google OAuth not configured")
    callback_url = f"{settings.FRONTEND_URL.rstrip('/')}/api/auth/google/callback"
    # Use backend URL for callback
    callback_url = f"{settings.CORS_ORIGINS[0].replace('3000', '8000') if settings.CORS_ORIGINS else 'http://localhost:8000'}/api/auth/google/callback"
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": callback_url,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account",
    }
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return RedirectResponse(url=f"{GOOGLE_AUTH_URL}?{query}")


@router.get("/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)) -> RedirectResponse:
    """Handle Google OAuth callback: exchange code, fetch user, issue JWT."""
    callback_url = f"{settings.CORS_ORIGINS[0].replace('3000', '8000') if settings.CORS_ORIGINS else 'http://localhost:8000'}/api/auth/google/callback"

    async with httpx.AsyncClient() as client:
        # Exchange code for token
        token_response = await client.post(GOOGLE_TOKEN_URL, data={
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": callback_url,
        })
        if token_response.status_code != 200:
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=google_auth_failed")

        token_data = token_response.json()
        access_token = token_data.get("access_token")

        # Fetch user info
        userinfo_response = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if userinfo_response.status_code != 200:
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=google_profile_failed")

        userinfo = userinfo_response.json()

    email = userinfo.get("email")
    name = userinfo.get("name", email.split("@")[0] if email else "User")
    avatar_url = userinfo.get("picture")
    provider_id = userinfo.get("id")

    if not email:
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=no_email")

    # Find or create user
    user = db.query(User).filter(User.email == email).first()
    first_user = _is_first_user(db)

    if not user:
        user = User(
            email=email,
            name=name,
            avatar_url=avatar_url,
            auth_provider="google",
            provider_id=provider_id,
            is_admin=first_user,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update avatar if we got one from Google
        if avatar_url and not user.avatar_url:
            user.avatar_url = avatar_url
        if not user.provider_id:
            user.provider_id = provider_id
        db.commit()

    jwt_token = create_access_token(data={"sub": str(user.id)})
    return RedirectResponse(url=f"{settings.FRONTEND_URL}/auth/callback?token={jwt_token}")


# ---- OAuth: GitHub ----

GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"
GITHUB_EMAILS_URL = "https://api.github.com/user/emails"


@router.get("/github")
def github_login() -> RedirectResponse:
    """Redirect user to GitHub's OAuth consent screen."""
    if not settings.GITHUB_CLIENT_ID:
        raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="GitHub OAuth not configured")
    callback_url = f"{settings.CORS_ORIGINS[0].replace('3000', '8000') if settings.CORS_ORIGINS else 'http://localhost:8000'}/api/auth/github/callback"
    params = {
        "client_id": settings.GITHUB_CLIENT_ID,
        "redirect_uri": callback_url,
        "scope": "user:email",
    }
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return RedirectResponse(url=f"{GITHUB_AUTH_URL}?{query}")


@router.get("/github/callback")
async def github_callback(code: str, db: Session = Depends(get_db)) -> RedirectResponse:
    """Handle GitHub OAuth callback."""
    callback_url = f"{settings.CORS_ORIGINS[0].replace('3000', '8000') if settings.CORS_ORIGINS else 'http://localhost:8000'}/api/auth/github/callback"

    async with httpx.AsyncClient() as client:
        # Exchange code for token
        token_response = await client.post(
            GITHUB_TOKEN_URL,
            data={
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": callback_url,
            },
            headers={"Accept": "application/json"},
        )
        if token_response.status_code != 200:
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=github_auth_failed")

        token_data = token_response.json()
        access_token = token_data.get("access_token")

        # Fetch user profile
        user_response = await client.get(
            GITHUB_USER_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        github_user = user_response.json()

        # Fetch email (may not be in profile)
        email = github_user.get("email")
        if not email:
            emails_response = await client.get(
                GITHUB_EMAILS_URL,
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if emails_response.status_code == 200:
                emails = emails_response.json()
                primary = next((e for e in emails if e.get("primary")), None)
                if primary:
                    email = primary["email"]

    if not email:
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=no_email")

    name = github_user.get("name") or github_user.get("login", "User")
    avatar_url = github_user.get("avatar_url")
    provider_id = str(github_user.get("id", ""))

    # Find or create user
    user = db.query(User).filter(User.email == email).first()
    first_user = _is_first_user(db)

    if not user:
        user = User(
            email=email,
            name=name,
            avatar_url=avatar_url,
            auth_provider="github",
            provider_id=provider_id,
            is_admin=first_user,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        if avatar_url and not user.avatar_url:
            user.avatar_url = avatar_url
        if not user.provider_id:
            user.provider_id = provider_id
        db.commit()

    jwt_token = create_access_token(data={"sub": str(user.id)})
    return RedirectResponse(url=f"{settings.FRONTEND_URL}/auth/callback?token={jwt_token}")
