"""Sections API — CRUD for course sections."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api._course_utils import _require_owner, _section_to_response
from app.core.database import Prisma, get_prisma
from app.dependencies.auth import CurrentUser, require_permission
from app.schemas.section import (
    SectionCreate,
    SectionReorderRequest,
    SectionResponse,
    SectionUpdate,
)
from prisma.types import SectionUpdateInput

router = APIRouter(prefix="/courses", tags=["sections"])

CourseEditor = Annotated[CurrentUser, Depends(require_permission("course:update"))]

_SECTION_WITH_LESSONS = {
    "lessons": {
        "include": {"attachments": True, "prerequisites": True},
        "order_by": {"order": "asc"},
    }
}


@router.post(
    "/{course_id}/sections",
    response_model=SectionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_section(
    course_id: str,
    data: SectionCreate,
    current_user: CourseEditor,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> SectionResponse:
    course = await prisma.course.find_unique(where={"id": course_id})
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    _require_owner(course.teacher_id, current_user)

    if data.order is None:
        count = await prisma.section.count(where={"course_id": course_id})
        order = count
    else:
        order = data.order

    section = await prisma.section.create(
        data={
            "title": data.title,
            "description": data.description,
            "order": order,
            "course_id": course_id,
        },
        include=_SECTION_WITH_LESSONS,  # type: ignore[arg-type]
    )
    return _section_to_response(section)


@router.patch("/{course_id}/sections/{section_id}", response_model=SectionResponse)
async def update_section(
    course_id: str,
    section_id: str,
    data: SectionUpdate,
    current_user: CourseEditor,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> SectionResponse:
    section = await prisma.section.find_unique(where={"id": section_id})
    if not section or section.course_id != course_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Section not found")
    course = await prisma.course.find_unique(where={"id": course_id})
    if course:
        _require_owner(course.teacher_id, current_user)

    update_data: SectionUpdateInput = {}
    if data.title is not None:
        update_data["title"] = data.title
    if data.description is not None:
        update_data["description"] = data.description
    if data.order is not None:
        update_data["order"] = data.order
    if data.is_published is not None:
        update_data["is_published"] = data.is_published

    updated = await prisma.section.update(
        where={"id": section_id},
        data=update_data,
        include=_SECTION_WITH_LESSONS,  # type: ignore[arg-type]
    )
    return _section_to_response(updated)


@router.delete("/{course_id}/sections/{section_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_section(
    course_id: str,
    section_id: str,
    current_user: CourseEditor,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> None:
    section = await prisma.section.find_unique(where={"id": section_id})
    if not section or section.course_id != course_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Section not found")
    course = await prisma.course.find_unique(where={"id": course_id})
    if course:
        _require_owner(course.teacher_id, current_user)
    # onDelete: SetNull on Lesson.section automatically NULLs section_id in DB
    await prisma.section.delete(where={"id": section_id})


@router.post("/{course_id}/sections/reorder", response_model=list[SectionResponse])
async def reorder_sections(
    course_id: str,
    data: SectionReorderRequest,
    current_user: CourseEditor,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> list[SectionResponse]:
    course = await prisma.course.find_unique(where={"id": course_id})
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    _require_owner(course.teacher_id, current_user)

    for item in data.items:
        await prisma.section.update(
            where={"id": item.id},
            data={"order": item.order},
        )

    sections = await prisma.section.find_many(
        where={"course_id": course_id},
        include=_SECTION_WITH_LESSONS,  # type: ignore[arg-type]
        order={"order": "asc"},
    )
    return [_section_to_response(s) for s in sections]
