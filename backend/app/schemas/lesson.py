"""Pydantic schemas for lessons."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class LessonBase(BaseModel):
    """Base lesson schema."""
    title: str = Field(..., min_length=1, max_length=200)
    content: Optional[str] = None
    order: int = Field(0, ge=0)
    duration_minutes: Optional[int] = Field(None, ge=0)


class LessonCreate(LessonBase):
    """Lesson creation schema."""
    course_id: str


class LessonUpdate(BaseModel):
    """Lesson update schema."""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = None
    order: Optional[int] = Field(None, ge=0)
    duration_minutes: Optional[int] = Field(None, ge=0)


class LessonResponse(LessonBase):
    """Lesson response schema."""
    id: str
    course_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
