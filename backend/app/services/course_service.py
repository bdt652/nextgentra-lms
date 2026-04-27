"""Course service module."""
from typing import Optional
from prisma import Prisma
from app.schemas.course import CourseCreate, CourseUpdate


class CourseService:
    """Service layer for course operations."""

    @staticmethod
    async def list_courses(
        skip: int = 0,
        limit: int = 20,
        teacher_id: Optional[str] = None,
        status: Optional[str] = None,
    ) -> tuple[list, int]:
        """List courses with pagination and optional filters."""
        db = Prisma()
        await db.connect()
        try:
            where = {}
            if teacher_id:
                where["teacher_id"] = teacher_id
            if status:
                where["status"] = status

            courses = await db.course.find_many(
                where=where,
                skip=skip,
                take=limit,
                order={"created_at": "desc"},
            )
            total = await db.course.count(where=where)
            return courses, total
        finally:
            await db.disconnect()

    @staticmethod
    async def get_course(course_id: str) -> Optional[dict]:
        """Get a single course by ID."""
        db = Prisma()
        await db.connect()
        try:
            course = await db.course.find_unique(where={"id": course_id})
            if not course:
                return None

            # Count enrollments
            enrollment_count = await db.enrollment.count(
                where={"course_id": course_id}
            )

            return {
                **course.model_dump(),
                "enrollment_count": enrollment_count,
            }
        finally:
            await db.disconnect()

    @staticmethod
    async def create_course(
        data: CourseCreate,
        teacher_id: str,
        teacher_name: str
    ) -> dict:
        """Create a new course."""
        db = Prisma()
        await db.connect()
        try:
            course = await db.course.create(
                data={
                    **data.model_dump(),
                    "teacher_id": teacher_id,
                    "teacher_name": teacher_name,
                }
            )
            return course.model_dump()
        finally:
            await db.disconnect()

    @staticmethod
    async def update_course(
        course_id: str,
        data: CourseUpdate,
        user_id: str
    ) -> Optional[dict]:
        """Update a course (teachers can only update their own courses)."""
        db = Prisma()
        await db.connect()
        try:
            # Check ownership
            existing = await db.course.find_unique(where={"id": course_id})
            if not existing:
                return None
            if existing.teacher_id != user_id:
                raise PermissionError("You can only update your own courses")

            update_data = data.model_dump(exclude_unset=True)
            course = await db.course.update(
                where={"id": course_id},
                data=update_data,
            )
            return course.model_dump()
        finally:
            await db.disconnect()

    @staticmethod
    async def delete_course(course_id: str, user_id: str) -> bool:
        """Delete a course (teachers can only delete their own courses)."""
        db = Prisma()
        await db.connect()
        try:
            existing = await db.course.find_unique(where={"id": course_id})
            if not existing:
                return False
            if existing.teacher_id != user_id:
                raise PermissionError("You can only delete your own courses")

            await db.course.delete(where={"id": course_id})
            return True
        finally:
            await db.disconnect()

    @staticmethod
    async def enroll_student(course_id: str, student_id: str) -> bool:
        """Enroll a student in a course."""
        db = Prisma()
        await db.connect()
        try:
            # Check if course exists and is published
            course = await db.course.find_unique(where={"id": course_id})
            if not course:
                raise ValueError("Course not found")
            if course.status != "published":
                raise ValueError("Cannot enroll in unpublished course")

            # Check if already enrolled
            existing = await db.enrollment.find_first(
                where={"student_id": student_id, "course_id": course_id}
            )
            if existing:
                return True  # Already enrolled

            await db.enrollment.create(
                data={"student_id": student_id, "course_id": course_id}
            )
            return True
        finally:
            await db.disconnect()
