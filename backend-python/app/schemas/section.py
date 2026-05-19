from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.schemas.lesson import LessonResponse


class SectionCreate(BaseModel):
    title: str
    description: Optional[str] = None
    order: Optional[int] = None


class SectionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = None
    is_published: Optional[bool] = None


class SectionReorderItem(BaseModel):
    id: str
    order: int


class SectionReorderRequest(BaseModel):
    items: list[SectionReorderItem]


class SectionResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    order: int
    course_id: str
    is_published: bool
    created_at: datetime
    updated_at: datetime
    lessons: list[LessonResponse] = []
