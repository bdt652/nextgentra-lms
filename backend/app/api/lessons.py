"""Lessons API module."""
from fastapi import APIRouter, Depends, HTTPException, status

from app.services.lesson_service import LessonService
from app.schemas.lesson import (
    LessonCreate,
    LessonUpdate,
    LessonResponse,
)

router = APIRouter()


async def get_current_user(token: str = Depends(lambda: None)):
    """Dependency placeholder - actual auth handled by auth router."""
    pass


@router.get("/course/{course_id}")
async def list_lessons(course_id: str):
    """List all lessons for a course."""
    lessons = await LessonService.list_lessons(course_id)
    return lessons


@router.get("/{lesson_id}", response_model=LessonResponse)
async def get_lesson(lesson_id: str):
    """Get a single lesson."""
    lesson = await LessonService.get_lesson(lesson_id)
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    return lesson


@router.post("/", response_model=LessonResponse, status_code=status.HTTP_201_CREATED)
async def create_lesson(data: LessonCreate, user: dict = Depends(get_current_user)):
    """Create a new lesson (teachers only)."""
    if user["role"] != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can create lessons"
        )

    lesson = await LessonService.create_lesson(
        course_id=data.course_id,
        title=data.title,
        content=data.content,
        order=data.order,
        duration_minutes=data.duration_minutes,
    )
    return lesson


@router.patch("/{lesson_id}", response_model=LessonResponse)
async def update_lesson(
    lesson_id: str,
    data: LessonUpdate,
    user: dict = Depends(get_current_user),
):
    """Update a lesson (teachers only)."""
    if user["role"] != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can update lessons"
        )

    lesson = await LessonService.update_lesson(
        lesson_id=lesson_id,
        title=data.title,
        content=data.content,
        order=data.order,
        duration_minutes=data.duration_minutes,
    )
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    return lesson


@router.delete("/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lesson(lesson_id: str, user: dict = Depends(get_current_user)):
    """Delete a lesson (teachers only)."""
    if user["role"] != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can delete lessons"
        )

    success = await LessonService.delete_lesson(lesson_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
