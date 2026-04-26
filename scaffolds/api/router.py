"""
Scaffold: API Endpoint Template

This template shows the standard structure for API endpoints.
Copy and adapt for your needs.

File locations:
- Router: backend/app/api/resource.py
- Schema: backend/app/schemas/resource.py
- Service: backend/app/services/resource_service.py
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from ...schemas.resource import (
    ResourceCreate,
    ResourceUpdate,
    ResourceResponse,
)
from ...services.resource_service import ResourceService
from ...core.security import get_current_user, require_role

router = APIRouter(prefix="/resources", tags=["resources"])


@router.get("/", response_model=List[ResourceResponse])
async def list_resources(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    user=Depends(get_current_user),
):
    """
    List resources with pagination and optional filters.

    Args:
        skip: Number of items to skip (pagination)
        limit: Max items to return (max 100)
        status: Filter by status (if applicable)

    Returns:
        List of resources

    Raises:
        HTTPException: 401 if not authenticated
    """
    return await ResourceService.list_resources(skip, limit, status, user)


@router.get("/{id}", response_model=ResourceResponse)
async def get_resource(
    id: str,
    user=Depends(get_current_user),
):
    """
    Get resource by ID.

    Args:
        id: Resource UUID

    Returns:
        Resource details

    Raises:
        HTTPException: 404 if not found
        HTTPException: 401 if not authenticated
    """
    resource = await ResourceService.get_resource(id)
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found"
        )
    return resource


@router.post("/", response_model=ResourceResponse, status_code=status.HTTP_201_CREATED)
async def create_resource(
    data: ResourceCreate,
    user=Depends(require_role("TEACHER")),  # Adjust role as needed
):
    """
    Create a new resource.

    Args:
        data: Resource creation data

    Returns:
        Created resource

    Raises:
        HTTPException: 403 if insufficient permissions
        HTTPException: 400 if validation fails
    """
    return await ResourceService.create_resource(data, user.id)


@router.put("/{id}", response_model=ResourceResponse)
async def update_resource(
    id: str,
    data: ResourceUpdate,
    user=Depends(require_role("TEACHER")),  # Adjust role as needed
):
    """
    Update an existing resource.

    Args:
        id: Resource UUID
        data: Update data (all fields optional)

    Returns:
        Updated resource

    Raises:
        HTTPException: 404 if not found
        HTTPException: 403 if insufficient permissions
    """
    resource = await ResourceService.update_resource(id, data, user.id)
    return resource


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resource(
    id: str,
    user=Depends(require_role("TEACHER")),  # Adjust role as needed
):
    """
    Delete a resource.

    Args:
        id: Resource UUID

    Returns:
        None (204 No Content)

    Raises:
        HTTPException: 404 if not found
        HTTPException: 403 if insufficient permissions
    """
    await ResourceService.delete_resource(id, user.id)
    return None
