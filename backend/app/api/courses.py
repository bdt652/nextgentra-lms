"""Courses API module."""
from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.services.course_service import CourseService
from app.schemas.course import (
    CourseCreate,
    CourseUpdate,
    CourseResponse,
    CourseListResponse,
)

router = APIRouter()


async def get_current_user(token: str = Depends(lambda: None)):
    """Dependency placeholder - actual auth handled by auth router."""
    pass


@router.get("/", response_model=CourseListResponse)
async def list_courses(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    teacher_id: str | None = Query(None),
    status: str | None = Query(None),
):
    """List courses with pagination."""
    courses, total = await CourseService.list_courses(
        skip=skip,
        limit=limit,
        teacher_id=teacher_id,
        status=status,
    )
    return {
        "courses": courses,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(course_id: str):
    """Get a single course."""
    course = await CourseService.get_course(course_id)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    return course


@router.post("/", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(data: CourseCreate, user: dict = Depends(get_current_user)):
    """Create a new course (teachers only)."""
    if user["role"] != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can create courses"
        )

    course = await CourseService.create_course(
        data=data,
        teacher_id=user["id"],
        teacher_name=user["name"],
    )
    return course


@router.patch("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: str,
    data: CourseUpdate,
    user: dict = Depends(get_current_user),
):
    """Update a course (teachers can only update their own courses)."""
    try:
        course = await CourseService.update_course(course_id, data, user["id"])
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
        return course
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(
    course_id: str,
    user: dict = Depends(get_current_user),
):
    """Delete a course (teachers can only delete their own courses)."""
    try:
        success = await CourseService.delete_course(course_id, user["id"])
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.post("/{course_id}/enroll")
async def enroll_in_course(course_id: str, user: dict = Depends(get_current_user)):
    """Enroll a student in a course."""
    if user["role"] != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can enroll in courses"
        )

    try:
        success = await CourseService.enroll_student(course_id, user["id"])
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot enroll in course"
            )
        return {"message": "Enrolled successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
