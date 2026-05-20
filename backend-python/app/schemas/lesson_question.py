"""Pydantic schemas for LessonQuestion (questions attached to a lesson)."""

from datetime import datetime

from pydantic import BaseModel


class QuestionBrief(BaseModel):
    id: str
    content: str
    type: str
    points: float
    exam_id: str
    exam_title: str | None


class LessonQuestionResponse(BaseModel):
    id: str
    lesson_id: str
    question_id: str
    order: int
    is_extension: bool
    prerequisite_ids: list[str]
    created_at: datetime
    question: QuestionBrief


class LessonQuestionAddRequest(BaseModel):
    question_ids: list[str]


class LessonQuestionUpdateRequest(BaseModel):
    is_extension: bool | None = None
    prerequisite_ids: list[str] | None = None


class LessonQuestionReorderItem(BaseModel):
    id: str
    order: int


class LessonQuestionReorderRequest(BaseModel):
    items: list[LessonQuestionReorderItem]
