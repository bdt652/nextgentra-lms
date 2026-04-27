"""Enrollment service module."""
from typing import Optional, tuple, list
from prisma import Prisma
from app.schemas.enrollment import EnrollmentCreate, EnrollmentResponse
from app.schemas.course import CourseResponse
from app.schemas.user import UserResponse


class EnrollmentService:
    """Service layer for enrollment operations."""

    @staticmethod
    async def list_enrollments(
        skip: int = 0,
        limit: int = 20,
        student_id: Optional[str] = None,
        course_id: Optional[str] = None,
    ) -> tuple[list, int]:
        """List enrollments with pagination and optional filters."""
        db = Prisma()
        await db.connect()
        try:
            where = {}
            if student_id:
                where["student_id"] = student_id
            if course_id:
                where["course_id"] = course_id

            enrollments = await db.enrollment.find_many(
                where=where,
                skip=skip,
                take=limit,
                order={"enrolled_at": "desc"},
                include={
                    "student": True,
                    "course": True,
                },
            )
            total = await db.enrollment.count(where=where)
            return enrollments, total
        finally:
            await db.disconnect()

    @staticmethod
    async def get_enrollment(enrollment_id: str) -> Optional[dict]:
        """Get a single enrollment by ID."""
        db = Prisma()
        await db.connect()
        try:
            enrollment = await db.enrollment.find_unique(
                where={"id": enrollment_id},
                include={
                    "student": True,
                    "course": True,
                },
            )
            return enrollment.model_dump() if enrollment else None
        finally:
            await db.disconnect()

    @staticmethod
    async def create_enrollment(data: EnrollmentCreate) -> dict:
        """Create a new enrollment."""
        db = Prisma()
        await db.connect()
        try:
            # Check if course exists and is published
            course = await db.course.find_unique(where={"id": data.course_id})
            if not course:
                raise ValueError("Course not found")
            if course.status != "published":
                raise ValueError("Cannot enroll in unpublished course")

            # Check if student exists
            student = await db.user.find_unique(where={"id": data.student_id})
            if not student:
                raise ValueError("Student not found")
            if student.role != "student":
                raise ValueError("Only students can enroll in courses")

            # Check if already enrolled
            existing = await db.enrollment.find_first(
                where={
                    "student_id": data.student_id,
                    "course_id": data.course_id,
                }
            )
            if existing:
                raise ValueError("Student already enrolled in this course")

            enrollment = await db.enrollment.create(
                data={
                    "student_id": data.student_id,
                    "course_id": data.course_id,
                }
            )
            return enrollment.model_dump()
        finally:
            await db.disconnect()

    @staticmethod
    async def delete_enrollment(enrollment_id: str, user_id: str) -> bool:
        """Delete an enrollment (student can only delete their own, teacher can delete from their course)."""
        db = Prisma()
        await db.connect()
        try:
            # Get enrollment with course info
            enrollment = await db.enrollment.find_unique(
                where={"id": enrollment_id},
                include={"course": True},
            )
            if not enrollment:
                return False

            # Check permissions: student can delete own enrollment, teacher can delete from their course
            if enrollment.student_id != user_id and enrollment.course.teacher_id != user_id:
                raise PermissionError("You don't have permission to delete this enrollment")

            await db.enrollment.delete(where={"id": enrollment_id})
            return True
        finally:
            await db.disconnect()

    @staticmethod
    async def get_student_courses(student_id: str) -> tuple[list, int]:
        """Get all courses a student is enrolled in."""
        db = Prisma()
        await db.connect()
        try:
            enrollments = await db.enrollment.find_many(
                where={"student_id": student_id},
                include={"course": True},
                order={"enrolled_at": "desc"},
            )
            courses = [enrollment.course for enrollment in enrollments]
            total = len(courses)
            return courses, total
        finally:
            await db.disconnect()

    @staticmethod
    async def get_course_students(course_id: str) -> tuple[list, int]:
        """Get all students enrolled in a course (teacher only)."""
        db = Prisma()
        await db.connect()
        try:
            enrollments = await db.enrollment.find_many(
                where={"course_id": course_id},
                include={"student": True},
                order={"enrolled_at": "desc"},
            )
            students = [enrollment.student for enrollment in enrollments]
            total = len(students)
            return students, total
        finally:
            await db.disconnect()

    @staticmethod
    async def is_student_enrolled(student_id: str, course_id: str) -> bool:
        """Check if a student is enrolled in a course."""
        db = Prisma()
        await db.connect()
        try:
            enrollment = await db.enrollment.find_first(
                where={
                    "student_id": student_id,
                    "course_id": course_id,
                }
            )
            return enrollment is not None
        finally:
            await db.disconnect()
