"""Enrollments API module."""
from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.services.enrollment_service import EnrollmentService
from app.schemas.enrollment import EnrollmentCreate, EnrollmentResponse, EnrollmentDetailResponse

router = APIRouter()


async def get_current_user(token: str = Depends(lambda: None)):
    """Dependency placeholder - actual auth handled by auth router."""
    pass


@router.get("/", response_model=list[EnrollmentResponse])
async def list_enrollments(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    student_id: str | None = Query(None),
    course_id: str | None = Query(None),
    user: dict = Depends(get_current_user),
):
    """List enrollments with pagination."""
    # Students can only see their own enrollments
    if user["role"] == "student":
        student_id = user["id"]
    # Teachers can filter by student_id or course_id
    elif user["role"] == "teacher" and student_id is None:
        # If no student_id provided, show nothing (teacher must specify)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Teacher must specify student_id to list enrollments"
        )

    enrollments, total = await EnrollmentService.list_enrollments(
        skip=skip,
        limit=limit,
        student_id=student_id,
        course_id=course_id,
    )
    return enrollments


@router.get("/{enrollment_id}", response_model=EnrollmentDetailResponse)
async def get_enrollment(enrollment_id: str, user: dict = Depends(get_current_user)):
    """Get a single enrollment with details."""
    enrollment = await EnrollmentService.get_enrollment(enrollment_id)
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enrollment not found"
        )

    # Check permissions: student can only view own enrollment
    if user["role"] == "student" and enrollment["student_id"] != user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own enrollments"
        )

    # Teachers can view enrollments in their courses
    if user["role"] == "teacher" and enrollment["course"]["teacher_id"] != user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view enrollments in your own courses"
        )

    return enrollment


@router.post("/", response_model=EnrollmentResponse, status_code=status.HTTP_201_CREATED)
async def create_enrollment(data: EnrollmentCreate, user: dict = Depends(get_current_user)):
    """Create a new enrollment (student self-enrollment or teacher enroll)."""
    # Students can only enroll themselves
    if user["role"] == "student":
        if data.student_id != user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students can only enroll themselves"
            )
    # Teachers can enroll any student in their courses
    elif user["role"] == "teacher":
        # Verify course belongs to teacher
        from prisma import Prisma
        db = Prisma()
        await db.connect()
        try:
            course = await db.course.find_unique(where={"id": data.course_id})
            if not course or course.teacher_id != user["id"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You can only enroll students in your own courses"
                )
        finally:
            await db.disconnect()
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid role"
        )

    try:
        enrollment = await EnrollmentService.create_enrollment(data)
        return enrollment
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{enrollment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_enrollment(
    enrollment_id: str,
    user: dict = Depends(get_current_user),
):
    """Delete an enrollment."""
    try:
        success = await EnrollmentService.delete_enrollment(enrollment_id, user["id"])
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Enrollment not found"
            )
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.get("/student/{student_id}/courses", response_model=list)
async def get_student_courses(student_id: str, user: dict = Depends(get_current_user)):
    """Get all courses a student is enrolled in."""
    # Student can only view own courses, teacher can view any student's courses
    if user["role"] == "student" and student_id != user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own courses"
        )

    courses, total = await EnrollmentService.get_student_courses(student_id)
    return courses


@router.get("/course/{course_id}/students", response_model=list)
async def get_course_students(course_id: str, user: dict = Depends(get_current_user)):
    """Get all students enrolled in a course (teachers only)."""
    if user["role"] != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can view course students"
        )

    students, total = await EnrollmentService.get_course_students(course_id)
    return students
