"""Admin API — role & permission management (requires admin:access)."""

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.auth import get_password_hash
from app.core.database import Prisma, get_prisma
from app.dependencies.auth import CurrentUser, require_permission
from app.schemas.import_ import ImportResult, ImportRowError
from app.schemas.permission import PermissionResponse
from app.schemas.role import RoleCreate, RolePermissionsRequest, RoleResponse, RoleUpdate
from app.schemas.student import (
    StudentAdminResponse,
    StudentCreate,
    StudentImportRequest,
    StudentUpdate,
)
from app.schemas.teacher import (
    AssignRoleRequest,
    ResetPasswordRequest,
    TeacherAdminResponse,
    TeacherImportRequest,
    TeacherUpdate,
)
from prisma.models import Permission, Role, Student, Teacher
from prisma.types import StudentUpdateInput, TeacherUpdateInput

router = APIRouter(prefix="/admin", tags=["admin"])

AdminUser = Annotated[CurrentUser, Depends(require_permission("admin:access"))]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _teacher_to_admin_response(t: Teacher) -> TeacherAdminResponse:
    role_name = t.role.name if t.role else None
    permissions = [p.name for p in (t.role.permissions or [])] if t.role else []
    return TeacherAdminResponse(
        id=t.id,
        email=t.email,
        name=t.name,
        is_active=t.is_active,
        created_at=t.created_at,
        role_id=t.role_id,
        role=role_name,
        permissions=permissions,
    )


def _role_to_response(r: Role) -> RoleResponse:
    perms = [PermissionResponse(id=p.id, name=p.name) for p in (r.permissions or [])]
    return RoleResponse(id=r.id, name=r.name, description=r.description, permissions=perms)


def _perm_to_response(p: Permission) -> PermissionResponse:
    return PermissionResponse(id=p.id, name=p.name)


# ---------------------------------------------------------------------------
# Teachers
# ---------------------------------------------------------------------------


@router.get("/teachers", response_model=list[TeacherAdminResponse])
async def list_teachers(
    _: AdminUser,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> list[TeacherAdminResponse]:
    """List all teachers with their current role and permissions."""
    teachers = await prisma.teacher.find_many(
        include={"role": {"include": {"permissions": True}}},
        order={"created_at": "desc"},
    )
    return [_teacher_to_admin_response(t) for t in teachers]


@router.patch("/teachers/{teacher_id}/role", response_model=TeacherAdminResponse)
async def assign_teacher_role(
    teacher_id: str,
    data: AssignRoleRequest,
    _: AdminUser,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> TeacherAdminResponse:
    """Assign or remove a role from a teacher. Pass role_id=null to remove."""
    teacher = await prisma.teacher.find_unique(where={"id": teacher_id})
    if not teacher:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found")

    if data.role_id is None:
        updated = await prisma.teacher.update(
            where={"id": teacher_id},
            data={"role": {"disconnect": True}},
            include={"role": {"include": {"permissions": True}}},
        )
    else:
        role = await prisma.role.find_unique(where={"id": data.role_id})
        if not role:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
        updated = await prisma.teacher.update(
            where={"id": teacher_id},
            data={"role": {"connect": {"id": data.role_id}}},
            include={"role": {"include": {"permissions": True}}},
        )

    if not updated:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Update failed"
        )
    return _teacher_to_admin_response(updated)


@router.patch("/teachers/{teacher_id}", response_model=TeacherAdminResponse)
async def update_teacher(
    teacher_id: str,
    data: TeacherUpdate,
    _: AdminUser,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> TeacherAdminResponse:
    """Update teacher info (name, email, is_active). Email must remain unique."""
    teacher = await prisma.teacher.find_unique(where={"id": teacher_id})
    if not teacher:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found")

    if data.email is not None and data.email != teacher.email:
        existing = await prisma.teacher.find_unique(where={"email": data.email})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already in use by another teacher",
            )

    update_data: TeacherUpdateInput = {}
    if data.name is not None:
        update_data["name"] = data.name
    if data.email is not None:
        update_data["email"] = data.email
    if data.is_active is not None:
        update_data["is_active"] = data.is_active

    updated = await prisma.teacher.update(
        where={"id": teacher_id},
        data=update_data,
        include={"role": {"include": {"permissions": True}}},
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Update failed"
        )
    return _teacher_to_admin_response(updated)


@router.post("/teachers/{teacher_id}/reset-password", status_code=status.HTTP_204_NO_CONTENT)
async def reset_teacher_password(
    teacher_id: str,
    data: ResetPasswordRequest,
    _: AdminUser,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> None:
    """Admin resets a teacher's password. Returns 204 on success."""
    teacher = await prisma.teacher.find_unique(where={"id": teacher_id})
    if not teacher:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found")

    await prisma.teacher.update(
        where={"id": teacher_id},
        data={"hashed_password": get_password_hash(data.new_password)},
    )


# ---------------------------------------------------------------------------
# Roles
# ---------------------------------------------------------------------------


@router.get("/roles", response_model=list[RoleResponse])
async def list_roles(
    _: AdminUser,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> list[RoleResponse]:
    """List all roles with their permissions."""
    roles = await prisma.role.find_many(
        include={"permissions": True},
        order={"name": "asc"},
    )
    return [_role_to_response(r) for r in roles]


@router.post("/roles", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
async def create_role(
    data: RoleCreate,
    _: AdminUser,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> RoleResponse:
    """Create a new role, optionally with initial permissions."""
    existing = await prisma.role.find_unique(where={"name": data.name})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Role '{data.name}' already exists",
        )

    if data.permission_ids:
        found = await prisma.permission.find_many(where={"id": {"in": data.permission_ids}})
        if len(found) != len(data.permission_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="One or more permission IDs not found",
            )

    role = await prisma.role.create(
        data={
            "name": data.name,
            "description": data.description,
            "permissions": {"connect": [{"id": pid} for pid in data.permission_ids]},
        },
        include={"permissions": True},
    )
    return _role_to_response(role)


@router.patch("/roles/{role_id}", response_model=RoleResponse)
async def update_role(
    role_id: str,
    data: RoleUpdate,
    _: AdminUser,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> RoleResponse:
    """Update a role's name, description, or replace its full permission set."""
    role = await prisma.role.find_unique(where={"id": role_id})
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")

    if data.name and data.name != role.name:
        existing = await prisma.role.find_unique(where={"name": data.name})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Role name '{data.name}' already taken",
            )

    if data.permission_ids is not None:
        found = await prisma.permission.find_many(where={"id": {"in": data.permission_ids}})
        if len(found) != len(data.permission_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="One or more permission IDs not found",
            )
        new_desc = data.description if data.description is not None else role.description
        updated = await prisma.role.update(
            where={"id": role_id},
            data={
                "name": data.name if data.name is not None else role.name,
                "description": new_desc,
                "permissions": {"set": [{"id": pid} for pid in data.permission_ids]},
            },
            include={"permissions": True},
        )
    else:
        new_desc = data.description if data.description is not None else role.description
        updated = await prisma.role.update(
            where={"id": role_id},
            data={
                "name": data.name if data.name is not None else role.name,
                "description": new_desc,
            },
            include={"permissions": True},
        )

    if not updated:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Update failed"
        )
    return _role_to_response(updated)


@router.delete("/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_role(
    role_id: str,
    _: AdminUser,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> None:
    """Delete a role. Fails with 409 if any teacher is currently assigned to it."""
    role = await prisma.role.find_unique(where={"id": role_id})
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")

    teacher_count = await prisma.teacher.count(where={"role_id": role_id})
    if teacher_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot delete: {teacher_count} teacher(s) are assigned to this role",
        )

    await prisma.role.delete(where={"id": role_id})


# ---------------------------------------------------------------------------
# Permissions
# ---------------------------------------------------------------------------


@router.get("/permissions", response_model=list[PermissionResponse])
async def list_permissions(
    _: AdminUser,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> list[PermissionResponse]:
    """List all permissions available in the system."""
    perms = await prisma.permission.find_many(order={"name": "asc"})
    return [_perm_to_response(p) for p in perms]


@router.post("/roles/{role_id}/permissions", response_model=RoleResponse)
async def add_role_permissions(
    role_id: str,
    data: RolePermissionsRequest,
    _: AdminUser,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> RoleResponse:
    """Add permissions to a role (idempotent — duplicates are ignored)."""
    role = await prisma.role.find_unique(where={"id": role_id})
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")

    found = await prisma.permission.find_many(where={"id": {"in": data.permission_ids}})
    if len(found) != len(data.permission_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more permission IDs not found",
        )

    updated = await prisma.role.update(
        where={"id": role_id},
        data={"permissions": {"connect": [{"id": pid} for pid in data.permission_ids]}},
        include={"permissions": True},
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Update failed"
        )
    return _role_to_response(updated)


@router.delete("/roles/{role_id}/permissions", response_model=RoleResponse)
async def remove_role_permissions(
    role_id: str,
    data: RolePermissionsRequest,
    _: AdminUser,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> RoleResponse:
    """Remove permissions from a role."""
    role = await prisma.role.find_unique(where={"id": role_id})
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")

    updated = await prisma.role.update(
        where={"id": role_id},
        data={"permissions": {"disconnect": [{"id": pid} for pid in data.permission_ids]}},
        include={"permissions": True},
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Update failed"
        )
    return _role_to_response(updated)


# ---------------------------------------------------------------------------
# Students
# ---------------------------------------------------------------------------


def _student_to_admin_response(s: Student) -> StudentAdminResponse:
    return StudentAdminResponse(
        id=s.id,
        email=s.email,
        name=s.name,
        student_code=s.student_code,
        is_active=s.is_active,
        created_at=s.created_at,
    )


@router.get("/students", response_model=list[StudentAdminResponse])
async def list_students(
    _: AdminUser,
    prisma: Annotated[Prisma, Depends(get_prisma)],
    search: Optional[str] = Query(default=None),
) -> list[StudentAdminResponse]:
    """List all students, optionally filtered by name/email/student_code."""
    where = (
        {
            "OR": [
                {"email": {"contains": search}},
                {"name": {"contains": search}},
                {"student_code": {"contains": search}},
            ]
        }
        if search
        else {}
    )
    students = await prisma.student.find_many(
        where=where,  # type: ignore[arg-type]
        order={"created_at": "desc"},
    )
    return [_student_to_admin_response(s) for s in students]


@router.post("/students", response_model=StudentAdminResponse, status_code=status.HTTP_201_CREATED)
async def create_student(
    data: StudentCreate,
    _: AdminUser,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> StudentAdminResponse:
    """Create a new student account."""
    if await prisma.student.find_unique(where={"email": data.email}):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    if await prisma.student.find_unique(where={"student_code": data.student_code}):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Student code already registered"
        )

    student = await prisma.student.create(
        data={
            "email": data.email,
            "name": data.name,
            "student_code": data.student_code,
            "hashed_password": get_password_hash(data.password),
        }
    )
    return _student_to_admin_response(student)


@router.patch("/students/{student_id}", response_model=StudentAdminResponse)
async def update_student(
    student_id: str,
    data: StudentUpdate,
    _: AdminUser,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> StudentAdminResponse:
    """Update student info (name, email, student_code, is_active)."""
    student = await prisma.student.find_unique(where={"id": student_id})
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    if data.email is not None and data.email != student.email:
        if await prisma.student.find_unique(where={"email": data.email}):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already in use")
    if data.student_code is not None and data.student_code != student.student_code:
        if await prisma.student.find_unique(where={"student_code": data.student_code}):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Student code already in use"
            )

    update_data: StudentUpdateInput = {}
    if data.name is not None:
        update_data["name"] = data.name
    if data.email is not None:
        update_data["email"] = data.email
    if data.student_code is not None:
        update_data["student_code"] = data.student_code
    if data.is_active is not None:
        update_data["is_active"] = data.is_active

    updated = await prisma.student.update(where={"id": student_id}, data=update_data)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Update failed"
        )
    return _student_to_admin_response(updated)


@router.post("/students/{student_id}/reset-password", status_code=status.HTTP_204_NO_CONTENT)
async def reset_student_password(
    student_id: str,
    data: ResetPasswordRequest,
    _: AdminUser,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> None:
    """Admin resets a student's password."""
    if not await prisma.student.find_unique(where={"id": student_id}):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    await prisma.student.update(
        where={"id": student_id},
        data={"hashed_password": get_password_hash(data.new_password)},
    )


@router.delete("/students/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_student(
    student_id: str,
    _: AdminUser,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> None:
    """Delete a student and remove them from all class enrollments."""
    if not await prisma.student.find_unique(where={"id": student_id}):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    await prisma.classenrollment.delete_many(where={"student_id": student_id})
    await prisma.student.delete(where={"id": student_id})


# ---------------------------------------------------------------------------
# Bulk import
# ---------------------------------------------------------------------------


@router.post(
    "/teachers/import",
    response_model=ImportResult,
    status_code=status.HTTP_200_OK,
)
async def import_teachers(
    data: TeacherImportRequest,
    _: AdminUser,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> ImportResult:
    """Bulk-create teacher accounts. Rows with duplicate emails are skipped."""
    created = 0
    skipped = 0
    errors: list[ImportRowError] = []

    for idx, row in enumerate(data.rows):
        if await prisma.teacher.find_unique(where={"email": row.email}):
            skipped += 1
            errors.append(ImportRowError(row=idx + 1, reason="Email đã tồn tại"))
            continue

        role_record = await prisma.role.find_first(where={"name": row.role})
        if not role_record:
            skipped += 1
            errors.append(ImportRowError(row=idx + 1, reason=f"Vai trò '{row.role}' không tồn tại"))
            continue

        await prisma.teacher.create(
            data={
                "email": row.email,
                "name": row.name,
                "hashed_password": get_password_hash(row.password),
                "role": {"connect": {"id": role_record.id}},
            }
        )
        created += 1

    return ImportResult(created=created, skipped=skipped, errors=errors)


@router.post(
    "/students/import",
    response_model=ImportResult,
    status_code=status.HTTP_200_OK,
)
async def import_students(
    data: StudentImportRequest,
    _: AdminUser,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> ImportResult:
    """Bulk-create student accounts. Rows with duplicate email or student_code are skipped."""
    created = 0
    skipped = 0
    errors: list[ImportRowError] = []

    for idx, row in enumerate(data.rows):
        if await prisma.student.find_unique(where={"email": row.email}):
            skipped += 1
            errors.append(ImportRowError(row=idx + 1, reason="Email đã tồn tại"))
            continue
        if await prisma.student.find_unique(where={"student_code": row.student_code}):
            skipped += 1
            errors.append(ImportRowError(row=idx + 1, reason="Mã học sinh đã tồn tại"))
            continue

        await prisma.student.create(
            data={
                "email": row.email,
                "name": row.name,
                "student_code": row.student_code,
                "hashed_password": get_password_hash(row.password),
            }
        )
        created += 1

    return ImportResult(created=created, skipped=skipped, errors=errors)
