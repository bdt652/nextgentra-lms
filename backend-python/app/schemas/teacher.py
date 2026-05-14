"""Teacher schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class TeacherBase(BaseModel):
    email: EmailStr
    name: str


class TeacherCreate(TeacherBase):
    password: str
    role: str = Field(default="teacher", description="Role name: 'teacher' or 'admin'")


class TeacherResponse(TeacherBase):
    id: str
    created_at: datetime
    is_active: bool
    role: Optional[str] = None  # Role name from related Role table

    model_config = ConfigDict(from_attributes=True)


class TeacherLogin(BaseModel):
    email: EmailStr
    password: str
