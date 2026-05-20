from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.schemas.lesson_question import LessonQuestionResponse


class LessonAttachmentResponse(BaseModel):
    id: str
    name: str
    file_url: str
    file_type: str
    created_at: datetime


class LessonAttachmentCreate(BaseModel):
    name: str
    file_url: str
    file_type: str


class LessonCreate(BaseModel):
    title: str
    content: Optional[str] = None
    video_url: Optional[str] = None
    order: Optional[int] = None
    section_id: Optional[str] = None
    prerequisite_ids: list[str] = []


class LessonUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    video_url: Optional[str] = None
    order: Optional[int] = None
    is_published: Optional[bool] = None
    section_id: Optional[str] = None
    prerequisite_ids: Optional[list[str]] = None


class LessonReorderItem(BaseModel):
    id: str
    order: int


class LessonReorderRequest(BaseModel):
    items: list[LessonReorderItem]


class LessonResponse(BaseModel):
    id: str
    title: str
    content: Optional[str]
    video_url: Optional[str]
    order: int
    is_published: bool
    course_id: str
    section_id: Optional[str] = None
    prerequisite_ids: list[str] = []
    created_at: datetime
    updated_at: datetime
    attachments: list[LessonAttachmentResponse] = []
    lesson_questions: list[LessonQuestionResponse] = []
