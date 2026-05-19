"""Class members API — manage teachers and students in a class."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api._class_utils import _get_class_or_404, _require_class_member
from app.core.database import Prisma, get_prisma
from app.dependencies.auth import CurrentUser, require_permission
from app.schemas.class_ import (
    ClassEnrollmentCreate,
    ClassEnrollmentResponse,
    ClassTeacherAdd,
    ClassTeacherResponse,
)

router = APIRouter(prefix="/classes", tags=["class-members"])

ClassReader = Annotated[CurrentUser, Depends(require_permission("class:read"))]
ClassEditor = Annotated[CurrentUser, Depends(require_permission("class:update"))]
StudentManager = Annotated[CurrentUser, Depends(require_permission("class:manage_students"))]


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
