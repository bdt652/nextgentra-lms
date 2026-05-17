from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel

from app.schemas.category import CategorySummary


class QuestionCreate(BaseModel):
    content: str
    type: str
    options: Optional[Any] = None
    correct_answer: Optional[str] = None
    code_template: Optional[str] = None
    test_cases: Optional[Any] = None
    points: Optional[float] = 1.0
    order: Optional[int] = None


class QuestionUpdate(BaseModel):
    content: Optional[str] = None
    type: Optional[str] = None
    options: Optional[Any] = None
    correct_answer: Optional[str] = None
    code_template: Optional[str] = None
    test_cases: Optional[Any] = None
    points: Optional[float] = None
    order: Optional[int] = None


class QuestionReorderItem(BaseModel):
    id: str
    order: int


class QuestionReorderRequest(BaseModel):
    items: list[QuestionReorderItem]


class QuestionResponse(BaseModel):
    id: str
    exam_id: str
    content: str
    type: str
    options: Optional[Any]
    correct_answer: Optional[str]
    code_template: Optional[str]
    test_cases: Optional[Any]
    points: float
    order: int


class ExamCreate(BaseModel):
    title: str
    description: Optional[str] = None
    duration: Optional[int] = None
    pass_score: Optional[float] = None
    category_id: Optional[str] = None


class ExamUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    duration: Optional[int] = None
    pass_score: Optional[float] = None
    category_id: Optional[str] = None


class ExamResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    teacher_id: str
    duration: Optional[int]
    pass_score: Optional[float]
    category_id: Optional[str]
    category: Optional[CategorySummary] = None
    created_at: datetime
    updated_at: datetime
    question_count: int = 0


class ExamDetailResponse(ExamResponse):
    questions: list[QuestionResponse] = []
