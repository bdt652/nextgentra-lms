"""Pydantic schemas for submissions."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class SubmissionBase(BaseModel):
    """Base submission schema."""
    student_id: str
    assignment_id: str
    content: Optional[str] = None
    file_urls: Optional[List[str]] = []


class SubmissionCreate(SubmissionBase):
    """Submission creation schema."""
    pass


class SubmissionUpdate(BaseModel):
    """Submission update schema (for grading)."""
    score: Optional[int] = Field(None, ge=0, le=100)
    feedback: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(submitted|graded)$")


class SubmissionResponse(SubmissionBase):
    """Submission response schema."""
    id: str
    status: str
    submitted_at: datetime
    graded_at: Optional[datetime] = None
    score: Optional[int] = None
    feedback: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SubmissionDetailResponse(BaseModel):
    """Submission with full assignment and student details."""
    id: str
    student: dict  # UserResponse
    assignment: dict  # AssignmentResponse
    content: Optional[str]
    file_urls: Optional[List[str]]
    score: Optional[int]
    feedback: Optional[str]
    status: str
    submitted_at: datetime
    graded_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
