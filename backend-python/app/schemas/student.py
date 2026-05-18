"""Student schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class StudentBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    email: EmailStr
    name: str
    student_code: str
    class_: Optional[str] = Field(default=None, alias="class")


class StudentCreate(StudentBase):
    password: str


class StudentResponse(StudentBase):
    id: str
    created_at: datetime
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class StudentAdminResponse(StudentBase):
    id: str
    created_at: datetime
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class StudentUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    student_code: Optional[str] = None
    is_active: Optional[bool] = None


class StudentLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    refresh_token: str
