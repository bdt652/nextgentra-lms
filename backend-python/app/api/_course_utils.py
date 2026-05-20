"""Shared helpers for courses, sections and lessons routers."""

from typing import TYPE_CHECKING, Optional

from fastapi import HTTPException, status

from app.schemas.category import CategorySummary

if TYPE_CHECKING:
    from app.dependencies.auth import CurrentUser
from app.schemas.course import CourseResponse
from app.schemas.lesson import LessonAttachmentResponse, LessonResponse
from app.schemas.lesson_question import LessonQuestionResponse, QuestionBrief
from app.schemas.section import SectionResponse
from prisma.types import CourseInclude, LessonInclude

_COURSE_INCLUDE: CourseInclude = {"lessons": True, "category": True}

_LESSON_INCLUDE: LessonInclude = {"attachments": True, "prerequisites": True}

# Full include used for single-lesson get/update — includes questions with exam info
_LESSON_FULL_INCLUDE = {
    "attachments": True,
    "prerequisites": True,
    "lesson_questions": {
        "include": {"question": {"include": {"exam": True}}},
        "order_by": {"order": "asc"},
    },
}

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
    lesson_questions = [
        LessonQuestionResponse(
            id=lq.id,
            lesson_id=lq.lesson_id,
            question_id=lq.question_id,
            order=lq.order,
            created_at=lq.created_at,
            question=QuestionBrief(
                id=lq.question.id,
                content=lq.question.content,
                type=lq.question.type,
                points=lq.question.points,
                exam_id=lq.question.exam_id,
                exam_title=lq.question.exam.title if lq.question.exam else None,
            ),
        )
        for lq in (getattr(l, "lesson_questions", None) or [])
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
        lesson_questions=lesson_questions,
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


def _require_owner(teacher_id: str, current_user: "CurrentUser") -> None:
    if "admin:access" in current_user.permissions:
        return
    if teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the course owner can perform this action",
        )
