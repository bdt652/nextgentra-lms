"""Shared helpers for classes, class_members and class_content routers."""

import secrets
import string
from typing import Optional

from fastapi import HTTPException, status

from app.core.database import Prisma
from app.schemas.category import CategorySummary
from app.schemas.class_ import ClassResponse


def _generate_class_code(length: int = 8) -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def _build_category(cat: object) -> Optional[CategorySummary]:
    if cat is None:
        return None
    return CategorySummary(
        id=cat.id,  # type: ignore[attr-defined]
        name=cat.name,  # type: ignore[attr-defined]
        color=cat.color,  # type: ignore[attr-defined]
        icon=cat.icon,  # type: ignore[attr-defined]
    )


def _class_to_response(c: object) -> ClassResponse:
    teacher_count = len(c.teachers) if c.teachers is not None else 0  # type: ignore[attr-defined]
    student_count = len(c.enrollments) if c.enrollments is not None else 0  # type: ignore[attr-defined]
    return ClassResponse(
        id=c.id,  # type: ignore[attr-defined]
        name=c.name,  # type: ignore[attr-defined]
        description=c.description,  # type: ignore[attr-defined]
        code=c.code,  # type: ignore[attr-defined]
        category_id=c.category_id,  # type: ignore[attr-defined]
        category=_build_category(c.category),  # type: ignore[attr-defined]
        created_at=c.created_at,  # type: ignore[attr-defined]
        updated_at=c.updated_at,  # type: ignore[attr-defined]
        teacher_count=teacher_count,
        student_count=student_count,
    )


async def _get_class_or_404(class_id: str, prisma: Prisma) -> object:
    cls = await prisma.classroom.find_unique(
        where={"id": class_id},
        include={"teachers": True, "enrollments": True, "category": True},
    )
    if not cls:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")
    return cls


def _require_class_member(cls: object, current_user_id: str) -> None:
    members = [t.teacher_id for t in (cls.teachers or [])]  # type: ignore[attr-defined]
    if current_user_id not in members:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this class",
        )
