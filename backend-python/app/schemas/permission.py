"""Permission schemas."""

from pydantic import BaseModel


class PermissionBase(BaseModel):
    name: str


class PermissionCreate(PermissionBase):
    pass


class PermissionResponse(PermissionBase):
    id: str

    class Config:
        from_attributes = True
