from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None


class CategoryResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    color: Optional[str]
    icon: Optional[str]
    created_at: datetime
    updated_at: datetime
    course_count: int = 0
    exam_count: int = 0
    classroom_count: int = 0


class CategorySummary(BaseModel):
    """Lightweight category info for embedding in Course/Exam/Classroom responses."""

    id: str
    name: str
    color: Optional[str]
    icon: Optional[str]
