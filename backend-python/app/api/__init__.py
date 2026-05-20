"""API routers."""

from app.api.admin import router as admin_router
from app.api.auth import router as auth_teacher_router
from app.api.auth_student import router as auth_student_router
from app.api.categories import router as categories_router
from app.api.class_content import router as class_content_router
from app.api.class_members import router as class_members_router
from app.api.classes import router as classes_router
from app.api.courses import router as courses_router
from app.api.exams import router as exams_router
from app.api.lesson_questions import router as lesson_questions_router
from app.api.lessons import router as lessons_router
from app.api.sections import router as sections_router
from app.api.student_portal import router as student_portal_router
from app.api.upload import router as upload_router

__all__ = [
    "admin_router",
    "auth_student_router",
    "auth_teacher_router",
    "categories_router",
    "class_content_router",
    "class_members_router",
    "classes_router",
    "courses_router",
    "exams_router",
    "lesson_questions_router",
    "lessons_router",
    "sections_router",
    "student_portal_router",
    "upload_router",
]
