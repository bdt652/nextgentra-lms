from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from pydantic import BaseModel

from app.schemas.category import CategorySummary

if TYPE_CHECKING:
    from app.schemas.lesson import LessonResponse


class CourseCreate(BaseModel):
    title: str
    description: str | None = None
    cover_image: str | None = None
    category_id: str | None = None


class CourseUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    cover_image: str | None = None
    is_published: bool | None = None
    category_id: str | None = None


class CourseResponse(BaseModel):
    id: str
    title: str
    description: str | None
    cover_image: str | None
    teacher_id: str
    is_published: bool
    category_id: str | None
    category: CategorySummary | None = None
    created_at: datetime
    updated_at: datetime
    lesson_count: int = 0


class CourseDetailResponse(CourseResponse):
    lessons: list[LessonResponse] = []
