"""Schemas package initialization."""
from .auth import (
    Token,
    TokenPayload,
    LoginRequest,
    RegisterRequest,
    UserResponse,
    RefreshTokenRequest,
)
from .user import UserCreate, UserUpdate, UserResponse, UserProfile
from .course import (
    CourseBase,
    CourseCreate,
    CourseUpdate,
    CourseResponse,
    CourseListResponse,
)
from .lesson import (
    LessonBase,
    LessonCreate,
    LessonUpdate,
    LessonResponse,
)
from .assignment import (
    AssignmentBase,
    AssignmentCreate,
    AssignmentUpdate,
    AssignmentResponse,
)
from .enrollment import (
    EnrollmentBase,
    EnrollmentCreate,
    EnrollmentResponse,
    EnrollmentDetailResponse,
)
from .submission import (
    SubmissionBase,
    SubmissionCreate,
    SubmissionUpdate,
    SubmissionResponse,
    SubmissionDetailResponse,
)

__all__ = [
    # Auth
    "Token",
    "TokenPayload",
    "LoginRequest",
    "RegisterRequest",
    "UserResponse",
    "RefreshTokenRequest",
    # User
    "UserCreate",
    "UserUpdate",
    "UserProfile",
    # Course
    "CourseBase",
    "CourseCreate",
    "CourseUpdate",
    "CourseResponse",
    "CourseListResponse",
    # Lesson
    "LessonBase",
    "LessonCreate",
    "LessonUpdate",
    "LessonResponse",
    # Assignment
    "AssignmentBase",
    "AssignmentCreate",
    "AssignmentUpdate",
    "AssignmentResponse",
    # Submission
    "SubmissionBase",
    "SubmissionCreate",
    "SubmissionUpdate",
    "SubmissionResponse",
    "SubmissionDetailResponse",
    # Enrollment
    "EnrollmentBase",
    "EnrollmentCreate",
    "EnrollmentResponse",
    "EnrollmentDetailResponse",
]
