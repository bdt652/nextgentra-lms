"""Authentication and authorization dependencies."""

from collections.abc import Awaitable
from typing import Annotated, Callable, Literal

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.core.auth import decode_token
from app.core.database import Prisma, get_prisma

# Separate OAuth2 schemes for student and teacher
oauth2_student = OAuth2PasswordBearer(tokenUrl="/auth/student/login")
oauth2_teacher = OAuth2PasswordBearer(tokenUrl="/auth/teacher/login")


class CurrentUser:
    """Unified user model for both Student and Teacher."""

    def __init__(
        self,
        id: str,
        email: str,
        name: str,
        user_type: Literal["student", "teacher"],
        role: str | None = None,
    ):
        self.id = id
        self.email = email
        self.name = name
        self.user_type = user_type
        self.role = role


async def get_current_student(
    token: Annotated[str, Depends(oauth2_student)], prisma: Annotated[Prisma, Depends(get_prisma)]
) -> CurrentUser:
    """Get authenticated student from token."""
    token_data = decode_token(token)
    if not token_data or not token_data.email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication credentials"
        )

    student = await prisma.student.find_unique(where={"email": token_data.email})
    if not student or not student.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Student not found or account deactivated",
        )

    return CurrentUser(id=student.id, email=student.email, name=student.name, user_type="student")


async def get_current_teacher(
    token: Annotated[str, Depends(oauth2_teacher)], prisma: Annotated[Prisma, Depends(get_prisma)]
) -> CurrentUser:
    """Get authenticated teacher from token."""
    token_data = decode_token(token)
    if not token_data or not token_data.email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication credentials"
        )

    teacher = await prisma.teacher.find_unique(
        where={"email": token_data.email}, include={"role": True}
    )
    if not teacher or not teacher.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Teacher not found or account deactivated",
        )

    role_name = teacher.role.name if teacher.role else None
    return CurrentUser(
        id=teacher.id, email=teacher.email, name=teacher.name, user_type="teacher", role=role_name
    )


def require_permission(permission: str) -> Callable[[], Awaitable[CurrentUser]]:
    """Dependency that requires the teacher to have a specific permission."""

    async def permission_checker(
        current_teacher: CurrentUser = Depends(get_current_teacher),
        prisma: Prisma = Depends(get_prisma),
    ) -> CurrentUser:
        if current_teacher.user_type != "teacher":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Teachers only")

        # Fetch teacher with role and permissions
        teacher_with_role = await prisma.teacher.find_unique(
            where={"id": current_teacher.id}, include={"role": {"include": {"permissions": True}}}
        )
        if not teacher_with_role or not teacher_with_role.role:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No role assigned")

        if not teacher_with_role.role.permissions:
            perm_names = set()
        else:
            perm_names = {p.name for p in teacher_with_role.role.permissions}
        if permission not in perm_names:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing required permission: {permission}",
            )

        return current_teacher

    return permission_checker


def require_admin() -> Callable[[], Awaitable[CurrentUser]]:
    """Require admin role."""
    return require_permission("admin:access")
