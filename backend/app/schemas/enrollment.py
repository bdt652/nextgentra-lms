"""Pydantic schemas for enrollments."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class EnrollmentBase(BaseModel):
    """Base enrollment schema."""
    student_id: str
    course_id: str


class EnrollmentCreate(EnrollmentBase):
    """Enrollment creation schema."""
    pass


class EnrollmentResponse(EnrollmentBase):
    """Enrollment response schema."""
    id: str
    enrolled_at: datetime

    class Config:
        from_attributes = True


class EnrollmentDetailResponse(BaseModel):
    """Enrollment with full course and student details."""
    id: str
    enrolled_at: datetime
    student: dict  # UserResponse
    course: dict  # CourseResponse

    class Config:
        from_attributes = True
