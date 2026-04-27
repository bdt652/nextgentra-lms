"""Assignments API module."""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body

from app.services.assignment_service import AssignmentService
from app.services.course_service import CourseService
from app.schemas.assignment import (
    AssignmentCreate,
    AssignmentUpdate,
    AssignmentResponse,
    SubmissionCreate,
    SubmissionResponse,
)

router = APIRouter()


async def get_current_user(token: str = Depends(lambda: None)):
    """Dependency placeholder - actual auth handled by auth router."""
    pass


@router.get("/", response_model=list[AssignmentResponse])
async def list_assignments(course_id: str | None = Query(None)):
    """List assignments with optional course filter."""
    assignments = await AssignmentService.list_assignments(course_id=course_id)
    return assignments


@router.get("/{assignment_id}", response_model=AssignmentResponse)
async def get_assignment(assignment_id: str):
    """Get a single assignment."""
    assignment = await AssignmentService.get_assignment(assignment_id)
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )
    return assignment


@router.post("/", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED)
async def create_assignment(data: AssignmentCreate, user: dict = Depends(get_current_user)):
    """Create a new assignment (teachers only)."""
    if user["role"] != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can create assignments"
        )

    # Verify course exists and user is the teacher
    course = await CourseService.get_course(data.course_id)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    if course["teacher_id"] != user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only create assignments for your own courses"
        )

    assignment = await AssignmentService.create_assignment(
        course_id=data.course_id,
        title=data.title,
        description=data.description,
        due_date=data.due_date,
        max_score=data.max_score,
    )
    return assignment


@router.patch("/{assignment_id}", response_model=AssignmentResponse)
async def update_assignment(
    assignment_id: str,
    data: AssignmentUpdate,
    user: dict = Depends(get_current_user),
):
    """Update an assignment (teachers only)."""
    if user["role"] != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can update assignments"
        )

    assignment = await AssignmentService.update_assignment(
        assignment_id=assignment_id,
        title=data.title,
        description=data.description,
        due_date=data.due_date,
        max_score=data.max_score,
    )
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )
    return assignment


@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assignment(assignment_id: str, user: dict = Depends(get_current_user)):
    """Delete an assignment (teachers only)."""
    if user["role"] != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can delete assignments"
        )

    success = await AssignmentService.delete_assignment(assignment_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )


@router.post("/{assignment_id}/submit", response_model=SubmissionResponse)
async def submit_assignment(
    assignment_id: str,
    data: SubmissionCreate = Body(...),
    user: dict = Depends(get_current_user),
):
    """Submit an assignment (students only)."""
    if user["role"] != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can submit assignments"
        )

    # Verify assignment exists
    assignment = await AssignmentService.get_assignment(assignment_id)
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )

    # Ensure assignment_id in body matches route
    if data.assignment_id != assignment_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assignment ID mismatch"
        )

    submission = await AssignmentService.submit_assignment(
        assignment_id=assignment_id,
        student_id=user["id"],
        content=data.content,
        file_urls=data.file_urls,
    )
    return submission


@router.get("/{assignment_id}/submissions")
async def get_submissions(
    assignment_id: str,
    user: dict = Depends(get_current_user),
):
    """Get all submissions for an assignment (teachers only)."""
    if user["role"] != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can view submissions"
        )

    # Verify assignment belongs to teacher
    assignment = await AssignmentService.get_assignment(assignment_id)
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )

    course = await CourseService.get_course(assignment["course_id"])
    if course["teacher_id"] != user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view submissions for your own assignments"
        )

    submissions = await AssignmentService.get_submissions(assignment_id)
    return submissions


@router.post("/submissions/{submission_id}/grade")
async def grade_submission(
    submission_id: str,
    score: int = Body(..., ge=0, le=100),
    feedback: str | None = Body(None),
    user: dict = Depends(get_current_user),
):
    """Grade a submission (teachers only)."""
    if user["role"] != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can grade submissions"
        )

    submission = await AssignmentService.grade_submission(
        submission_id=submission_id,
        score=score,
        feedback=feedback,
    )
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    return submission
