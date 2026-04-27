"""Submission service module."""
from typing import Optional, tuple, list
from prisma import Prisma
from app.schemas.submission import SubmissionCreate, SubmissionUpdate, SubmissionResponse
from app.schemas.assignment import AssignmentResponse
from app.schemas.user import UserResponse


class SubmissionService:
    """Service layer for submission operations."""

    @staticmethod
    async def list_submissions(
        skip: int = 0,
        limit: int = 20,
        student_id: Optional[str] = None,
        assignment_id: Optional[str] = None,
        course_id: Optional[str] = None,
    ) -> tuple[list, int]:
        """List submissions with pagination and optional filters."""
        db = Prisma()
        await db.connect()
        try:
            where = {}
            if student_id:
                where["student_id"] = student_id
            if assignment_id:
                where["assignment_id"] = assignment_id
            if course_id:
                # Join through assignment to filter by course
                assignments = await db.assignment.find_many(
                    where={"course_id": course_id}
                )
                assignment_ids = [a.id for a in assignments]
                if assignment_ids:
                    where["assignment_id"] = {"in": assignment_ids}

            submissions = await db.submission.find_many(
                where=where,
                skip=skip,
                take=limit,
                order={"submitted_at": "desc"},
                include={
                    "student": True,
                    "assignment": {
                        "include": {
                            "course": True,
                        }
                    },
                },
            )
            total = await db.submission.count(where=where)
            return submissions, total
        finally:
            await db.disconnect()

    @staticmethod
    async def get_submission(submission_id: str) -> Optional[dict]:
        """Get a single submission by ID."""
        db = Prisma()
        await db.connect()
        try:
            submission = await db.submission.find_unique(
                where={"id": submission_id},
                include={
                    "student": True,
                    "assignment": {
                        "include": {
                            "course": True,
                        }
                    },
                },
            )
            return submission.model_dump() if submission else None
        finally:
            await db.disconnect()

    @staticmethod
    async def create_submission(data: SubmissionCreate) -> dict:
        """Create a new submission."""
        db = Prisma()
        await db.connect()
        try:
            # Check if assignment exists and is published
            assignment = await db.assignment.find_unique(
                where={"id": data.assignment_id},
                include={"course": True},
            )
            if not assignment:
                raise ValueError("Assignment not found")

            # Check if student exists
            student = await db.user.find_unique(where={"id": data.student_id})
            if not student:
                raise ValueError("Student not found")
            if student.role != "student":
                raise ValueError("Only students can submit assignments")

            # Check if student is enrolled in the course
            is_enrolled = await db.enrollment.find_first(
                where={
                    "student_id": data.student_id,
                    "course_id": assignment.course_id,
                }
            )
            if not is_enrolled:
                raise ValueError("Student must be enrolled in the course to submit")

            # Check if assignment due date has passed
            if assignment.due_date and assignment.due_date < db._engine._utils.now():
                raise ValueError("Assignment due date has passed")

            # Check if already submitted
            existing = await db.submission.find_first(
                where={
                    "student_id": data.student_id,
                    "assignment_id": data.assignment_id,
                }
            )
            if existing:
                raise ValueError("Student has already submitted for this assignment")

            submission = await db.submission.create(
                data={
                    "student_id": data.student_id,
                    "assignment_id": data.assignment_id,
                    "content": data.content,
                    "file_urls": data.file_urls or [],
                }
            )
            return submission.model_dump()
        finally:
            await db.disconnect()

    @staticmethod
    async def update_submission(
        submission_id: str,
        data: SubmissionUpdate,
        user_id: str
    ) -> Optional[dict]:
        """Update a submission (mainly for grading)."""
        db = Prisma()
        await db.connect()
        try:
            # Get submission
            submission = await db.submission.find_unique(
                where={"id": submission_id},
                include={"assignment": {"include": {"course": True}}},
            )
            if not submission:
                return None

            # Check permissions: teacher of the course can grade
            if submission.assignment.course.teacher_id != user_id:
                raise PermissionError("Only the course teacher can grade submissions")

            update_data = data.model_dump(exclude_unset=True)
            if update_data.get("status") == "graded" and "score" in update_data:
                update_data["graded_at"] = db._engine._utils.now()

            updated = await db.submission.update(
                where={"id": submission_id},
                data=update_data,
            )
            return updated.model_dump()
        finally:
            await db.disconnect()

    @staticmethod
    async def delete_submission(submission_id: str, user_id: str) -> bool:
        """Delete a submission (student can delete own ungraded submission)."""
        db = Prisma()
        await db.connect()
        try:
            submission = await db.submission.find_unique(
                where={"id": submission_id},
                include={"assignment": {"include": {"course": True}}},
            )
            if not submission:
                return False

            # Student can delete own ungraded submission
            if submission.student_id == user_id and submission.status != "graded":
                await db.submission.delete(where={"id": submission_id})
                return True

            # Teacher can delete any submission from their course
            if submission.assignment.course.teacher_id == user_id:
                await db.submission.delete(where={"id": submission_id})
                return True

            raise PermissionError("You don't have permission to delete this submission")
        finally:
            await db.disconnect()

    @staticmethod
    async def get_assignment_submissions(assignment_id: str, teacher_id: str) -> tuple[list, int]:
        """Get all submissions for an assignment (teacher only)."""
        db = Prisma()
        await db.connect()
        try:
            # Verify assignment belongs to teacher
            assignment = await db.assignment.find_unique(
                where={"id": assignment_id},
                include={"course": True},
            )
            if not assignment or assignment.course.teacher_id != teacher_id:
                raise PermissionError("You don't have access to this assignment")

            submissions = await db.submission.find_many(
                where={"assignment_id": assignment_id},
                include={
                    "student": True,
                    "assignment": True,
                },
                order={"submitted_at": "desc"},
            )
            total = len(submissions)
            return submissions, total
        finally:
            await db.disconnect()

    @staticmethod
    async def get_student_grades(student_id: str, course_id: Optional[str] = None) -> list:
        """Get grades for a student, optionally filtered by course."""
        db = Prisma()
        await db.connect()
        try:
            # Get all submissions for student
            where = {"student_id": student_id}
            if course_id:
                # Get assignment IDs for this course
                assignments = await db.assignment.find_many(
                    where={"course_id": course_id}
                )
                assignment_ids = [a.id for a in assignments]
                if assignment_ids:
                    where["assignment_id"] = {"in": assignment_ids}

            submissions = await db.submission.find_many(
                where=where,
                include={
                    "assignment": {
                        "include": {
                            "course": True,
                        }
                    },
                },
            )

            # Calculate grades
            grades = []
            for sub in submissions:
                assignment = sub.assignment
                grades.append({
                    "submission_id": sub.id,
                    "assignment_id": assignment.id,
                    "assignment_title": assignment.title,
                    "course_id": assignment.course_id,
                    "course_title": assignment.course.title,
                    "score": sub.score,
                    "max_score": assignment.max_score,
                    "status": sub.status,
                    "submitted_at": sub.submitted_at,
                    "graded_at": sub.graded_at,
                    "feedback": sub.feedback,
                })
            return grades
        finally:
            await db.disconnect()
