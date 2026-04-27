"""Pydantic schemas for authentication."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class Token(BaseModel):
    """Token response schema."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """Token payload schema."""
    sub: str
    exp: datetime
    iat: datetime


class LoginRequest(BaseModel):
    """Login request schema."""
    email: EmailStr
    password: str = Field(..., min_length=6)


class RegisterRequest(BaseModel):
    """Registration request schema."""
    email: EmailStr
    password: str = Field(..., min_length=6)
    name: str = Field(..., min_length=1, max_length=100)
    role: str = Field("student", pattern="^(student|teacher|admin)$")


class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    name: str
    role: str


class UserResponse(UserBase):
    """User response schema."""
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RefreshTokenRequest(BaseModel):
    """Refresh token request schema."""
    refresh_token: str
