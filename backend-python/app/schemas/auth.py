"""Schemas for authentication requests and responses."""

from pydantic import BaseModel


class RefreshTokenRequest(BaseModel):
    """Request to refresh access token."""

    refresh_token: str


class LogoutRequest(BaseModel):
    """Request to logout (revoke refresh token)."""

    refresh_token: str


class TokenResponse(BaseModel):
    """Response containing access and refresh tokens."""

    access_token: str
    token_type: str
    refresh_token: str
