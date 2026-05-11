"""Student authentication API endpoints."""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Body, Depends, HTTPException, status
from prisma import Prisma
from typing import Annotated

from app.core.auth import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    verify_password,
    get_password_hash,
)
from app.core.database import get_prisma, settings
from app.dependencies.auth import get_current_student
from app.schemas.student import StudentCreate, StudentResponse, StudentLogin, TokenResponse

router = APIRouter(prefix="/auth/student", tags=["student-auth"])


@router.post("/register", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def register_student(
    data: StudentCreate, prisma: Annotated[Prisma, Depends(get_prisma)]
) -> StudentResponse:
    """Register a new student account."""
    existing = await prisma.student.find_unique(where={"email": data.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered"
        )

    student = await prisma.student.create(
        data={
            "email": data.email,
            "name": data.name,
            "student_code": data.student_code,
            "class": data.class_,
            "hashed_password": get_password_hash(data.password),
        }
    )

    return StudentResponse(
        id=student.id,
        email=student.email,
        name=student.name,
        student_code=student.student_code,
        class_=student.class_,
        created_at=student.created_at,
        is_active=student.is_active,
    )


@router.post("/login", response_model=TokenResponse)
async def login_student(
    credentials: StudentLogin, prisma: Annotated[Prisma, Depends(get_prisma)]
) -> TokenResponse:
    """Authenticate student and return access + refresh tokens."""
    student = await prisma.student.find_unique(where={"email": credentials.email})
    if not student or not verify_password(credentials.password, student.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not student.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account deactivated")

    access_token = create_access_token(data={"sub": student.email, "type": "student"})
    refresh_token = create_refresh_token(data={"sub": student.email, "type": "student"})

    # Store refresh token in database
    await prisma.refreshtoken.create(
        data={
            "user_type": "STUDENT",
            "user_id": student.id,
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


@router.get("/me", response_model=StudentResponse)
async def get_current_student_profile(
    prisma: Annotated[Prisma, Depends(get_prisma)],
    current: Annotated = Depends(get_current_student),
) -> StudentResponse:
    """Get current student profile."""
    student = await prisma.student.find_unique(where={"id": current.id})
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    return StudentResponse(
        id=student.id,
        email=student.email,
        name=student.name,
        student_code=student.student_code,
        class_=student.class_,
        created_at=student.created_at,
        is_active=student.is_active,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_student_token(
    prisma: Annotated[Prisma, Depends(get_prisma)], refresh_token: str = Body(...)
) -> TokenResponse:
    """Exchange a valid refresh token for a new access token."""
    token_data = decode_refresh_token(refresh_token)
    if not token_data or not token_data.email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )

    stored = await prisma.refreshtoken.find_first(
        where={"token": refresh_token, "user_type": "STUDENT", "revoked": False}
    )
    if not stored or stored.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired or revoked"
        )

    student = await prisma.student.find_unique(where={"email": token_data.email})
    if not student or not student.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Student not found or account deactivated",
        )

    # Issue new tokens
    new_access = create_access_token(data={"sub": student.email, "type": "student"})
    new_refresh = create_refresh_token(data={"sub": student.email, "type": "student"})

    # Revoke old refresh token
    await prisma.refreshtoken.update(where={"id": stored.id}, data={"revoked": True})
    # Store new refresh token
    await prisma.refreshtoken.create(
        data={
            "user_type": "STUDENT",
            "user_id": student.id,
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
async def logout_student(
    prisma: Annotated[Prisma, Depends(get_prisma)], refresh_token: str = Body(...)
):
    """Revoke a refresh token (logout)."""
    result = await prisma.refreshtoken.update(
        where={"token": refresh_token}, data={"revoked": True}
    )
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Refresh token not found")
    return {"message": "Logged out successfully"}
