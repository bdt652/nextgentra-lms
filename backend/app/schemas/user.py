"""Pydantic schemas for users."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=100)
    role: str = Field("student", pattern="^(student|teacher|admin)$")


class UserCreate(UserBase):
    """User creation schema."""
    password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    """User update schema."""
    name: Optional[str] = None
    email: Optional[EmailStr] = None


class UserResponse(UserBase):
    """User response schema."""
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserProfile(BaseModel):
    """User profile schema with enrollments."""
    id: str
    email: EmailStr
    name: str
    role: str
    created_at: datetime
    courses: list = []

    class Config:
        from_attributes = True
