"""
Scaffold: Service Unit Test Template

Use this template for testing service layer functions.
"""

import pytest
from unittest.mock import AsyncMock, patch
from app.services.resource_service import ResourceService
from app.schemas.resource import ResourceCreate, ResourceUpdate

@pytest.mark.asyncio
async def test_list_resources_returns_all(mock_db):
    """Test that list_resources returns all resources"""
    # Arrange
    mock_db.resource.find_many.return_value = [
        {"id": "1", "title": "Test Resource"}
    ]

    # Act
    result = await ResourceService.list_resources(0, 20, None, {"id": "user1"})

    # Assert
    assert len(result) == 1
    assert result[0]["title"] == "Test Resource"
    mock_db.resource.find_many.assert_called_once()


@pytest.mark.asyncio
async def test_list_resources_respects_skip(mock_db):
    """Test that skip parameter works"""
    # Arrange
    mock_db.resource.find_many.return_value = []

    # Act
    await ResourceService.list_resources(10, 20, None, {"id": "user1"})

    # Assert
    mock_db.resource.find_many.assert_called_once()
    call_kwargs = mock_db.resource.find_many.call_args.kwargs
    assert call_kwargs["skip"] == 10


@pytest.mark.asyncio
async def test_create_resource_success(mock_db):
    """Test successful resource creation"""
    # Arrange
    mock_db.resource.create.return_value = {
        "id": "new-id",
        "title": "New Resource",
        "created_by": "user1"
    }
    data = ResourceCreate(title="New Resource")

    # Act
    result = await ResourceService.create_resource(data, "user1")

    # Assert
    assert result["id"] == "new-id"
    assert result["title"] == "New Resource"
    mock_db.resource.create.assert_called_once()


@pytest.mark.asyncio
async def test_update_resource_not_found(mock_db):
    """Test that update raises error when resource not found"""
    # Arrange
    mock_db.resource.find_unique.return_value = None

    # Act & Assert
    with pytest.raises(ValueError, match="Resource not found"):
        await ResourceService.update_resource(
            "nonexistent",
            ResourceUpdate(title="Updated"),
            "user1"
        )


@pytest.mark.asyncio
async def test_delete_resource_success(mock_db):
    """Test successful resource deletion"""
    # Arrange
    mock_db.resource.find_unique.return_value = {
        "id": "to-delete",
        "created_by": "user1"
    }

    # Act
    await ResourceService.delete_resource("to-delete", "user1")

    # Assert
    mock_db.resource.delete.assert_called_once_with(where={"id": "to-delete"})
