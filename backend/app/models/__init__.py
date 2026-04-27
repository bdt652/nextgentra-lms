"""Models package - Prisma client wrapper."""
from app.core.database import db

# Re-export Prisma models for convenience
from prisma import models

__all__ = [
    "db",
    "User",
    "Course",
    "Lesson",
    "Assignment",
    "Enrollment",
    "Submission",
]
