"""Student Portal API — read-only access for enrolled students."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.database import get_prisma
from app.dependencies.auth import CurrentUser, get_current_student
from app.schemas.class_ import ClassDetailResponse, ClassExamResponse, ClassResponse
from app.schemas.course import CourseDetailResponse, CourseResponse
from app.schemas.lesson import LessonAttachmentResponse, LessonResponse
from prisma import Prisma

router = APIRouter(prefix="/student", tags=["student-portal"])

CurrentStudent = Annotated[CurrentUser, Depends(get_current_student)]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


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
        created_at=l.created_at,  # type: ignore[attr-defined]
        updated_at=l.updated_at,  # type: ignore[attr-defined]
        attachments=attachments,
    )


async def _assert_enrolled(class_id: str, student_id: str, prisma: Prisma) -> None:
    enrollment = await prisma.classenrollment.find_unique(
        where={"class_id_student_id": {"class_id": class_id, "student_id": student_id}}
    )
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not enrolled in this class",
        )


# ---------------------------------------------------------------------------
# Student Portal Endpoints
# ---------------------------------------------------------------------------


@router.get("/classes", response_model=list[ClassResponse])
async def my_classes(
    current_student: CurrentStudent,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> list[ClassResponse]:
    enrollments = await prisma.classenrollment.find_many(
        where={"student_id": current_student.id},
    )
    class_ids = [e.class_id for e in enrollments]
    classes = await prisma.classroom.find_many(
        where={"id": {"in": class_ids}},
        include={"teachers": True, "enrollments": True},
        order={"created_at": "desc"},
    )
    return [
        ClassResponse(
            id=c.id,
            name=c.name,
            description=c.description,
            code=c.code,
            created_at=c.created_at,
            updated_at=c.updated_at,
            teacher_count=len(c.teachers or []),
            student_count=len(c.enrollments or []),
        )
        for c in classes
    ]


@router.get("/classes/{class_id}", response_model=ClassDetailResponse)
async def get_class(
    class_id: str,
    current_student: CurrentStudent,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> ClassDetailResponse:
    await _assert_enrolled(class_id, current_student.id, prisma)

    cls = await prisma.classroom.find_unique(
        where={"id": class_id},
        include={
            "teachers": {"include": {"teacher": True}},
            "enrollments": True,
            "class_courses": {"include": {"course": {"include": {"lessons": True}}}},
            "class_exams": {"include": {"exam": True}},
        },
    )
    if not cls:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")

    from app.schemas.class_ import ClassTeacherResponse

    teachers = [
        ClassTeacherResponse(
            teacher_id=ct.teacher_id,
            name=ct.teacher.name,
            email=ct.teacher.email,
            role=ct.role,
            joined_at=ct.joined_at,
        )
        for ct in (cls.teachers or [])
        if ct.teacher
    ]
    courses = []
    for cc in cls.class_courses or []:
        if cc.course:
            courses.append(
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
    exams = [
        ClassExamResponse(
            exam_id=ce.exam_id,
            title=ce.exam.title if ce.exam else "",
            duration=ce.exam.duration if ce.exam else None,
            start_time=ce.start_time,
            end_time=ce.end_time,
            assigned_at=ce.assigned_at,
        )
        for ce in (cls.class_exams or [])
        if ce.exam
    ]
    return ClassDetailResponse(
        id=cls.id,
        name=cls.name,
        description=cls.description,
        code=cls.code,
        created_at=cls.created_at,
        updated_at=cls.updated_at,
        teacher_count=len(teachers),
        student_count=len(cls.enrollments or []),
        teachers=teachers,
        courses=courses,
        exams=exams,
    )


@router.get("/classes/{class_id}/courses", response_model=list[CourseResponse])
async def get_class_courses(
    class_id: str,
    current_student: CurrentStudent,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> list[CourseResponse]:
    await _assert_enrolled(class_id, current_student.id, prisma)

    class_courses = await prisma.classcourse.find_many(
        where={"class_id": class_id},
        include={"course": {"include": {"lessons": True}}},
        order={"assigned_at": "asc"},
    )
    return [
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
        for cc in class_courses
        if cc.course
    ]


@router.get("/courses/{course_id}", response_model=CourseDetailResponse)
async def get_course(
    course_id: str,
    current_student: CurrentStudent,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> CourseDetailResponse:
    class_course = await prisma.classcourse.find_first(
        where={
            "course_id": course_id,
            "classroom": {
                "is": {"enrollments": {"some": {"student_id": current_student.id}}}
            },
        }
    )
    if not class_course:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this course",
        )

    course = await prisma.course.find_unique(
        where={"id": course_id},
        include={
            "lessons": {
                "where": {"is_published": True},
                "include": {"attachments": True},
                "order_by": {"order": "asc"},
            }
        },
    )
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    lessons = [_lesson_to_response(lesson) for lesson in (course.lessons or [])]
    return CourseDetailResponse(
        id=course.id,
        title=course.title,
        description=course.description,
        cover_image=course.cover_image,
        teacher_id=course.teacher_id,
        is_published=course.is_published,
        category_id=course.category_id,
        created_at=course.created_at,
        updated_at=course.updated_at,
        lesson_count=len(lessons),
        lessons=lessons,
    )


@router.get("/courses/{course_id}/lessons/{lesson_id}", response_model=LessonResponse)
async def get_lesson(
    course_id: str,
    lesson_id: str,
    current_student: CurrentStudent,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> LessonResponse:
    class_course = await prisma.classcourse.find_first(
        where={
            "course_id": course_id,
            "classroom": {
                "is": {"enrollments": {"some": {"student_id": current_student.id}}}
            },
        }
    )
    if not class_course:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this course",
        )

    lesson = await prisma.lesson.find_unique(
        where={"id": lesson_id},
        include={"attachments": True},
    )
    if not lesson or lesson.course_id != course_id or not lesson.is_published:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")

    return _lesson_to_response(lesson)
