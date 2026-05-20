"""Courses API — CRUD for courses."""

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, status

from app.api._course_utils import (
    _COURSE_INCLUDE,
    _build_category,
    _course_to_response,
    _lesson_to_response,
    _require_owner,
    _section_to_response,
)
from app.core.database import Prisma, get_prisma
from app.dependencies.auth import CurrentUser, require_permission
from app.schemas.course import CourseCreate, CourseDetailResponse, CourseResponse, CourseUpdate
from prisma.types import CourseUpdateInput, CourseWhereInput

router = APIRouter(prefix="/courses", tags=["courses"])

CourseReader = Annotated[CurrentUser, Depends(require_permission("course:read"))]
CourseCreator = Annotated[CurrentUser, Depends(require_permission("course:create"))]
CourseEditor = Annotated[CurrentUser, Depends(require_permission("course:update"))]
CourseDeleter = Annotated[CurrentUser, Depends(require_permission("course:delete"))]


@router.get("", response_model=list[CourseResponse])
async def list_courses(
    current_user: CourseReader,
    prisma: Annotated[Prisma, Depends(get_prisma)],
    mine: bool = False,
    category_id: Optional[str] = None,
) -> list[CourseResponse]:
    where: CourseWhereInput = {}
    if mine:
        where["teacher_id"] = current_user.id
    if category_id:
        where["category_id"] = category_id
    courses = await prisma.course.find_many(
        where=where,
        include=_COURSE_INCLUDE,
        order={"created_at": "desc"},
    )
    return [_course_to_response(c) for c in courses]


@router.post("", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(
    data: CourseCreate,
    current_user: CourseCreator,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> CourseResponse:
    course = await prisma.course.create(
        data={
            "title": data.title,
            "description": data.description,
            "cover_image": data.cover_image,
            "teacher_id": current_user.id,
            "category_id": data.category_id,
        },
        include=_COURSE_INCLUDE,
    )
    return _course_to_response(course)


@router.get("/{course_id}", response_model=CourseDetailResponse)
async def get_course(
    course_id: str,
    _: CourseReader,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> CourseDetailResponse:
    course = await prisma.course.find_unique(
        where={"id": course_id},
        include={
            "category": True,
            "sections": {
                "include": {
                    "lessons": {
                        "include": {"attachments": True, "prerequisites": True},
                        "order_by": {"order": "asc"},
                    }
                },
                "order_by": {"order": "asc"},
            },
            "lessons": {
                "where": {"section_id": None},
                "include": {"attachments": True, "prerequisites": True},
                "order_by": {"order": "asc"},
            },
        },
    )
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    sections = [_section_to_response(s) for s in (course.sections or [])]
    unsectioned = [_lesson_to_response(lesson) for lesson in (course.lessons or [])]
    total_lessons = sum(len(s.lessons) for s in sections) + len(unsectioned)

    return CourseDetailResponse(
        id=course.id,
        title=course.title,
        description=course.description,
        cover_image=course.cover_image,
        teacher_id=course.teacher_id,
        is_published=course.is_published,
        category_id=course.category_id,
        category=_build_category(course.category),
        created_at=course.created_at,
        updated_at=course.updated_at,
        lesson_count=total_lessons,
        sections=sections,
        unsectioned_lessons=unsectioned,
    )


@router.patch("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: str,
    data: CourseUpdate,
    current_user: CourseEditor,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> CourseResponse:
    course = await prisma.course.find_unique(where={"id": course_id})
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    _require_owner(course.teacher_id, current_user)

    update_data: CourseUpdateInput = {}
    if data.title is not None:
        update_data["title"] = data.title
    if data.description is not None:
        update_data["description"] = data.description
    if data.cover_image is not None:
        update_data["cover_image"] = data.cover_image
    if data.is_published is not None:
        update_data["is_published"] = data.is_published
    if data.category_id is not None:
        update_data["category"] = {"connect": {"id": data.category_id}}

    updated = await prisma.course.update(
        where={"id": course_id},
        data=update_data,
        include=_COURSE_INCLUDE,
    )
    return _course_to_response(updated)


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(
    course_id: str,
    current_user: CourseDeleter,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> None:
    course = await prisma.course.find_unique(where={"id": course_id})
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    _require_owner(course.teacher_id, current_user)
    await prisma.course.delete(where={"id": course_id})


@router.post("/{course_id}/publish", response_model=CourseResponse)
async def toggle_publish(
    course_id: str,
    current_user: CourseEditor,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> CourseResponse:
    course = await prisma.course.find_unique(where={"id": course_id})
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    _require_owner(course.teacher_id, current_user)
    updated = await prisma.course.update(
        where={"id": course_id},
        data={"is_published": not course.is_published},
        include=_COURSE_INCLUDE,
    )
    return _course_to_response(updated)
