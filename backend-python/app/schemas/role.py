"""Role schemas."""

from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.schemas.permission import PermissionResponse


class PermissionCreate(BaseModel):
    name: str


class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None


class RoleCreate(RoleBase):
    permission_ids: list[str] = []


class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permission_ids: Optional[list[str]] = None


class RoleResponse(RoleBase):
    id: str
    permissions: list[PermissionResponse] = []

    model_config = ConfigDict(from_attributes=True)


class RolePermissionsRequest(BaseModel):
    permission_ids: list[str]
