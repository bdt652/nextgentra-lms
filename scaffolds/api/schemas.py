"""
Scaffold: Pydantic Schema Template

Use this template for creating request/response schemas.
"""

from pydantic import BaseModel, Field, EmailStr, validator
from datetime import datetime
from typing import Optional, List


# ========== Base Schemas ==========

class ResourceBase(BaseModel):
    """Base schema with common fields"""

    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)

    class Config:
        extra = "forbid"  # Reject unknown fields


# ========== Create/Update Schemas ==========

class ResourceCreate(ResourceBase):
    """Schema for creating a resource"""

    # Add required fields for creation
    # e.g., course_id: str

    pass


class ResourceUpdate(BaseModel):
    """Schema for updating a resource - all fields optional"""

    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)

    class Config:
        extra = "forbid"


# ========== Response Schemas ==========

class ResourceResponse(ResourceBase):
    """Full resource response with all fields"""

    id: str
    created_by: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # Enable ORM mode for Prisma


# ========== Query/Filter Schemas ==========

class ResourceQuery(BaseModel):
    """Schema for query parameters"""

    page: int = Field(1, ge=1)
    limit: int = Field(20, ge=1, le=100)
    status: Optional[str] = None
    search: Optional[str] = None

    class Config:
        extra = "allow"  # Allow extra query params to pass through


# ========== Example with Enum ==========

from enum import Enum

class ResourceStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"

# Then use: status: ResourceStatus = ResourceStatus.DRAFT
