"""Courses, Sections & Lessons API — CRUD for courses, their sections and lessons."""

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.database import Prisma, get_prisma
from app.dependencies.auth import CurrentUser, require_permission
from app.schemas.category import CategorySummary
from app.schemas.course import CourseCreate, CourseDetailResponse, CourseResponse, CourseUpdate
from app.schemas.lesson import (
    LessonAttachmentCreate,
    LessonAttachmentResponse,
    LessonCreate,
    LessonReorderRequest,
    LessonResponse,
    LessonUpdate,
)
from app.schemas.section import (
    SectionCreate,
    SectionReorderRequest,
    SectionResponse,
    SectionUpdate,
)
from prisma.types import (
    CourseInclude,
    CourseUpdateInput,
    CourseWhereInput,
    LessonInclude,
    LessonUpdateInput,
    SectionUpdateInput,
)

router = APIRouter(prefix="/courses", tags=["courses"])

CourseReader = Annotated[CurrentUser, Depends(require_permission("course:read"))]
CourseCreator = Annotated[CurrentUser, Depends(require_permission("course:create"))]
CourseEditor = Annotated[CurrentUser, Depends(require_permission("course:update"))]
CourseDeleter = Annotated[CurrentUser, Depends(require_permission("course:delete"))]
LessonReader = Annotated[CurrentUser, Depends(require_permission("lesson:read"))]
LessonCreator = Annotated[CurrentUser, Depends(require_permission("lesson:create"))]
LessonEditor = Annotated[CurrentUser, Depends(require_permission("lesson:update"))]
LessonDeleter = Annotated[CurrentUser, Depends(require_permission("lesson:delete"))]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_COURSE_INCLUDE: CourseInclude = {"lessons": True, "category": True}

_LESSON_INCLUDE: LessonInclude = {"attachments": True, "prerequisites": True}

_SECTION_LESSON_INCLUDE = {
    "include": {
        "attachments": True,
        "prerequisites": True,
    },
    "order_by": {"order": "asc"},
}


def _build_category(cat: object) -> Optional[CategorySummary]:
    if cat is None:
        return None
    return CategorySummary(
        id=cat.id,  # type: ignore[attr-defined]
        name=cat.name,  # type: ignore[attr-defined]
        color=cat.color,  # type: ignore[attr-defined]
        icon=cat.icon,  # type: ignore[attr-defined]
    )


def _lesson_to_response(l: object) -> LessonResponse:  # noqa: E741
    attachments = [
        LessonAttachmentResponse(
            id=a.id,
            name=a.name,
            file_url=a.file_url,
            file_type=a.file_type,
            created_at=a.created_at,
        )
        for a in (l.attachments or [])  # type: ignore[attr-defined]
    ]
    return LessonResponse(
        id=l.id,  # type: ignore[attr-defined]
        title=l.title,  # type: ignore[attr-defined]
        content=l.content,  # type: ignore[attr-defined]
        video_url=l.video_url,  # type: ignore[attr-defined]
        order=l.order,  # type: ignore[attr-defined]
        is_published=l.is_published,  # type: ignore[attr-defined]
        course_id=l.course_id,  # type: ignore[attr-defined]
        section_id=l.section_id,  # type: ignore[attr-defined]
        prerequisite_ids=[
            p.prerequisite_lesson_id for p in (getattr(l, "prerequisites", None) or [])
        ],
        created_at=l.created_at,  # type: ignore[attr-defined]
        updated_at=l.updated_at,  # type: ignore[attr-defined]
        attachments=attachments,
    )


def _section_to_response(s: object) -> SectionResponse:
    lessons = [_lesson_to_response(lesson) for lesson in (s.lessons or [])]  # type: ignore[attr-defined]
    return SectionResponse(
        id=s.id,  # type: ignore[attr-defined]
        title=s.title,  # type: ignore[attr-defined]
        description=s.description,  # type: ignore[attr-defined]
        order=s.order,  # type: ignore[attr-defined]
        course_id=s.course_id,  # type: ignore[attr-defined]
        is_published=s.is_published,  # type: ignore[attr-defined]
        created_at=s.created_at,  # type: ignore[attr-defined]
        updated_at=s.updated_at,  # type: ignore[attr-defined]
        lessons=lessons,
    )


def _course_to_response(c: object) -> CourseResponse:
    lesson_count = len(c.lessons) if c.lessons is not None else 0  # type: ignore[attr-defined]
    return CourseResponse(
        id=c.id,  # type: ignore[attr-defined]
        title=c.title,  # type: ignore[attr-defined]
        description=c.description,  # type: ignore[attr-defined]
        cover_image=c.cover_image,  # type: ignore[attr-defined]
        teacher_id=c.teacher_id,  # type: ignore[attr-defined]
        is_published=c.is_published,  # type: ignore[attr-defined]
        category_id=c.category_id,  # type: ignore[attr-defined]
        category=_build_category(c.category),  # type: ignore[attr-defined]
        created_at=c.created_at,  # type: ignore[attr-defined]
        updated_at=c.updated_at,  # type: ignore[attr-defined]
        lesson_count=lesson_count,
    )


def _require_owner(teacher_id: str, current_user_id: str) -> None:
    if teacher_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the course owner can perform this action",
        )


# ---------------------------------------------------------------------------
# Courses
# ---------------------------------------------------------------------------


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
    _require_owner(course.teacher_id, current_user.id)

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
    _require_owner(course.teacher_id, current_user.id)
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
    _require_owner(course.teacher_id, current_user.id)
    updated = await prisma.course.update(
        where={"id": course_id},
        data={"is_published": not course.is_published},
        include=_COURSE_INCLUDE,
    )
    return _course_to_response(updated)


# ---------------------------------------------------------------------------
# Sections
# ---------------------------------------------------------------------------


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
    _require_owner(course.teacher_id, current_user.id)

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
        include={
            "lessons": {
                "include": {"attachments": True, "prerequisites": True},
                "order_by": {"order": "asc"},
            }
        },
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
        _require_owner(course.teacher_id, current_user.id)

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
        include={
            "lessons": {
                "include": {"attachments": True, "prerequisites": True},
                "order_by": {"order": "asc"},
            }
        },
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
        _require_owner(course.teacher_id, current_user.id)
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
    _require_owner(course.teacher_id, current_user.id)

    for item in data.items:
        await prisma.section.update(
            where={"id": item.id},
            data={"order": item.order},
        )

    sections = await prisma.section.find_many(
        where={"course_id": course_id},
        include={
            "lessons": {
                "include": {"attachments": True, "prerequisites": True},
                "order_by": {"order": "asc"},
            }
        },
        order={"order": "asc"},
    )
    return [_section_to_response(s) for s in sections]


# ---------------------------------------------------------------------------
# Lessons
# ---------------------------------------------------------------------------


@router.get("/{course_id}/lessons", response_model=list[LessonResponse])
async def list_lessons(
    course_id: str,
    _: LessonReader,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> list[LessonResponse]:
    course = await prisma.course.find_unique(where={"id": course_id})
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    lessons = await prisma.lesson.find_many(
        where={"course_id": course_id},
        include=_LESSON_INCLUDE,
        order={"order": "asc"},
    )
    return [_lesson_to_response(lesson) for lesson in lessons]


@router.post(
    "/{course_id}/lessons",
    response_model=LessonResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_lesson(
    course_id: str,
    data: LessonCreate,
    current_user: LessonCreator,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> LessonResponse:
    course = await prisma.course.find_unique(where={"id": course_id})
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    _require_owner(course.teacher_id, current_user.id)

    if data.order is None:
        count = await prisma.lesson.count(where={"course_id": course_id})
        order = count
    else:
        order = data.order

    create_data: dict = {
        "title": data.title,
        "content": data.content,
        "video_url": data.video_url,
        "order": order,
        "course_id": course_id,
    }
    if data.section_id is not None:
        create_data["section_id"] = data.section_id

    lesson = await prisma.lesson.create(
        data=create_data,  # type: ignore[arg-type]
        include={"attachments": True},
    )
    for prereq_id in data.prerequisite_ids:
        await prisma.lessonprerequisite.create(
            data={"lesson_id": lesson.id, "prerequisite_lesson_id": prereq_id}
        )
    if data.prerequisite_ids:
        reloaded = await prisma.lesson.find_unique(where={"id": lesson.id}, include=_LESSON_INCLUDE)
        return _lesson_to_response(reloaded)
    return _lesson_to_response(lesson)


@router.get("/{course_id}/lessons/{lesson_id}", response_model=LessonResponse)
async def get_lesson(
    course_id: str,
    lesson_id: str,
    _: LessonReader,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> LessonResponse:
    lesson = await prisma.lesson.find_unique(
        where={"id": lesson_id},
        include=_LESSON_INCLUDE,
    )
    if not lesson or lesson.course_id != course_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    return _lesson_to_response(lesson)


@router.patch("/{course_id}/lessons/{lesson_id}", response_model=LessonResponse)
async def update_lesson(
    course_id: str,
    lesson_id: str,
    data: LessonUpdate,
    current_user: LessonEditor,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> LessonResponse:
    lesson = await prisma.lesson.find_unique(where={"id": lesson_id}, include={"attachments": True})
    if not lesson or lesson.course_id != course_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")

    course = await prisma.course.find_unique(where={"id": course_id})
    if course:
        _require_owner(course.teacher_id, current_user.id)

    update_data: LessonUpdateInput = {}
    if data.title is not None:
        update_data["title"] = data.title
    if data.content is not None:
        update_data["content"] = data.content
    if data.video_url is not None:
        update_data["video_url"] = data.video_url
    if data.order is not None:
        update_data["order"] = data.order
    if data.is_published is not None:
        update_data["is_published"] = data.is_published
    if "section_id" in data.model_fields_set:
        if data.section_id is not None:
            update_data["section"] = {"connect": {"id": data.section_id}}
        else:
            update_data["section"] = {"disconnect": True}
    updated = await prisma.lesson.update(
        where={"id": lesson_id},
        data=update_data,
        include=_LESSON_INCLUDE,
    )
    if "prerequisite_ids" in data.model_fields_set:
        await prisma.lessonprerequisite.delete_many(where={"lesson_id": lesson_id})
        for prereq_id in data.prerequisite_ids or []:
            await prisma.lessonprerequisite.create(
                data={"lesson_id": lesson_id, "prerequisite_lesson_id": prereq_id}
            )
        reloaded = await prisma.lesson.find_unique(where={"id": lesson_id}, include=_LESSON_INCLUDE)
        return _lesson_to_response(reloaded)
    return _lesson_to_response(updated)


@router.delete("/{course_id}/lessons/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lesson(
    course_id: str,
    lesson_id: str,
    current_user: LessonDeleter,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> None:
    lesson = await prisma.lesson.find_unique(where={"id": lesson_id})
    if not lesson or lesson.course_id != course_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    course = await prisma.course.find_unique(where={"id": course_id})
    if course:
        _require_owner(course.teacher_id, current_user.id)
    await prisma.lesson.delete(where={"id": lesson_id})


@router.post("/{course_id}/lessons/reorder", response_model=list[LessonResponse])
async def reorder_lessons(
    course_id: str,
    data: LessonReorderRequest,
    current_user: LessonEditor,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> list[LessonResponse]:
    course = await prisma.course.find_unique(where={"id": course_id})
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    _require_owner(course.teacher_id, current_user.id)

    for item in data.items:
        await prisma.lesson.update(
            where={"id": item.id},
            data={"order": item.order},
        )

    lessons = await prisma.lesson.find_many(
        where={"course_id": course_id},
        include=_LESSON_INCLUDE,
        order={"order": "asc"},
    )
    return [_lesson_to_response(lesson) for lesson in lessons]


# ---------------------------------------------------------------------------
# Lesson Attachments
# ---------------------------------------------------------------------------


@router.post(
    "/{course_id}/lessons/{lesson_id}/attachments",
    response_model=LessonAttachmentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_attachment(
    course_id: str,
    lesson_id: str,
    data: LessonAttachmentCreate,
    current_user: LessonEditor,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> LessonAttachmentResponse:
    lesson = await prisma.lesson.find_unique(where={"id": lesson_id})
    if not lesson or lesson.course_id != course_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    course = await prisma.course.find_unique(where={"id": course_id})
    if course:
        _require_owner(course.teacher_id, current_user.id)

    att = await prisma.lessonattachment.create(
        data={
            "lesson_id": lesson_id,
            "name": data.name,
            "file_url": data.file_url,
            "file_type": data.file_type,
        }
    )
    return LessonAttachmentResponse(
        id=att.id,
        name=att.name,
        file_url=att.file_url,
        file_type=att.file_type,
        created_at=att.created_at,
    )


@router.delete(
    "/{course_id}/lessons/{lesson_id}/attachments/{attachment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_attachment(
    course_id: str,
    lesson_id: str,
    attachment_id: str,
    current_user: LessonEditor,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> None:
    att = await prisma.lessonattachment.find_unique(where={"id": attachment_id})
    if not att or att.lesson_id != lesson_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attachment not found")
    course = await prisma.course.find_unique(where={"id": course_id})
    if course:
        _require_owner(course.teacher_id, current_user.id)
    await prisma.lessonattachment.delete(where={"id": attachment_id})
