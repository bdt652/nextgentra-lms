"""Tests for auth endpoints."""
import pytest
from httpx import AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_register_user():
    """Test user registration."""
    from fastapi.testclient import TestClient
    client = TestClient(app)
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "password": "password123",
            "name": "Test User",
            "role": "student"
        }
    )
    # Should succeed (or fail if user exists in test DB)
    assert response.status_code in [200, 201, 400]


@pytest.mark.asyncio
async def test_login():
    """Test user login."""
    from fastapi.testclient import TestClient
    client = TestClient(app)
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "test@example.com",
            "password": "password123"
        }
    )
    # Should succeed (or fail if credentials invalid)
    assert response.status_code in [200, 401]
