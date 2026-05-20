"""Lesson Questions API — attach/detach exam questions to a lesson."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api._course_utils import _LESSON_FULL_INCLUDE, _lesson_to_response, _require_owner
from app.core.database import Prisma, get_prisma
from app.dependencies.auth import CurrentUser, require_permission
from app.schemas.lesson_question import (
    LessonQuestionAddRequest,
    LessonQuestionReorderRequest,
    LessonQuestionResponse,
)

router = APIRouter(prefix="/courses", tags=["lesson-questions"])

LessonEditor = Annotated[CurrentUser, Depends(require_permission("lesson:update"))]
LessonReader = Annotated[CurrentUser, Depends(require_permission("lesson:read"))]


async def _get_lesson_or_404(
    course_id: str,
    lesson_id: str,
    prisma: Prisma,
) -> object:
    lesson = await prisma.lesson.find_unique(where={"id": lesson_id})
    if not lesson or lesson.course_id != course_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    return lesson


@router.get(
    "/{course_id}/lessons/{lesson_id}/questions",
    response_model=list[LessonQuestionResponse],
)
async def list_lesson_questions(
    course_id: str,
    lesson_id: str,
    _: LessonReader,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> list[LessonQuestionResponse]:
    await _get_lesson_or_404(course_id, lesson_id, prisma)
    lesson = await prisma.lesson.find_unique(
        where={"id": lesson_id},
        include=_LESSON_FULL_INCLUDE,  # type: ignore[arg-type]
    )
    return _lesson_to_response(lesson).lesson_questions


@router.post(
    "/{course_id}/lessons/{lesson_id}/questions",
    response_model=list[LessonQuestionResponse],
    status_code=status.HTTP_201_CREATED,
)
async def add_lesson_questions(
    course_id: str,
    lesson_id: str,
    data: LessonQuestionAddRequest,
    current_user: LessonEditor,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> list[LessonQuestionResponse]:
    await _get_lesson_or_404(course_id, lesson_id, prisma)
    course = await prisma.course.find_unique(where={"id": course_id})
    if course:
        _require_owner(course.teacher_id, current_user.id)

    if not data.question_ids:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="question_ids must not be empty",
        )

    # Validate all question IDs exist
    for qid in data.question_ids:
        q = await prisma.question.find_unique(where={"id": qid})
        if not q:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Question {qid} not found",
            )

    # Determine starting order (append after existing)
    current_count = await prisma.lessonquestion.count(where={"lesson_id": lesson_id})
    records = [
        {"lesson_id": lesson_id, "question_id": qid, "order": current_count + i}
        for i, qid in enumerate(data.question_ids)
    ]
    await prisma.lessonquestion.create_many(
        data=records,  # type: ignore[arg-type]
        skip_duplicates=True,
    )

    reloaded = await prisma.lesson.find_unique(
        where={"id": lesson_id},
        include=_LESSON_FULL_INCLUDE,  # type: ignore[arg-type]
    )
    return _lesson_to_response(reloaded).lesson_questions


@router.delete(
    "/{course_id}/lessons/{lesson_id}/questions/{question_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def remove_lesson_question(
    course_id: str,
    lesson_id: str,
    question_id: str,
    current_user: LessonEditor,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> None:
    await _get_lesson_or_404(course_id, lesson_id, prisma)
    course = await prisma.course.find_unique(where={"id": course_id})
    if course:
        _require_owner(course.teacher_id, current_user.id)

    lq = await prisma.lessonquestion.find_first(
        where={"lesson_id": lesson_id, "question_id": question_id}
    )
    if not lq:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not in lesson")
    await prisma.lessonquestion.delete(where={"id": lq.id})


@router.post(
    "/{course_id}/lessons/{lesson_id}/questions/reorder",
    response_model=list[LessonQuestionResponse],
)
async def reorder_lesson_questions(
    course_id: str,
    lesson_id: str,
    data: LessonQuestionReorderRequest,
    current_user: LessonEditor,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> list[LessonQuestionResponse]:
    await _get_lesson_or_404(course_id, lesson_id, prisma)
    course = await prisma.course.find_unique(where={"id": course_id})
    if course:
        _require_owner(course.teacher_id, current_user.id)

    for item in data.items:
        await prisma.lessonquestion.update(
            where={"id": item.id},
            data={"order": item.order},
        )

    reloaded = await prisma.lesson.find_unique(
        where={"id": lesson_id},
        include=_LESSON_FULL_INCLUDE,  # type: ignore[arg-type]
    )
    return _lesson_to_response(reloaded).lesson_questions
