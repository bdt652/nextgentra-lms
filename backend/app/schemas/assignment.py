"""Pydantic schemas for assignments."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class AssignmentBase(BaseModel):
    """Base assignment schema."""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    due_date: Optional[datetime] = None
    max_score: int = Field(100, ge=0)
    course_id: str


class AssignmentCreate(AssignmentBase):
    """Assignment creation schema."""
    pass


class AssignmentUpdate(BaseModel):
    """Assignment update schema."""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    due_date: Optional[datetime] = None
    max_score: Optional[int] = Field(None, ge=0)


class AssignmentResponse(AssignmentBase):
    """Assignment response schema."""
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
