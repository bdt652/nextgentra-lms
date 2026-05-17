from datetime import datetime
from typing import Optional

from pydantic import BaseModel


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


class LessonUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    video_url: Optional[str] = None
    order: Optional[int] = None
    is_published: Optional[bool] = None


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
    created_at: datetime
    updated_at: datetime
    attachments: list[LessonAttachmentResponse] = []
