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
    permissions: list[str] = []  # Permission names from role

    model_config = ConfigDict(from_attributes=True)


class TeacherLogin(BaseModel):
    email: EmailStr
    password: str


class TeacherAdminResponse(BaseModel):
    """Teacher info for admin listing — includes role_id for form binding."""

    id: str
    email: EmailStr
    name: str
    is_active: bool
    created_at: datetime
    role_id: Optional[str] = None
    role: Optional[str] = None
    permissions: list[str] = []

    model_config = ConfigDict(from_attributes=True)


class AssignRoleRequest(BaseModel):
    role_id: Optional[str] = None  # None = remove role from teacher


class TeacherUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None


class ResetPasswordRequest(BaseModel):
    new_password: str = Field(..., min_length=8)
