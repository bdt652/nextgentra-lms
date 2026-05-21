"""Class content API — manage courses and exams assigned to a class."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api._class_utils import _get_class_or_404, _require_class_member, _require_not_ta
from app.core.database import Prisma, get_prisma
from app.dependencies.auth import CurrentUser, require_permission
from app.schemas.class_ import (
    ClassCourseCreate,
    ClassExamCreate,
    ClassExamResponse,
    ClassExamUpdate,
    ReorderRequest,
)
from app.schemas.course import CourseResponse
from prisma.types import ClassExamUpdateInput

router = APIRouter(prefix="/classes", tags=["class-content"])

ClassReader = Annotated[CurrentUser, Depends(require_permission("class:read"))]
CourseManager = Annotated[CurrentUser, Depends(require_permission("class:manage_courses"))]


# ---------------------------------------------------------------------------
# Courses in Class
# ---------------------------------------------------------------------------


@router.get("/{class_id}/courses", response_model=list[CourseResponse])
async def list_class_courses(
    class_id: str,
    current_user: ClassReader,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> list[CourseResponse]:
    cls = await _get_class_or_404(class_id, prisma)
    _require_class_member(cls, current_user.id)

    class_courses = await prisma.classcourse.find_many(
        where={"class_id": class_id},
        include={"course": {"include": {"lessons": True}}},
        order={"position": "asc"},
    )
    result = []
    for cc in class_courses:
        if cc.course:
            result.append(
                CourseResponse(
                    id=cc.course.id,
                    title=cc.course.title,
                    description=cc.course.description,
                    cover_image=cc.course.cover_image,
                    teacher_id=cc.course.teacher_id,
                    is_published=cc.course.is_published,
                    category_id=cc.course.category_id,
                    created_at=cc.course.created_at,
                    updated_at=cc.course.updated_at,
                    lesson_count=len(cc.course.lessons or []),
                )
            )
    return result


@router.post(
    "/{class_id}/courses",
    response_model=CourseResponse,
    status_code=status.HTTP_201_CREATED,
)
async def assign_course(
    class_id: str,
    data: ClassCourseCreate,
    current_user: CourseManager,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> CourseResponse:
    course_id = data.course_id
    cls = await _get_class_or_404(class_id, prisma)
    _require_class_member(cls, current_user.id)
    _require_not_ta(cls, current_user.id)

    course = await prisma.course.find_unique(where={"id": course_id}, include={"lessons": True})
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    existing = await prisma.classcourse.find_unique(
        where={"class_id_course_id": {"class_id": class_id, "course_id": course_id}}
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Course already assigned to this class",
        )

    count = await prisma.classcourse.count(where={"class_id": class_id})
    await prisma.classcourse.create(
        data={"class_id": class_id, "course_id": course_id, "position": count}
    )
    return CourseResponse(
        id=course.id,
        title=course.title,
        description=course.description,
        cover_image=course.cover_image,
        teacher_id=course.teacher_id,
        is_published=course.is_published,
        category_id=course.category_id,
        created_at=course.created_at,
        updated_at=course.updated_at,
        lesson_count=len(course.lessons or []),
    )


@router.patch("/{class_id}/courses/reorder", status_code=status.HTTP_204_NO_CONTENT)
async def reorder_courses(
    class_id: str,
    data: ReorderRequest,
    current_user: CourseManager,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> None:
    cls = await _get_class_or_404(class_id, prisma)
    _require_class_member(cls, current_user.id)
    _require_not_ta(cls, current_user.id)
    for position, course_id in enumerate(data.ids):
        await prisma.classcourse.update_many(
            where={"class_id": class_id, "course_id": course_id},
            data={"position": position},
        )


@router.delete("/{class_id}/courses/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unassign_course(
    class_id: str,
    course_id: str,
    current_user: CourseManager,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> None:
    cls = await _get_class_or_404(class_id, prisma)
    _require_class_member(cls, current_user.id)
    _require_not_ta(cls, current_user.id)

    cc = await prisma.classcourse.find_unique(
        where={"class_id_course_id": {"class_id": class_id, "course_id": course_id}}
    )
    if not cc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not assigned to this class",
        )
    await prisma.classcourse.delete(
        where={"class_id_course_id": {"class_id": class_id, "course_id": course_id}}
    )


# ---------------------------------------------------------------------------
# Exams in Class
# ---------------------------------------------------------------------------


@router.get("/{class_id}/exams", response_model=list[ClassExamResponse])
async def list_class_exams(
    class_id: str,
    current_user: ClassReader,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> list[ClassExamResponse]:
    cls = await _get_class_or_404(class_id, prisma)
    _require_class_member(cls, current_user.id)

    class_exams = await prisma.classexam.find_many(
        where={"class_id": class_id},
        include={"exam": True},
        order={"position": "asc"},
    )
    return [
        ClassExamResponse(
            exam_id=ce.exam_id,
            title=ce.exam.title if ce.exam else "",
            display_name=ce.display_name,
            duration=ce.exam.duration if ce.exam else None,
            shuffle_questions=ce.shuffle_questions,
            question_limit=ce.question_limit,
            start_time=ce.start_time,
            end_time=ce.end_time,
            assigned_at=ce.assigned_at,
        )
        for ce in class_exams
        if ce.exam
    ]


@router.post(
    "/{class_id}/exams",
    response_model=ClassExamResponse,
    status_code=status.HTTP_201_CREATED,
)
async def assign_exam(
    class_id: str,
    data: ClassExamCreate,
    current_user: CourseManager,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> ClassExamResponse:
    cls = await _get_class_or_404(class_id, prisma)
    _require_class_member(cls, current_user.id)
    _require_not_ta(cls, current_user.id)

    exam = await prisma.exam.find_unique(where={"id": data.exam_id})
    if not exam:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found")

    existing = await prisma.classexam.find_unique(
        where={"class_id_exam_id": {"class_id": class_id, "exam_id": data.exam_id}}
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Exam already assigned to this class",
        )

    exam_count = await prisma.classexam.count(where={"class_id": class_id})
    ce = await prisma.classexam.create(
        data={
            "class_id": class_id,
            "exam_id": data.exam_id,
            "display_name": data.display_name,
            "shuffle_questions": data.shuffle_questions,
            "question_limit": data.question_limit,
            "position": exam_count,
            "start_time": data.start_time,
            "end_time": data.end_time,
        }
    )
    return ClassExamResponse(
        exam_id=ce.exam_id,
        title=exam.title,
        display_name=ce.display_name,
        duration=exam.duration,
        shuffle_questions=ce.shuffle_questions,
        question_limit=ce.question_limit,
        start_time=ce.start_time,
        end_time=ce.end_time,
        assigned_at=ce.assigned_at,
    )


@router.patch("/{class_id}/exams/{exam_id}", response_model=ClassExamResponse)
async def update_class_exam(
    class_id: str,
    exam_id: str,
    data: ClassExamUpdate,
    current_user: CourseManager,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> ClassExamResponse:
    cls = await _get_class_or_404(class_id, prisma)
    _require_class_member(cls, current_user.id)
    _require_not_ta(cls, current_user.id)

    ce = await prisma.classexam.find_unique(
        where={"class_id_exam_id": {"class_id": class_id, "exam_id": exam_id}},
        include={"exam": True},
    )
    if not ce:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam not assigned to this class",
        )

    update_data: ClassExamUpdateInput = {}
    if data.display_name is not None:
        update_data["display_name"] = data.display_name
    if data.shuffle_questions is not None:
        update_data["shuffle_questions"] = data.shuffle_questions
    if data.question_limit is not None:
        update_data["question_limit"] = data.question_limit
    if data.start_time is not None:
        update_data["start_time"] = data.start_time
    if data.end_time is not None:
        update_data["end_time"] = data.end_time

    updated = await prisma.classexam.update(
        where={"class_id_exam_id": {"class_id": class_id, "exam_id": exam_id}},
        data=update_data,
    )
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found")
    exam = ce.exam
    return ClassExamResponse(
        exam_id=updated.exam_id,
        title=exam.title if exam else "",
        display_name=updated.display_name,
        duration=exam.duration if exam else None,
        shuffle_questions=updated.shuffle_questions,
        question_limit=updated.question_limit,
        start_time=updated.start_time,
        end_time=updated.end_time,
        assigned_at=updated.assigned_at,
    )


@router.delete("/{class_id}/exams/{exam_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unassign_exam(
    class_id: str,
    exam_id: str,
    current_user: CourseManager,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> None:
    cls = await _get_class_or_404(class_id, prisma)
    _require_class_member(cls, current_user.id)
    _require_not_ta(cls, current_user.id)

    ce = await prisma.classexam.find_unique(
        where={"class_id_exam_id": {"class_id": class_id, "exam_id": exam_id}}
    )
    if not ce:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam not assigned to this class",
        )
    await prisma.classexam.delete(
        where={"class_id_exam_id": {"class_id": class_id, "exam_id": exam_id}}
    )


@router.patch("/{class_id}/exams/reorder", status_code=status.HTTP_204_NO_CONTENT)
async def reorder_exams(
    class_id: str,
    data: ReorderRequest,
    current_user: CourseManager,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> None:
    cls = await _get_class_or_404(class_id, prisma)
    _require_class_member(cls, current_user.id)
    _require_not_ta(cls, current_user.id)
    for position, exam_id in enumerate(data.ids):
        await prisma.classexam.update_many(
            where={"class_id": class_id, "exam_id": exam_id},
            data={"position": position},
        )
