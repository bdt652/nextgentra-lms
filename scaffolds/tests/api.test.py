"""
Scaffold: API Endpoint Test Template

Use this template for testing FastAPI endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestResourceEndpoints:
    """Test suite for resource endpoints"""

    def test_list_resources_returns_200(self):
        """Test that list endpoint returns 200"""
        response = client.get("/api/v1/resources")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_list_resources_pagination(self):
        """Test pagination parameters"""
        response = client.get("/api/v1/resources?page=1&limit=10")
        assert response.status_code == 200
        # Add assertions for pagination metadata

    def test_get_resource_404(self):
        """Test getting non-existent resource returns 404"""
        response = client.get("/api/v1/resources/nonexistent")
        assert response.status_code == 404
        assert response.json()["error"] == "NOT_FOUND"

    def test_create_resource_requires_auth(self):
        """Test that create endpoint requires authentication"""
        response = client.post("/api/v1/resources", json={
            "title": "Test"
        })
        assert response.status_code == 401

    def test_create_resource_valid_data(self, auth_headers):
        """Test creating resource with valid data"""
        response = client.post(
            "/api/v1/resources",
            json={
                "title": "New Resource",
                "description": "Description"
            },
            headers=auth_headers
        )
        assert response.status_code == 201
        assert response.json()["title"] == "New Resource"

    def test_update_resource(self, auth_headers):
        """Test updating resource"""
        # First create a resource
        create_response = client.post(
            "/api/v1/resources",
            json={"title": "Original"},
            headers=auth_headers
        )
        resource_id = create_response.json()["id"]

        # Update it
        response = client.put(
            f"/api/v1/resources/{resource_id}",
            json={"title": "Updated"},
            headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["title"] == "Updated"

    def test_delete_resource(self, auth_headers):
        """Test deleting resource"""
        # Create then delete
        create_response = client.post(
            "/api/v1/resources",
            json={"title": "To Delete"},
            headers=auth_headers
        )
        resource_id = create_response.json()["id"]

        response = client.delete(
            f"/api/v1/resources/{resource_id}",
            headers=auth_headers
        )
        assert response.status_code == 204

        # Verify deleted
        get_response = client.get(
            f"/api/v1/resources/{resource_id}",
            headers=auth_headers
        )
        assert get_response.status_code == 404


@pytest.fixture
def auth_headers():
    """Fixture for authenticated headers"""
    # Login to get token
    response = client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "testpassword"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
