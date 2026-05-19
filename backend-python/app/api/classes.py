"""Classes API — CRUD for classrooms."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api._class_utils import (
    _build_category,
    _class_to_response,
    _generate_class_code,
    _get_class_or_404,
    _require_class_member,
)
from app.core.database import Prisma, get_prisma
from app.dependencies.auth import CurrentUser, require_permission
from app.schemas.class_ import (
    ClassCreate,
    ClassDetailResponse,
    ClassExamResponse,
    ClassResponse,
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
