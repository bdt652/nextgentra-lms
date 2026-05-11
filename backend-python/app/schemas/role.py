"""Role schemas."""

from typing import List, Optional

from pydantic import BaseModel


class PermissionBase(BaseModel):
    name: str


class PermissionResponse(PermissionBase):
    id: str

    class Config:
        from_attributes = True


class PermissionCreate(BaseModel):
    name: str


class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None


class RoleCreate(RoleBase):
    permission_ids: List[str] = []


class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permission_ids: Optional[List[str]] = None


class RoleResponse(RoleBase):
    id: str
    permissions: List[PermissionResponse] = []

    class Config:
        from_attributes = True
