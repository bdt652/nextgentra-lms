"""User service module."""
from datetime import datetime
from typing import Optional
from prisma import Prisma
from app.core.security import get_password_hash, verify_password
from app.schemas.user import UserCreate, UserUpdate


class UserService:
    """Service layer for user operations."""

    @staticmethod
    async def create_user(data: UserCreate) -> dict:
        """Create a new user."""
        db = Prisma()
        await db.connect()
        try:
            # Check if user exists
            existing = await db.user.find_unique(where={"email": data.email})
            if existing:
                raise ValueError("User with this email already exists")

            hashed_password = get_password_hash(data.password)
            user = await db.user.create(
                data={
                    "email": data.email,
                    "name": data.name,
                    "role": data.role,
                    "hashed_password": hashed_password,
                }
            )
            return {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "role": user.role,
                "created_at": user.created_at,
            }
        finally:
            await db.disconnect()

    @staticmethod
    async def get_user_by_email(email: str) -> Optional[dict]:
        """Get user by email including password."""
        db = Prisma()
        await db.connect()
        try:
            user = await db.user.find_unique(where={"email": email})
            if not user:
                return None
            return {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "role": user.role,
                "hashed_password": user.hashed_password,
                "created_at": user.created_at,
            }
        finally:
            await db.disconnect()

    @staticmethod
    async def get_user_by_id(user_id: str) -> Optional[dict]:
        """Get user by ID."""
        db = Prisma()
        await db.connect()
        try:
            user = await db.user.find_unique(where={"id": user_id})
            if not user:
                return None
            return {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "role": user.role,
                "created_at": user.created_at,
            }
        finally:
            await db.disconnect()

    @staticmethod
    async def update_user(user_id: str, data: UserUpdate) -> Optional[dict]:
        """Update user information."""
        db = Prisma()
        await db.connect()
        try:
            update_data = data.model_dump(exclude_unset=True)
            if "password" in update_data:
                update_data["hashed_password"] = get_password_hash(
                    update_data.pop("password")
                )
            user = await db.user.update(
                where={"id": user_id},
                data=update_data,
            )
            return {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "role": user.role,
                "created_at": user.created_at,
                "updated_at": user.updated_at,
            }
        finally:
            await db.disconnect()

    @staticmethod
    async def authenticate_user(email: str, password: str) -> Optional[dict]:
        """Authenticate user with email and password."""
        user = await UserService.get_user_by_email(email)
        if not user:
            return None
        if not verify_password(password, user["hashed_password"]):
            return None
        return user
