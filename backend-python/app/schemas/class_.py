from datetime import datetime
from typing import Optional

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
    role: Optional[str] = "assistant"


class ClassEnrollmentCreate(BaseModel):
    student_id: str


class ClassEnrollmentResponse(BaseModel):
    student_id: str
    name: str
    email: str
    enrolled_at: datetime


class ClassCourseCreate(BaseModel):
    course_id: str


class ClassExamCreate(BaseModel):
    exam_id: str
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None


class ClassExamResponse(BaseModel):
    exam_id: str
    title: str
    duration: Optional[int]
    start_time: Optional[datetime]
    end_time: Optional[datetime]
    assigned_at: datetime


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
