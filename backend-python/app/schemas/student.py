"""Student schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class StudentBase(BaseModel):
    email: EmailStr
    name: str
    student_code: str
    class_: Optional[str] = Field(default=None, alias="class")

    class Config:
        populate_by_name = True  # Cho phép cả "class_" và "class"


class StudentCreate(StudentBase):
    password: str


class StudentResponse(StudentBase):
    id: str
    created_at: datetime
    is_active: bool

    class Config:
        from_attributes = True


class StudentLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    refresh_token: str
