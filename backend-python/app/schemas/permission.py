"""Permission schemas."""

from pydantic import BaseModel, ConfigDict


class PermissionBase(BaseModel):
    name: str


class PermissionCreate(PermissionBase):
    pass


class PermissionResponse(PermissionBase):
    id: str

    model_config = ConfigDict(from_attributes=True)
