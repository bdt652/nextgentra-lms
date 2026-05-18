"""Classes API — manage classrooms, teachers, students, courses, and exams."""

import secrets
import string
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.database import Prisma, get_prisma
from app.dependencies.auth import CurrentUser, require_permission
from app.schemas.category import CategorySummary
from app.schemas.class_ import (
    ClassCourseCreate,
    ClassCreate,
    ClassDetailResponse,
    ClassEnrollmentCreate,
    ClassEnrollmentResponse,
    ClassExamCreate,
    ClassExamResponse,
    ClassResponse,
    ClassTeacherAdd,
    ClassTeacherResponse,
    ClassUpdate,
)
from app.schemas.course import CourseResponse
from prisma.types import ClassroomUpdateInput

router = APIRouter(prefix="/classes", tags=["classes"])

ClassReader = Annotated[CurrentUser, Depends(require_permission("class:read"))]
ClassCreator = Annotated[CurrentUser, Depends(require_permission("class:create"))]
ClassEditor = Annotated[CurrentUser, Depends(require_permission("class:update"))]
ClassDeleter = Annotated[CurrentUser, Depends(require_permission("class:delete"))]
StudentManager = Annotated[CurrentUser, Depends(require_permission("class:manage_students"))]
CourseManager = Annotated[CurrentUser, Depends(require_permission("class:manage_courses"))]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


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


# ---------------------------------------------------------------------------
# Classes
# ---------------------------------------------------------------------------


@router.get("", response_model=list[ClassResponse])
async def list_classes(
    current_user: ClassReader,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> list[ClassResponse]:
    class_teachers = await prisma.classteacher.find_many(
        where={"teacher_id": current_user.id},
    )
    class_ids = [ct.class_id for ct in class_teachers]
    classes = await prisma.classroom.find_many(
        where={"id": {"in": class_ids}},
        include={"teachers": True, "enrollments": True, "category": True},
        order={"created_at": "desc"},
    )
    return [_class_to_response(c) for c in classes]


@router.post("", response_model=ClassResponse, status_code=status.HTTP_201_CREATED)
async def create_class(
    data: ClassCreate,
    current_user: ClassCreator,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> ClassResponse:
    code = _generate_class_code()
    while await prisma.classroom.find_unique(where={"code": code}):
        code = _generate_class_code()

    cls = await prisma.classroom.create(
        data={
            "name": data.name,
            "description": data.description,
            "code": code,
            "category_id": data.category_id,
            "teachers": {"create": [{"teacher_id": current_user.id, "role": "owner"}]},
        },
        include={"teachers": True, "enrollments": True, "category": True},
    )
    return _class_to_response(cls)


@router.get("/{class_id}", response_model=ClassDetailResponse)
async def get_class(
    class_id: str,
    current_user: ClassReader,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> ClassDetailResponse:
    cls = await prisma.classroom.find_unique(
        where={"id": class_id},
        include={
            "teachers": {"include": {"teacher": True}},
            "enrollments": {"include": {"student": True}},
            "class_courses": {"include": {"course": {"include": {"lessons": True}}}},
            "class_exams": {"include": {"exam": True}},
            "category": True,
        },
    )
    if not cls:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")

    _require_class_member(cls, current_user.id)

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
            lesson_count = len(cc.course.lessons) if cc.course.lessons else 0
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
                    lesson_count=lesson_count,
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
        category_id=cls.category_id,
        category=_build_category(cls.category),
        created_at=cls.created_at,
        updated_at=cls.updated_at,
        teacher_count=len(teachers),
        student_count=len(cls.enrollments or []),
        teachers=teachers,
        courses=courses,
        exams=exams,
    )


@router.patch("/{class_id}", response_model=ClassResponse)
async def update_class(
    class_id: str,
    data: ClassUpdate,
    current_user: ClassEditor,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> ClassResponse:
    cls = await _get_class_or_404(class_id, prisma)
    _require_class_member(cls, current_user.id)

    update_data: ClassroomUpdateInput = {}
    if data.name is not None:
        update_data["name"] = data.name
    if data.description is not None:
        update_data["description"] = data.description
    if data.category_id is not None:
        update_data["category"] = {"connect": {"id": data.category_id}}

    updated = await prisma.classroom.update(
        where={"id": class_id},
        data=update_data,
        include={"teachers": True, "enrollments": True, "category": True},
    )
    return _class_to_response(updated)


@router.delete("/{class_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_class(
    class_id: str,
    current_user: ClassDeleter,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> None:
    cls = await _get_class_or_404(class_id, prisma)
    _require_class_member(cls, current_user.id)
    await prisma.classroom.delete(where={"id": class_id})


# ---------------------------------------------------------------------------
# Teachers in Class
# ---------------------------------------------------------------------------


@router.get("/{class_id}/teachers", response_model=list[ClassTeacherResponse])
async def list_class_teachers(
    class_id: str,
    current_user: ClassReader,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> list[ClassTeacherResponse]:
    cls = await _get_class_or_404(class_id, prisma)
    _require_class_member(cls, current_user.id)

    members = await prisma.classteacher.find_many(
        where={"class_id": class_id},
        include={"teacher": True},
    )
    return [
        ClassTeacherResponse(
            teacher_id=m.teacher_id,
            name=m.teacher.name,
            email=m.teacher.email,
            role=m.role,
            joined_at=m.joined_at,
        )
        for m in members
        if m.teacher
    ]


@router.post(
    "/{class_id}/teachers",
    response_model=ClassTeacherResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_class_teacher(
    class_id: str,
    data: ClassTeacherAdd,
    current_user: ClassEditor,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> ClassTeacherResponse:
    cls = await _get_class_or_404(class_id, prisma)
    _require_class_member(cls, current_user.id)

    teacher = await prisma.teacher.find_unique(where={"id": data.teacher_id})
    if not teacher:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found")

    existing = await prisma.classteacher.find_unique(
        where={"class_id_teacher_id": {"class_id": class_id, "teacher_id": data.teacher_id}}
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Teacher is already a member of this class",
        )

    ct = await prisma.classteacher.create(
        data={
            "class_id": class_id,
            "teacher_id": data.teacher_id,
            "role": data.role or "assistant",
        }
    )
    return ClassTeacherResponse(
        teacher_id=ct.teacher_id,
        name=teacher.name,
        email=teacher.email,
        role=ct.role,
        joined_at=ct.joined_at,
    )


@router.delete("/{class_id}/teachers/{teacher_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_class_teacher(
    class_id: str,
    teacher_id: str,
    current_user: ClassEditor,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> None:
    cls = await _get_class_or_404(class_id, prisma)
    _require_class_member(cls, current_user.id)

    ct = await prisma.classteacher.find_unique(
        where={"class_id_teacher_id": {"class_id": class_id, "teacher_id": teacher_id}}
    )
    if not ct:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found in class"
        )
    if ct.role == "owner":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove the class owner",
        )
    await prisma.classteacher.delete(
        where={"class_id_teacher_id": {"class_id": class_id, "teacher_id": teacher_id}}
    )


# ---------------------------------------------------------------------------
# Students (Enrollments)
# ---------------------------------------------------------------------------


@router.get("/{class_id}/students", response_model=list[ClassEnrollmentResponse])
async def list_students(
    class_id: str,
    current_user: ClassReader,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> list[ClassEnrollmentResponse]:
    cls = await _get_class_or_404(class_id, prisma)
    _require_class_member(cls, current_user.id)

    enrollments = await prisma.classenrollment.find_many(
        where={"class_id": class_id},
        include={"student": True},
        order={"enrolled_at": "asc"},
    )
    return [
        ClassEnrollmentResponse(
            student_id=e.student_id,
            name=e.student.name,
            email=e.student.email,
            enrolled_at=e.enrolled_at,
        )
        for e in enrollments
        if e.student
    ]


@router.post(
    "/{class_id}/students",
    response_model=ClassEnrollmentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def enroll_student(
    class_id: str,
    data: ClassEnrollmentCreate,
    current_user: StudentManager,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> ClassEnrollmentResponse:
    cls = await _get_class_or_404(class_id, prisma)
    _require_class_member(cls, current_user.id)

    student = await prisma.student.find_unique(where={"id": data.student_id})
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    existing = await prisma.classenrollment.find_unique(
        where={"class_id_student_id": {"class_id": class_id, "student_id": data.student_id}}
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Student is already enrolled in this class",
        )

    enrollment = await prisma.classenrollment.create(
        data={"class_id": class_id, "student_id": data.student_id}
    )
    return ClassEnrollmentResponse(
        student_id=enrollment.student_id,
        name=student.name,
        email=student.email,
        enrolled_at=enrollment.enrolled_at,
    )


@router.delete("/{class_id}/students/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_student(
    class_id: str,
    student_id: str,
    current_user: StudentManager,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> None:
    cls = await _get_class_or_404(class_id, prisma)
    _require_class_member(cls, current_user.id)

    enrollment = await prisma.classenrollment.find_unique(
        where={"class_id_student_id": {"class_id": class_id, "student_id": student_id}}
    )
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Student not enrolled in this class"
        )
    await prisma.classenrollment.delete(
        where={"class_id_student_id": {"class_id": class_id, "student_id": student_id}}
    )


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
