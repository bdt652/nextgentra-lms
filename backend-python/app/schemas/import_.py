"""Shared schemas for bulk import endpoints."""

from pydantic import BaseModel


class ImportRowError(BaseModel):
    row: int
    reason: str


class ImportResult(BaseModel):
    created: int
    skipped: int
    errors: list[ImportRowError]
