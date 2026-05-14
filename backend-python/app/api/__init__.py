"""API routers."""

from app.api.admin import router as admin_router
from app.api.auth import router as auth_teacher_router
from app.api.auth_student import router as auth_student_router

__all__ = ["admin_router", "auth_student_router", "auth_teacher_router"]
