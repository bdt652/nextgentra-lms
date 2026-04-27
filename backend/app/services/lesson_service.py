"""Lesson service module."""
from typing import Optional
from prisma import Prisma


class LessonService:
    """Service layer for lesson operations."""

    @staticmethod
    async def list_lessons(course_id: str) -> list:
        """List all lessons for a course."""
        db = Prisma()
        await db.connect()
        try:
            lessons = await db.lesson.find_many(
                where={"course_id": course_id},
                order={"order": "asc", "created_at": "asc"},
            )
            return lessons
        finally:
            await db.disconnect()

    @staticmethod
    async def get_lesson(lesson_id: str) -> Optional[dict]:
        """Get a single lesson by ID."""
        db = Prisma()
        await db.connect()
        try:
            lesson = await db.lesson.find_unique(where={"id": lesson_id})
            return lesson.model_dump() if lesson else None
        finally:
            await db.disconnect()

    @staticmethod
    async def create_lesson(
        course_id: str,
        title: str,
        content: Optional[str] = None,
        order: int = 0,
        duration_minutes: Optional[int] = None
    ) -> dict:
        """Create a new lesson."""
        db = Prisma()
        await db.connect()
        try:
            lesson = await db.lesson.create(
                data={
                    "course_id": course_id,
                    "title": title,
                    "content": content,
                    "order": order,
                    "duration_minutes": duration_minutes,
                }
            )
            return lesson.model_dump()
        finally:
            await db.disconnect()

    @staticmethod
    async def update_lesson(
        lesson_id: str,
        title: Optional[str] = None,
        content: Optional[str] = None,
        order: Optional[int] = None,
        duration_minutes: Optional[int] = None
    ) -> Optional[dict]:
        """Update a lesson."""
        db = Prisma()
        await db.connect()
        try:
            update_data = {}
            if title is not None:
                update_data["title"] = title
            if content is not None:
                update_data["content"] = content
            if order is not None:
                update_data["order"] = order
            if duration_minutes is not None:
                update_data["duration_minutes"] = duration_minutes

            lesson = await db.lesson.update(
                where={"id": lesson_id},
                data=update_data,
            )
            return lesson.model_dump()
        finally:
            await db.disconnect()

    @staticmethod
    async def delete_lesson(lesson_id: str) -> bool:
        """Delete a lesson."""
        db = Prisma()
        await db.connect()
        try:
            await db.lesson.delete(where={"id": lesson_id})
            return True
        finally:
            await db.disconnect()
