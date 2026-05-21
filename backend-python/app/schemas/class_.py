from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel

from app.schemas.category import CategorySummary
from app.schemas.course import CourseResponse


class ClassCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category_id: Optional[str] = None


class ClassUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[str] = None


class ClassTeacherResponse(BaseModel):
    teacher_id: str
    name: str
    email: str
    role: str
    joined_at: datetime


class ClassTeacherAdd(BaseModel):
    teacher_id: str
    role: Literal["assistant", "ta"] = "assistant"


class ClassTeacherRoleUpdate(BaseModel):
    role: Literal["assistant", "ta"]


class ClassEnrollmentCreate(BaseModel):
    student_id: str


class ClassEnrollmentResponse(BaseModel):
    student_id: str
    name: str
    email: str
    student_code: str
    enrolled_at: datetime


class ClassCourseCreate(BaseModel):
    course_id: str


class ClassExamCreate(BaseModel):
    exam_id: str
    display_name: Optional[str] = None
    shuffle_questions: bool = False
    question_limit: Optional[int] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None


class ClassExamResponse(BaseModel):
    exam_id: str
    title: str
    display_name: Optional[str]
    duration: Optional[int]
    shuffle_questions: bool
    question_limit: Optional[int]
    start_time: Optional[datetime]
    end_time: Optional[datetime]
    assigned_at: datetime


class ReorderRequest(BaseModel):
    ids: list[str]


class ClassExamUpdate(BaseModel):
    display_name: Optional[str] = None
    shuffle_questions: Optional[bool] = None
    question_limit: Optional[int] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None


class ClassResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    code: str
    category_id: Optional[str] = None
    category: Optional[CategorySummary] = None
    created_at: datetime
    updated_at: datetime
    teacher_count: int = 0
    student_count: int = 0


class ClassDetailResponse(ClassResponse):
    teachers: list[ClassTeacherResponse] = []
    courses: list[CourseResponse] = []
    exams: list[ClassExamResponse] = []


class ClassStudentImportRow(BaseModel):
    student_code: str


class ClassStudentImportRequest(BaseModel):
    rows: list[ClassStudentImportRow]
