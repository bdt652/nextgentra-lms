"""Assignment service module."""
from datetime import datetime
from typing import Optional
from prisma import Prisma


class AssignmentService:
    """Service layer for assignment operations."""

    @staticmethod
    async def list_assignments(course_id: Optional[str] = None) -> list:
        """List assignments with optional course filter."""
        db = Prisma()
        await db.connect()
        try:
            where = {}
            if course_id:
                where["course_id"] = course_id

            assignments = await db.assignment.find_many(
                where=where,
                order={"due_date": "asc", "created_at": "asc"},
            )
            return assignments
        finally:
            await db.disconnect()

    @staticmethod
    async def get_assignment(assignment_id: str) -> Optional[dict]:
        """Get a single assignment by ID."""
        db = Prisma()
        await db.connect()
        try:
            assignment = await db.assignment.find_unique(where={"id": assignment_id})
            return assignment.model_dump() if assignment else None
        finally:
            await db.disconnect()

    @staticmethod
    async def create_assignment(
        course_id: str,
        title: str,
        description: Optional[str] = None,
        due_date: Optional[datetime] = None,
        max_score: int = 100
    ) -> dict:
        """Create a new assignment."""
        db = Prisma()
        await db.connect()
        try:
            assignment = await db.assignment.create(
                data={
                    "course_id": course_id,
                    "title": title,
                    "description": description,
                    "due_date": due_date,
                    "max_score": max_score,
                }
            )
            return assignment.model_dump()
        finally:
            await db.disconnect()

    @staticmethod
    async def update_assignment(
        assignment_id: str,
        title: Optional[str] = None,
        description: Optional[str] = None,
        due_date: Optional[datetime] = None,
        max_score: Optional[int] = None
    ) -> Optional[dict]:
        """Update an assignment."""
        db = Prisma()
        await db.connect()
        try:
            update_data = {}
            if title is not None:
                update_data["title"] = title
            if description is not None:
                update_data["description"] = description
            if due_date is not None:
                update_data["due_date"] = due_date
            if max_score is not None:
                update_data["max_score"] = max_score

            assignment = await db.assignment.update(
                where={"id": assignment_id},
                data=update_data,
            )
            return assignment.model_dump()
        finally:
            await db.disconnect()

    @staticmethod
    async def delete_assignment(assignment_id: str) -> bool:
        """Delete an assignment."""
        db = Prisma()
        await db.connect()
        try:
            await db.assignment.delete(where={"id": assignment_id})
            return True
        finally:
            await db.disconnect()

    @staticmethod
    async def submit_assignment(
        assignment_id: str,
        student_id: str,
        content: Optional[str] = None,
        file_urls: Optional[list[str]] = None
    ) -> dict:
        """Submit an assignment."""
        db = Prisma()
        await db.connect()
        try:
            submission = await db.submission.create(
                data={
                    "assignment_id": assignment_id,
                    "student_id": student_id,
                    "content": content,
                    "file_urls": file_urls or [],
                    "status": "submitted",
                }
            )
            return submission.model_dump()
        finally:
            await db.disconnect()

    @staticmethod
    async def grade_submission(
        submission_id: str,
        score: int,
        feedback: Optional[str] = None
    ) -> Optional[dict]:
        """Grade a submission."""
        db = Prisma()
        await db.connect()
        try:
            submission = await db.submission.update(
                where={"id": submission_id},
                data={
                    "score": score,
                    "feedback": feedback,
                    "status": "graded",
                    "graded_at": datetime.utcnow(),
                },
            )
            return submission.model_dump()
        finally:
            await db.disconnect()

    @staticmethod
    async def get_submissions(assignment_id: str) -> list:
        """Get all submissions for an assignment."""
        db = Prisma()
        await db.connect()
        try:
            submissions = await db.submission.find_many(
                where={"assignment_id": assignment_id},
                order={"submitted_at": "desc"},
            )
            return submissions
        finally:
            await db.disconnect()
