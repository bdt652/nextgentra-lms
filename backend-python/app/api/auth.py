"""Authentication API endpoints."""
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from prisma.models import User as PrismaUser

from app.core.auth import (
    create_access_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.core.database import Prisma, get_prisma
from app.schemas.user import Token, UserCreate, UserLogin, UserResponse

router = APIRouter(prefix="/auth", tags=["authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


async def get_user_by_email(prisma: Prisma, email: str) -> Optional[PrismaUser]:
    """Find user by email."""
    return await prisma.user.find_unique(where={"email": email})


async def get_user_by_id(prisma: Prisma, user_id: str) -> Optional[PrismaUser]:
    """Find user by ID."""
    return await prisma.user.find_unique(where={"id": user_id})


@router.post("/register", response_model=UserResponse,
             status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    prisma: Annotated[Prisma, Depends(get_prisma)]
):
    """Register a new user."""
    # Check if user already exists
    existing = await get_user_by_email(prisma, user_data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new user in database
    user = await prisma.user.create(
        data={
            "email": user_data.email,
            "name": user_data.name,
            "role": user_data.role,
            "hashed_password": get_password_hash(user_data.password),
        }
    )
    return user


@router.post("/login", response_model=Token)
async def login(
    credentials: UserLogin,
    prisma: Annotated[Prisma, Depends(get_prisma)]
):
    """Authenticate user and return access token."""
    # Find user by email
    user = await get_user_by_email(prisma, credentials.email)
    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verify password
    if not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create access token
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    prisma: Annotated[Prisma, Depends(get_prisma)],
    token: str = Depends(oauth2_scheme)
):
    """Get current authenticated user."""
    token_data = decode_token(token)
    if token_data is None or token_data.email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Find user by email
    user = await get_user_by_email(prisma, token_data.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user
