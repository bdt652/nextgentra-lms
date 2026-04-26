# Coding Conventions & Standards

## 📐 Architectural Principles

1. **Separation of Concerns** - Each file has one clear purpose
2. **Type Safety First** - No `any`, explicit interfaces
3. **Server Components Default** - Next.js 15 best practices
4. **Layered Architecture** - API → Service → Model (backend)
5. **DRY & KISS** - Reuse shared packages, keep it simple

---

## 🎨 Frontend Conventions (Next.js)

### Component Structure

```typescript
// ✅ CORRECT
"use client"; // Only if needed

import { cn } from "@nextgentra/ui";
import type { ComponentProps } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
}

export function Button({
  className,
  variant = "default",
  size = "md",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium",
        "transition-colors focus-visible:outline-none focus-visible:ring-2",
        "disabled:pointer-events-none disabled:opacity-50",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// Export type for consumers
export type { ButtonProps };
```

### Server vs Client Components

**Server Component (default):**

```typescript
// ✅ NO "use client" directive
export default async function CoursePage({ params }: { params: { id: string } }) {
  // Can use async/await
  const course = await prisma.course.findUnique({ where: { id: params.id } });

  // Can access database directly
  // No useState, useEffect, or browser APIs

  return <CourseDetails course={course} />;
}

// Generate metadata
export async function generateMetadata({
  params,
}: { params: { id: string } }) {
  const course = await prisma.course.findUnique({ where: { id: params.id } });
  return { title: course?.title };
}
```

**Client Component (when needed):**

```typescript
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function EnrollmentButton({ courseId }: { courseId: string }) {
  const [enrolling, setEnrolling] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    setEnrolling(true);
    await fetch("/api/enroll", { method: "POST" });
    router.refresh();
  };

  return (
    <Button onClick={handleClick} disabled={enrolling}>
      {enrolling ? "Enrolling..." : "Enroll"}
    </Button>
  );
}
```

### Page Structure

```
app/(teacher)/dashboard/page.tsx        # Server Component (default)
app/(teacher)/dashboard/components/    # Client components (with "use client")
app/(teacher)/dashboard/hooks/         # Custom hooks
app/(teacher)/dashboard/lib/           # API clients, utils
```

### Data Fetching

```typescript
// ✅ Server Component - Direct fetch
export default async function CoursesPage() {
  const courses = await prisma.course.findMany({
    where: { status: "published" },
    include: { teacher: { select: { id: true, name: true } } },
    orderBy: { created_at: "desc" },
  });

  return <CourseList courses={courses} />;
}

// ❌ DON'T - Use useEffect for data fetching in Server Components
// ✅ DO - Use client component if you need client-side fetching
"use client";
export function CoursesClient() {
  const [courses, setCourses] = useState<Course[]>([]);
  useEffect(() => {
    fetch("/api/courses").then(r => r.json()).then(setCourses);
  }, []);
  // ...
}
```

### API Calls from Client

```typescript
// apps/*/lib/api/client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function fetchCourses(params?: CourseListParams): Promise<CourseListResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.append("page", params.page.toString());
  if (params?.limit) query.append("limit", params.limit.toString());

  const response = await fetch(`${API_BASE_URL}/courses?${query}`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

// Usage in client component:
"use client";
export function CoursesList() {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    fetchCourses({ limit: 20 }).then(setCourses);
  }, []);

  return <div>{/* render */}</div>;
}
```

---

## 🔧 Backend Conventions (FastAPI)

### File Structure

```python
# backend/app/api/courses.py
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from ...schemas.course import (
    CourseResponse,
    CourseCreate,
    CourseUpdate,
)
from ...services.course_service import CourseService
from ...core.security import get_current_user, require_role

router = APIRouter(prefix="/courses", tags=["courses"])

@router.get("/", response_model=List[CourseResponse])
async def list_courses(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    user=Depends(get_current_user)
):
    """List courses with pagination and optional filters"""
    return await CourseService.list_courses(skip, limit, status, user)

@router.post("/", response_model=CourseResponse, status_code=201)
async def create_course(
    data: CourseCreate,
    user=Depends(require_role("TEACHER"))
):
    """Create a new course (teachers only)"""
    return await CourseService.create_course(data, user.id)

@router.get("/{id}", response_model=CourseResponse)
async def get_course(
    id: str,
    user=Depends(get_current_user)
):
    """Get course by ID"""
    course = await CourseService.get_course(id)
    if not course:
        raise HTTPException(404, "Course not found")
    return course

@router.put("/{id}", response_model=CourseResponse)
async def update_course(
    id: str,
    data: CourseUpdate,
    user=Depends(require_role("TEACHER"))
):
    """Update course (owner or admin only)"""
    course = await CourseService.update_course(id, data, user.id)
    return course

@router.delete("/{id}", status_code=204)
async def delete_course(
    id: str,
    user=Depends(require_role("TEACHER"))
):
    """Delete course (owner or admin only)"""
    await CourseService.delete_course(id, user.id)
    return None
```

### Service Layer Pattern

```python
# backend/app/services/course_service.py
from prisma import Prisma
from ...schemas.course import CourseCreate, CourseUpdate, CourseResponse

class CourseService:
    @staticmethod
    async def list_courses(
        skip: int,
        limit: int,
        status: Optional[str],
        user
    ) -> List[CourseResponse]:
        """List courses with filters based on user role"""
        db = Prisma()
        await db.connect()
        try:
            where = {}
            if status:
                where["status"] = status

            # Students only see published courses they're enrolled in
            if user.role == "STUDENT":
                where["enrollments"] = {
                    "some": {"user_id": user.id}
                }

            courses = await db.course.find_many(
                where=where,
                include={
                    "teacher": {"select": {"id": True, "name": True, "email": True}},
                    "_count": {"select": {"enrollments": True, "lessons": True}}
                },
                skip=skip,
                take=limit,
                order={"created_at": "desc"}
            )
            return courses
        finally:
            await db.disconnect()

    @staticmethod
    async def create_course(
        data: CourseCreate,
        teacher_id: str
    ) -> CourseResponse:
        """Create a new course"""
        db = Prisma()
        await db.connect()
        try:
            course = await db.course.create(
                data={
                    **data.model_dump(),
                    "teacher_id": teacher_id
                },
                include={
                    "teacher": {"select": {"id": True, "name": True}}
                }
            )
            return course
        finally:
            await db.disconnect()
```

### Pydantic Schemas

```python
# backend/app/schemas/course.py
from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import Optional

class CourseBase(BaseModel):
    """Base course schema with common fields"""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    status: str = Field("draft", pattern="^(draft|published|archived)$")

    class Config:
        extra = "forbid"  # Reject unknown fields

class CourseCreate(CourseBase):
    """Schema for creating a course"""
    pass

class CourseUpdate(BaseModel):
    """Schema for updating a course - all optional"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    status: Optional[str] = Field(None, pattern="^(draft|published|archived)$")

    class Config:
        extra = "forbid"

class CourseResponse(CourseBase):
    """Full course response with all fields"""
    id: str
    teacher_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # Enable ORM mode for Prisma

# For list responses with teacher info
class CourseWithTeacher(CourseResponse):
    teacher: {
        "id": str,
        "name": str,
    }
```

### Database Access (Prisma)

```python
# backend/app/core/database.py
from prisma import Prisma

class Database:
    _instance: Optional[Prisma] = None

    @classmethod
    def get_instance(cls) -> Prisma:
        if cls._instance is None:
            cls._instance = Prisma()
        return cls._instance

    @classmethod
    async def connect(cls):
        db = cls.get_instance()
        await db.connect()

    @classmethod
    async def disconnect(cls):
        db = cls.get_instance()
        await db.disconnect()

# Usage in service:
from ...core.database import Database

db = Database.get_instance()
```

---

## 🏷️ Naming Conventions

### TypeScript / JavaScript

- **Components**: `PascalCase` - `CourseCard`, `EnrollmentButton`
- **Functions/Variables**: `camelCase` - `fetchCourses`, `isLoading`
- **Constants**: `UPPER_SNAKE_CASE` - `API_BASE_URL`, `MAX_RETRIES`
- **Types/Interfaces**: `PascalCase` - `User`, `CourseResponse`
- **Files**: `kebab-case` - `course-card.tsx`, `api-client.ts`
- **Directories**: `kebab-case` - `(teacher)`, `(student)`, `@nextgentra/ui`

### Python

- **Classes**: `PascalCase` - `CourseService`, `UserModel`
- **Functions/Variables**: `snake_case` - `get_course`, `user_id`
- **Constants**: `UPPER_SNAKE_CASE` - `DATABASE_URL`, `JWT_SECRET`
- **Modules**: `snake_case` - `course_service.py`, `schemas.py`
- **Directories**: `snake_case` - `app/api/`, `app/services/`

---

## 📝 Commenting & Documentation

### TypeScript JSDoc

````typescript
/**
 * Fetches a list of courses with optional filtering
 *
 * @param params - Optional query parameters for filtering
 * @param params.page - Page number (1-indexed)
 * @param params.limit - Items per page (max 100)
 * @param params.status - Filter by course status
 * @returns Promise resolving to paginated course list
 *
 * @example
 * ```ts
 * const result = await fetchCourses({ page: 1, limit: 20 });
 * console.log(result.data); // Course[]
 * ```
 */
export async function fetchCourses(params?: CourseListParams): Promise<CourseListResponse> {
  // implementation
}
````

### Python Docstrings

```python
async def create_course(data: CourseCreate, teacher_id: str) -> CourseResponse:
    """
    Create a new course.

    Args:
        data: Course creation data (title, description, status)
        teacher_id: ID of the teacher creating the course

    Returns:
        Created course with full details

    Raises:
        HTTPException: 403 if user is not a teacher
        ValidationError: If data is invalid

    Example:
        >>> course = await create_course(
        ...     CourseCreate(title="Math 101", description="Basic math"),
        ...     "user_123"
        ... )
    """
    # implementation
```

---

## 🎯 Error Handling

### Frontend

```typescript
// ✅ Use try/catch with specific error messages
try {
  const result = await fetchCourses();
  setCourses(result.data);
} catch (error) {
  if (error instanceof ApiError) {
    toast.error(error.message);
  } else {
    toast.error('An unexpected error occurred');
    console.error('Fetch error:', error);
  }
}

// Define error types
class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
  }
}
```

### Backend

```python
# ✅ Raise HTTPException with status and detail
if not course:
    raise HTTPException(
        status_code=404,
        detail="Course not found"
    )

# ✅ Use custom exceptions for business logic
class EnrollmentError(Exception):
    def __init__(self, message: str, code: str = "ENROLLMENT_ERROR"):
        self.message = message
        self.code = code
        super().__init__(message)

# ✅ Global exception handler
@app.exception_handler(EnrollmentError)
async def enrollment_error_handler(
    request: Request,
    exc: EnrollmentError
):
    return JSONResponse(
        status_code=400,
        content={"error": exc.code, "message": exc.message}
    )
```

---

## 🔒 Security Checklist

- [ ] All API endpoints require authentication (except `/health`, `/auth/*`)
- [ ] Use parameterized queries (Prisma handles this)
- [ ] Validate all inputs with Pydantic
- [ ] Sanitize user-generated content before rendering
- [ ] Never expose sensitive fields in API responses
- [ ] Use HTTPS in production
- [ ] Set proper CORS origins
- [ ] Implement rate limiting (future)
- [ ] Log authentication events
- [ ] Use strong JWT secrets (min 256-bit)

---

## 🧪 Testing Patterns

### Frontend Test Structure

```typescript
// __tests__/components/CourseCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { CourseCard } from '../CourseCard';
import type { Course } from "@nextgentra/utils/types";

const mockCourse: Course = {
  id: "course_123",
  title: "Test Course",
  description: "A test course",
  teacher_id: "teacher_123",
  status: "published",
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

describe("CourseCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders course title and description", () => {
    render(<CourseCard course={mockCourse} />);
    expect(screen.getByText("Test Course")).toBeInTheDocument();
    expect(screen.getByText("A test course")).toBeInTheDocument();
  });

  it("calls onEnroll when enroll button is clicked", async () => {
    const onEnroll = jest.fn();
    render(<CourseCard course={mockCourse} onEnroll={onEnroll} />);

    await user.click(screen.getByRole("button", { name: /enroll/i }));

    expect(onEnroll).toHaveBeenCalledWith("course_123");
  });

  it("disables enroll button if course is not published", () => {
    const draftCourse = { ...mockCourse, status: "draft" as const };
    render(<CourseCard course={draftCourse} onEnroll={jest.fn()} />);

    expect(screen.getByRole("button")).toBeDisabled();
  });
});
```

### Backend Test Structure

```python
# backend/tests/test_course_service.py
import pytest
from app.services.course_service import CourseService
from app.schemas.course import CourseCreate

@pytest.mark.asyncio
async def test_create_course_success(mock_db):
    """Test successful course creation"""
    # Arrange
    data = CourseCreate(
        title="Test Course",
        description="Test description"
    )

    # Act
    result = await CourseService.create_course(data, "teacher_123")

    # Assert
    assert result.title == "Test Course"
    assert result.teacher_id == "teacher_123"
    assert result.status == "draft"

@pytest.mark.asyncio
async def test_list_courses_filters_by_status(mock_db):
    """Test that listing courses respects status filter"""
    # Arrange
    status_filter = "published"

    # Act
    courses = await CourseService.list_courses(0, 20, status_filter, mock_user)

    # Assert
    for course in courses:
        assert course.status == "published"
```

---

## 🔄 Common Patterns

### Loading States

```typescript
// ✅ Pattern: Loading, Error, Success
export function CoursesPage() {
  const [state, setState] = useState<{
    data: Course[] | null;
    loading: boolean;
    error: string | null;
  }>({ data: null, loading: true, error: null });

  useEffect(() => {
    fetchCourses()
      .then(data => setState(s => ({ ...s, data, loading: false })))
      .catch(error => setState(s => ({ ...s, error: error.message, loading: false })));
  }, []);

  if (state.loading) return <Spinner />;
  if (state.error) return <ErrorMessage message={state.error} />;
  return <CourseList courses={state.data!} />;
}
```

### Form Handling

```typescript
// ✅ Pattern: React Hook Form + Zod validation
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const courseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
});

type CourseFormData = z.infer<typeof courseSchema>;

export function CourseForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
  });

  const onSubmit = (data: CourseFormData) => {
    fetch("/api/courses", {
      method: "POST",
      body: JSON.stringify(data),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("title")} />
      {errors.title && <span>{errors.title.message}</span>}
      <button type="submit">Create</button>
    </form>
  );
}
```

---

## 📊 Database Conventions (Prisma)

```prisma
// backend/prisma/schema.prisma

model User {
  id            String       @id @default(cuid())
  email         String       @unique
  name          String
  role          Role         @default(STUDENT)
  password_hash String
  avatar_url    String?
  courses       Course[]     @relation("CourseTeacher")
  enrollments   Enrollment[]
  submissions   Submission[]
  created_at    DateTime     @default(now())
  updated_at    DateTime     @updatedAt

  @@index([email])
  @@index([role])
}

model Course {
  id          String       @id @default(cuid())
  title       String
  description String?
  status      CourseStatus @default(DRAFT)
  teacher_id  String
  teacher     User         @relation("CourseTeacher", fields: [teacher_id], references: [id])
  lessons     Lesson[]
  enrollments Enrollment[]
  assignments Assignment[]
  created_at  DateTime     @default(now())
  updated_at  DateTime     @updatedAt

  @@index([teacher_id])
  @@index([status])
  @@index([created_at])
}

enum Role {
  TEACHER
  STUDENT
  ADMIN
}

enum CourseStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}
```

---

## 🔗 API Response Standards

```json
{
  "data": { ... } | [{ ... }],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "total_pages": 5,
    "has_next": true,
    "has_prev": false
  }
}

// Error response:
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid input data",
  "details": {
    "field": "email",
    "issue": "must be a valid email address"
  }
}
```

---

## 🎓 Examples

### Complete Feature: Create Course

**1. Backend:**

```python
# schemas/course.py - CourseCreate
# services/course_service.py - create_course()
# api/courses.py - @router.post("/")
```

**2. Frontend:**

```typescript
// types/index.ts - CourseCreate extends BaseModel
// lib/api/courses.ts - createCourse(data: CourseCreate)
// apps/teacher-portal/app/(teacher)/courses/new/page.tsx
```

**3. Tests:**

```python
# backend/tests/test_course_service.py - test_create_course()
# backend/tests/test_courses_api.py - test_create_course_endpoint()
```

```typescript
// apps/teacher-portal/__tests__/pages/CreateCoursePage.test.tsx
```

**4. Documentation:**

- Update `docs/api/openapi.yaml`
- Add ADR if architectural change
- Update `README.md` or `DEVELOPMENT.md` if needed

---

## ✅ Pre-Commit Checklist

- [ ] Code follows naming conventions
- [ ] No `any` types in TypeScript
- [ ] All functions have return types
- [ ] Components have proper interfaces
- [ ] API calls have error handling
- [ ] Forms have validation
- [ ] Loading/error states implemented
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console.log left in code
- [ ] No hardcoded values (use constants)
- [ ] ESLint passes
- [ ] TypeScript type-check passes
- [ ] Tests pass locally

---

## 🚫 Anti-Patterns to Avoid

### ❌ DON'T

```typescript
// 1. Using any
const data: any = await fetch(...);

// 2. Mutating props
function Component({ items }) {
  items.push(newItem); // BAD!
}

// 3. Complex logic in render
function Component() {
  const [state, setState] = useState();
  useEffect(() => {
    // Complex async logic
    const data = await fetch(...);
    setState(data);
  }, []);
  // ...
}

// 4. Unkeyed list items
{courses.map(course => <div key={course.id}>{course.title}</div>)} // GOOD!
{courses.map(course => <div>{course.title}</div>)} // BAD!

// 5. Silent failures
try {
  await fetch(...);
} catch (error) {
  // NOOP - BAD!
}

// 6. Unnecessary useEffect
useEffect(() => {
  setState(prop);
}, [prop]); // BAD! Just use prop directly
```

### ✅ DO

```typescript
// 1. Explicit types
const data: Course[] = await fetch(...);

// 2. Immutability
const newItems = [...items, newItem];
setItems(newItems);

// 3. Extract logic to utilities
function useCourses(params) {
  const [courses, setCourses] = useState<Course[]>([]);
  useEffect(() => {
    fetchCourses(params).then(setCourses);
  }, [params]);
  return courses;
}

// 4. Proper error handling
try {
  await fetch(...);
} catch (error) {
  logger.error(error);
  setError("Failed to load data");
}

// 5. Key props
{courses.map(course => (
  <div key={course.id}>{course.title}</div>
))}

// 6. Meaningful names
function calculateStudentGPA(grades: Grade[]): number { ... }
// NOT: function calc(g: G[]): number { ... }
```

---

**Last Updated**: 2025-04-25
**Applies To**: All packages in monorepo
