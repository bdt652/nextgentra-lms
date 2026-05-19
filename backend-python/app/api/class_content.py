"""Class content API — manage courses and exams assigned to a class."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api._class_utils import _get_class_or_404, _require_class_member
from app.core.database import Prisma, get_prisma
from app.dependencies.auth import CurrentUser, require_permission
from app.schemas.class_ import ClassCourseCreate, ClassExamCreate, ClassExamResponse
from app.schemas.course import CourseResponse

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
        order={"assigned_at": "asc"},
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

    await prisma.classcourse.create(data={"class_id": class_id, "course_id": course_id})
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


@router.delete("/{class_id}/courses/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unassign_course(
    class_id: str,
    course_id: str,
    current_user: CourseManager,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> None:
    cls = await _get_class_or_404(class_id, prisma)
    _require_class_member(cls, current_user.id)

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
        order={"assigned_at": "asc"},
    )
    return [
        ClassExamResponse(
            exam_id=ce.exam_id,
            title=ce.exam.title if ce.exam else "",
            duration=ce.exam.duration if ce.exam else None,
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

    ce = await prisma.classexam.create(
        data={
            "class_id": class_id,
            "exam_id": data.exam_id,
            "start_time": data.start_time,
            "end_time": data.end_time,
        }
    )
    return ClassExamResponse(
        exam_id=ce.exam_id,
        title=exam.title,
        duration=exam.duration,
        start_time=ce.start_time,
        end_time=ce.end_time,
        assigned_at=ce.assigned_at,
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
