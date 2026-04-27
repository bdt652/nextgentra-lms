"""Tests for courses endpoints."""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_list_courses():
    """Test listing courses."""
    response = client.get("/api/v1/courses/")
    assert response.status_code == 200
    data = response.json()
    assert "courses" in data
    assert "total" in data


def test_create_course_unauthorized():
    """Test creating course without auth."""
    response = client.post(
        "/api/v1/courses/",
        json={
            "title": "Test Course",
            "description": "Test"
        }
    )
    assert response.status_code == 401 or response.status_code == 403


def test_get_course_not_found():
    """Test getting non-existent course."""
    response = client.get("/api/v1/courses/nonexistent")
    assert response.status_code == 404
