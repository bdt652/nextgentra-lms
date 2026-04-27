"""Pydantic schemas for courses."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class CourseBase(BaseModel):
    """Base course schema."""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    status: str = Field("draft", pattern="^(draft|published|archived)$")


class CourseCreate(CourseBase):
    """Course creation schema."""
    pass


class CourseUpdate(BaseModel):
    """Course update schema."""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    status: Optional[str] = Field(None, pattern="^(draft|published|archived)$")


class CourseResponse(CourseBase):
    """Course response schema."""
    id: str
    teacher_id: str
    teacher_name: str
    created_at: datetime
    updated_at: datetime
    enrollment_count: Optional[int] = 0

    class Config:
        from_attributes = True


class CourseListResponse(BaseModel):
    """Paginated course list response."""
    courses: list[CourseResponse]
    total: int
    skip: int
    limit: int
