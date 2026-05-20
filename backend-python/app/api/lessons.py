"""Lessons API — CRUD for course lessons and attachments."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api._course_utils import (
    _LESSON_FULL_INCLUDE,
    _LESSON_INCLUDE,
    _lesson_to_response,
    _require_owner,
)
from app.core.database import Prisma, get_prisma
from app.dependencies.auth import CurrentUser, require_permission
from app.schemas.lesson import (
    LessonAttachmentCreate,
    LessonAttachmentResponse,
    LessonCreate,
    LessonReorderRequest,
    LessonResponse,
    LessonUpdate,
)
from prisma.types import LessonUpdateInput

router = APIRouter(prefix="/courses", tags=["lessons"])

LessonReader = Annotated[CurrentUser, Depends(require_permission("lesson:read"))]
LessonCreator = Annotated[CurrentUser, Depends(require_permission("lesson:create"))]
LessonEditor = Annotated[CurrentUser, Depends(require_permission("lesson:update"))]
LessonDeleter = Annotated[CurrentUser, Depends(require_permission("lesson:delete"))]


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
        include=_LESSON_FULL_INCLUDE,  # type: ignore[arg-type]
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
        include=_LESSON_FULL_INCLUDE,  # type: ignore[arg-type]
    )
    if "prerequisite_ids" in data.model_fields_set:
        await prisma.lessonprerequisite.delete_many(where={"lesson_id": lesson_id})
        for prereq_id in data.prerequisite_ids or []:
            await prisma.lessonprerequisite.create(
                data={"lesson_id": lesson_id, "prerequisite_lesson_id": prereq_id}
            )
        reloaded = await prisma.lesson.find_unique(
            where={"id": lesson_id},
            include=_LESSON_FULL_INCLUDE,  # type: ignore[arg-type]
        )
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
