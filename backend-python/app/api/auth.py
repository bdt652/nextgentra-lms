"""Teacher authentication API endpoints."""

from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.auth import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    get_password_hash,
    verify_password,
)
from app.core.database import get_prisma, settings
from app.dependencies.auth import CurrentUser, get_current_teacher
from app.schemas.auth import LogoutRequest, RefreshTokenRequest
from app.schemas.student import TokenResponse
from app.schemas.teacher import TeacherCreate, TeacherLogin, TeacherResponse
from prisma import Prisma

router = APIRouter(prefix="/auth/teacher", tags=["teacher-auth"])


@router.post("/register", response_model=TeacherResponse, status_code=status.HTTP_201_CREATED)
async def register_teacher(
    data: TeacherCreate, prisma: Annotated[Prisma, Depends(get_prisma)]
) -> TeacherResponse:
    """Register a new teacher account."""
    existing = await prisma.teacher.find_unique(where={"email": data.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered"
        )

    # Look up role by name
    role = await prisma.role.find_unique(where={"name": data.role})
    if not role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=f"Role '{data.role}' does not exist"
        )

    teacher = await prisma.teacher.create(
        data={
            "email": data.email,
            "name": data.name,
            "role": {"connect": {"id": role.id}},
            "hashed_password": get_password_hash(data.password),
        }
    )

    return TeacherResponse(
        id=teacher.id,
        email=teacher.email,
        name=teacher.name,
        created_at=teacher.created_at,
        is_active=teacher.is_active,
        role=role.name,
    )


@router.post("/login", response_model=TokenResponse)
async def login_teacher(
    credentials: TeacherLogin, prisma: Annotated[Prisma, Depends(get_prisma)]
) -> TokenResponse:
    """Authenticate teacher and return access + refresh tokens."""
    teacher = await prisma.teacher.find_unique(
        where={"email": credentials.email}, include={"role": True}
    )
    if not teacher or not verify_password(credentials.password, teacher.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not teacher.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account deactivated")

    access_token = create_access_token(data={"sub": teacher.email, "type": "teacher"})
    refresh_token = create_refresh_token(data={"sub": teacher.email, "type": "teacher"})

    # Store refresh token in database
    await prisma.refreshtoken.create(
        data={
            "user_type": "TEACHER",
            "user_id": teacher.id,
            "token": refresh_token,
            "expires_at": datetime.now(timezone.utc)
            + timedelta(days=settings.refresh_token_expire_days),
        }
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        refresh_token=refresh_token,
    )


@router.get("/me", response_model=TeacherResponse)
async def get_current_teacher_profile(
    prisma: Annotated[Prisma, Depends(get_prisma)],
    current: CurrentUser = Depends(get_current_teacher),
) -> TeacherResponse:
    """Get current teacher profile with role information."""
    teacher = await prisma.teacher.find_unique(where={"id": current.id}, include={"role": True})
    if not teacher:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found")

    role_name = teacher.role.name if teacher.role else None
    return TeacherResponse(
        id=teacher.id,
        email=teacher.email,
        name=teacher.name,
        created_at=teacher.created_at,
        is_active=teacher.is_active,
        role=role_name,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_teacher_token(
    prisma: Annotated[Prisma, Depends(get_prisma)], data: RefreshTokenRequest
) -> TokenResponse:
    """Exchange a valid refresh token for a new access token."""
    refresh_token = data.refresh_token
    token_data = decode_refresh_token(refresh_token)
    if not token_data or not token_data.email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )

    stored = await prisma.refreshtoken.find_first(
        where={"token": refresh_token, "user_type": "TEACHER", "revoked": False}
    )
    if not stored or stored.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired or revoked"
        )

    teacher = await prisma.teacher.find_unique(where={"email": token_data.email})
    if not teacher or not teacher.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Teacher not found or account deactivated",
        )

    # Issue new tokens
    new_access = create_access_token(data={"sub": teacher.email, "type": "teacher"})
    new_refresh = create_refresh_token(data={"sub": teacher.email, "type": "teacher"})

    # Revoke old refresh token
    await prisma.refreshtoken.update(where={"id": stored.id}, data={"revoked": True})
    # Store new refresh token
    await prisma.refreshtoken.create(
        data={
            "user_type": "TEACHER",
            "user_id": teacher.id,
            "token": new_refresh,
            "expires_at": datetime.now(timezone.utc)
            + timedelta(days=settings.refresh_token_expire_days),
        }
    )

    return TokenResponse(
        access_token=new_access,
        token_type="bearer",
        refresh_token=new_refresh,
    )


@router.post("/logout")
async def logout_teacher(
    prisma: Annotated[Prisma, Depends(get_prisma)], data: LogoutRequest
) -> dict:
    """Revoke a refresh token (logout)."""
    refresh_token = data.refresh_token
    result = await prisma.refreshtoken.update(
        where={"token": refresh_token}, data={"revoked": True}
    )
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Refresh token not found")
    return {"message": "Logged out successfully"}
