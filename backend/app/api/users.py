"""Users API module."""
from fastapi import APIRouter, Depends, HTTPException, status

from app.services.user_service import UserService
from app.services.course_service import CourseService
from app.schemas.user import UserUpdate, UserProfile

router = APIRouter()


async def get_current_user(token: str = Depends(lambda: None)):
    """Dependency placeholder - actual auth handled by auth router."""
    pass


@router.get("/{user_id}", response_model=UserProfile)
async def get_user(user_id: str):
    """Get user profile with courses."""
    user = await UserService.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Get courses for the user
    if user["role"] == "teacher":
        courses, _ = await CourseService.list_courses(teacher_id=user_id)
        user["courses"] = courses
    else:
        # For students, get enrolled courses
        pass

    return user


@router.patch("/{user_id}")
async def update_user(user_id: str, data: UserUpdate):
    """Update user information."""
    user = await UserService.update_user(user_id, data)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user
