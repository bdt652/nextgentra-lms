"""Example test file for the LMS backend API."""

import pytest
from httpx import AsyncClient


@pytest.mark.unit
async def test_health_check(client: AsyncClient):
    """Test the health check endpoint."""
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


@pytest.mark.unit
async def test_root_endpoint(client: AsyncClient):
    """Test the root API endpoint."""
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "version" in data
