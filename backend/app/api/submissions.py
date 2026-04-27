"""Submissions API module."""
from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.services.submission_service import SubmissionService
from app.schemas.submission import (
    SubmissionCreate,
    SubmissionUpdate,
    SubmissionResponse,
    SubmissionDetailResponse,
)

router = APIRouter()


async def get_current_user(token: str = Depends(lambda: None)):
    """Dependency placeholder - actual auth handled by auth router."""
    pass


@router.get("/", response_model=list[SubmissionResponse])
async def list_submissions(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    student_id: str | None = Query(None),
    assignment_id: str | None = Query(None),
    course_id: str | None = Query(None),
    user: dict = Depends(get_current_user),
):
    """List submissions with pagination."""
    # Students can only see their own submissions
    if user["role"] == "student":
        student_id = user["id"]
    # Teachers can filter by student_id, assignment_id, or course_id
    elif user["role"] == "teacher" and student_id is None and assignment_id is None and course_id is None:
        # If no filters provided, show nothing (teacher must specify)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Teacher must specify student_id, assignment_id, or course_id to list submissions"
        )

    submissions, total = await SubmissionService.list_submissions(
        skip=skip,
        limit=limit,
        student_id=student_id,
        assignment_id=assignment_id,
        course_id=course_id,
    )
    return submissions


@router.get("/{submission_id}", response_model=SubmissionDetailResponse)
async def get_submission(submission_id: str, user: dict = Depends(get_current_user)):
    """Get a single submission with details."""
    submission = await SubmissionService.get_submission(submission_id)
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )

    # Check permissions: student can only view own submissions
    if user["role"] == "student" and submission["student_id"] != user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own submissions"
        )

    # Teachers can view submissions for assignments in their courses
    if user["role"] == "teacher" and submission["assignment"]["course"]["teacher_id"] != user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view submissions from your own courses"
        )

    return submission


@router.post("/", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
async def create_submission(data: SubmissionCreate, user: dict = Depends(get_current_user)):
    """Create a new submission (students only)."""
    if user["role"] != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can submit assignments"
        )

    # Student can only submit for themselves
    if data.student_id != user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Students can only submit for themselves"
        )

    try:
        submission = await SubmissionService.create_submission(data)
        return submission
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.patch("/{submission_id}", response_model=SubmissionResponse)
async def update_submission(
    submission_id: str,
    data: SubmissionUpdate,
    user: dict = Depends(get_current_user),
):
    """Update a submission (mainly for grading by teachers)."""
    try:
        submission = await SubmissionService.update_submission(
            submission_id=submission_id,
            data=data,
            user_id=user["id"],
        )
        if not submission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Submission not found"
            )
        return submission
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.delete("/{submission_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_submission(
    submission_id: str,
    user: dict = Depends(get_current_user),
):
    """Delete a submission."""
    try:
        success = await SubmissionService.delete_submission(submission_id, user["id"])
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Submission not found"
            )
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.get("/assignment/{assignment_id}/submissions", response_model=list[SubmissionResponse])
async def get_assignment_submissions(
    assignment_id: str,
    user: dict = Depends(get_current_user),
):
    """Get all submissions for an assignment (teachers only)."""
    if user["role"] != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can view assignment submissions"
        )

    try:
        submissions, total = await SubmissionService.get_assignment_submissions(
            assignment_id=assignment_id,
            teacher_id=user["id"],
        )
        return submissions
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.get("/student/{student_id}/grades", response_model=list)
async def get_student_grades(
    student_id: str,
    course_id: str | None = Query(None),
    user: dict = Depends(get_current_user),
):
    """Get grades for a student."""
    # Student can only view own grades, teacher can view any student's grades
    if user["role"] == "student" and student_id != user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own grades"
        )

    grades = await SubmissionService.get_student_grades(student_id, course_id)
    return grades
