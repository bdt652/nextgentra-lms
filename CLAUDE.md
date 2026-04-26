# Claude Code - NextGenTra LMS Project Guide

**This file provides explicit instructions for Claude Code and AI assistants working on this LMS project.**

## 🎯 Core Principle

**Always prefer clarity and explicit instructions over assumptions.** When in doubt, ask or create a task plan first.

## 📚 Essential Documentation (Read Order)

1. **`.claude/memory/project.md`** - READ THIS FIRST for project context, conventions, critical rules
2. **`.claude/memory/user.md`** - Understand developer preferences
3. **`docs/conventions/coding-standards.md`** - Detailed coding standards
4. **`docs/conventions/task-templates.md`** - Templates for common tasks
5. **`docs/api/openapi.yaml`** - Complete API specification
6. **`CONTRIBUTING.md`** - Contribution guidelines
7. **`docs/development.md`** - Development setup guide (moved from root)
8. **`docs/deployment.md`** - Production deployment (moved from root)

---

## 📦 Project Overview

**NextGenTra LMS** - Full-stack Learning Management System with:

- **Teacher Portal** (Next.js 15, port 3000) - Course management, grading, assignments
- **Student Portal** (Next.js 15, port 3001) - Course enrollment, lessons, submissions
- **Backend API** (Python FastAPI, port 8000) - REST API with JWT auth, PostgreSQL
- **Monorepo** - NPM workspaces with Turborepo

**Tech Stack:**

- Frontend: Next.js 15, TypeScript 5.4, Tailwind CSS, React 18
- Backend: Python 3.11, FastAPI 0.110, Prisma ORM, PostgreSQL 17
- DevOps: Docker Compose, GitHub Actions, Dependabot

---

## 🏗️ Architecture Rules

### 1. Monorepo Structure

```
nextgentra-lms/
├── apps/                    # Application entry points
│   ├── teacher-portal/     # Teacher Next.js app
│   │   └── app/(teacher)/  # Teacher routes (route groups)
│   └── student-portal/     # Student Next.js app
│       └── app/(student)/  # Student routes
├── packages/               # Shared libraries (workspaces)
│   ├── ui/                 # @nextgentra/ui - Reusable components
│   │   ├── components/     # Button, Card, Input, etc.
│   │   ├── utils/         # cn, formatting helpers
│   │   └── index.ts       # Public exports
│   ├── utils/             # @nextgentra/utils - Utilities & types
│   │   ├── helpers/       # Date, validation, string utils
│   │   ├── types/         # TypeScript interfaces
│   │   └── index.ts
│   └── config/            # @nextgentra/config - Constants & configs
│       ├── constants/     # API URLs, app constants
│       ├── tailwind/      # Shared tailwind config
│       └── index.ts
├── backend/               # Python FastAPI service
│   ├── app/
│   │   ├── api/          # REST endpoints (versioned: /api/v1)
│   │   ├── core/         # Config, security, database
│   │   ├── models/       # Prisma client wrapper
│   │   ├── schemas/      # Pydantic request/response models
│   │   └── services/     # Business logic layer
│   ├── prisma/schema.prisma
│   └── tests/
├── .github/workflows/     # CI/CD pipelines
├── docs/adrs/            # Architecture Decision Records
└── turbo.json           # Turborepo build pipeline
```

### 2. Shared Package Rules

**packages/ui** - shadcn/ui style components:

- Export default component + types from index.ts
- Use `class-variance-authority` for variants
- Use `tailwind-merge` + `clsx` for conditional classes
- Example: `export { Button, type ButtonProps } from "./components/button"`

**packages/utils** - Pure utilities:

- No React dependencies (keep framework-agnostic)
- Export types from `types/` subfolder
- Example: `export { formatDate, formatCurrency } from "./helpers/format"`
- Example: `export type { User, Course, Lesson } from "./types"`

**packages/config** - Configuration only:

- Tailwind shared config
- API endpoints constants
- Environment-based configs
- No business logic

### 3. Import Path Conventions

```typescript
// ✅ CORRECT - Use workspace package names
import { Button } from '@nextgentra/ui';
import { formatDate } from '@nextgentra/utils';
import { API_BASE_URL } from '@nextgentra/config';

// ✅ Use path aliases within app
import { cn } from '@ui';
import { User } from '@utils/types';
import { sharedTailwindConfig } from '@config/tailwind/shared';

// ❌ NEVER - Direct relative paths to packages
import { Button } from '../../packages/ui/components/button';
```

**tsconfig.json paths mapping:**

```json
{
  "paths": {
    "@ui/*": ["packages/ui/*"],
    "@utils/*": ["packages/utils/*"],
    "@config/*": ["packages/config/*"],
    "@nextgentra/config/*": ["packages/config/*"]
  }
}
```

---

## 🎨 Frontend Standards (Next.js 15)

### 1. Server Components by Default

```typescript
// ✅ Default - Server Component (no "use client")
export default async function CoursePage({ params }: { params: { id: string } }) {
  const course = await fetchCourse(params.id); // Direct DB access
  return <div>{course.title}</div>;
}

// ❌ Only use "use client" when you need:
// - useState, useEffect, useRouter
// - Event handlers (onClick, onChange)
// - Browser APIs
"use client";
export default function InteractiveForm() {
  const [state, setState] = useState();
  // ...
}
```

### 2. Route Groups for Role Separation

```
app/
├── (teacher)/          # /teacher/* routes
│   ├── dashboard/
│   ├── courses/
│   └── layout.tsx      # Teacher layout with sidebar
├── (student)/          # /student/* routes
│   ├── courses/
│   ├── assignments/
│   └── layout.tsx      # Student layout
└── page.tsx            # Home (redirects based on role)
```

### 3. Data Fetching Patterns

```typescript
// ✅ Server Component - Fetch directly
export async function generateMetadata() {
  return { title: "Courses" };
}

export default async function CoursesPage() {
  const courses = await prisma.course.findMany(); // Direct
  return <CourseList courses={courses} />;
}

// ❌ DON'T - Use useEffect for data fetching in Server Components
// ✅ Client Component if you need fetching on client
"use client";
export default function ClientCourses() {
  const [courses, setCourses] = useState([]);
  useEffect(() => {
    fetch("/api/courses").then(r => r.json()).then(setCourses);
  }, []);
}
```

### 4. Component Structure

```typescript
// components/CourseCard.tsx
"use client";

import { cn } from "@nextgentra/ui";
import type { Course } from "@nextgentra/utils/types";

interface CourseCardProps {
  course: Course;
  onEnroll?: (courseId: string) => void;
}

export function CourseCard({ course, onEnroll }: CourseCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle>{course.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{course.description}</p>
        {onEnroll && (
          <Button onClick={() => onEnroll(course.id)}>
            Enroll
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## 🔧 Backend Standards (FastAPI)

### 1. Layered Architecture

```
backend/app/
├── api/
│   ├── auth.py           # /api/v1/auth/*
│   ├── courses.py        # /api/v1/courses/*
│   ├── lessons.py
│   ├── assignments.py
│   └── __init__.py       # Include all routers
├── core/
│   ├── config.py         # Settings from env
│   ├── security.py       # JWT, hashing
│   └── database.py       # Prisma client setup
├── models/
│   └── prisma.py         # Prisma client singleton
├── schemas/
│   ├── auth.py           # Pydantic: Login, Register, Token
│   ├── course.py
│   ├── lesson.py
│   └── assignment.py
└── services/
    ├── course_service.py # Business logic
    ├── user_service.py
    └── enrollment_service.py
```

### 2. API Endpoint Pattern

```python
# backend/app/api/courses.py
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from ...schemas.course import CourseResponse, CourseCreate
from ...services.course_service import CourseService
from ...core.security import get_current_user

router = APIRouter(prefix="/courses", tags=["courses"])

@router.get("/", response_model=List[CourseResponse])
async def list_courses(
    skip: int = 0,
    limit: int = 20,
    user=Depends(get_current_user)
):
    """List courses with pagination"""
    return await CourseService.list_courses(skip, limit, user)

@router.post("/", response_model=CourseResponse, status_code=201)
async def create_course(
    data: CourseCreate,
    user=Depends(get_current_user)
):
    """Create new course (teachers only)"""
    if user.role != "TEACHER":
        raise HTTPException(403, "Only teachers can create courses")
    return await CourseService.create_course(data, user.id)
```

### 3. Pydantic Schemas

```python
# backend/app/schemas/course.py
from pydantic import BaseModel, Field
from typing import Optional

class CourseBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    status: str = Field("draft", pattern="^(draft|published|archived)$")

class CourseCreate(CourseBase):
    pass

class CourseResponse(CourseBase):
    id: str
    teacher_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # Enable ORM mode
```

### 4. Service Layer Pattern

```python
# backend/app/services/course_service.py
from prisma import Prisma
from ...schemas.course import CourseCreate, CourseResponse

class CourseService:
    @staticmethod
    async def list_courses(skip: int, limit: int, user):
        db = Prisma()
        await db.connect()
        try:
            courses = await db.course.find_many(
                where={"status": "published"} if user.role == "STUDENT" else {},
                skip=skip,
                take=limit,
                order={"created_at": "desc"}
            )
            return courses
        finally:
            await db.disconnect()

    @staticmethod
    async def create_course(data: CourseCreate, teacher_id: str):
        db = Prisma()
        await db.connect()
        try:
            return await db.course.create(
                data={
                    **data.model_dump(),
                    "teacher_id": teacher_id
                }
            )
        finally:
            await db.disconnect()
```

---

## 🧪 Testing Standards

### Frontend Tests (Jest + Testing Library)

```typescript
// __tests__/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@nextgentra/ui';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Submit</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies variant styles', () => {
    render(<Button variant="destructive">Delete</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-destructive');
  });
});
```

### Backend Tests (Pytest)

```python
# backend/tests/test_courses.py
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_list_courses(client: AsyncClient):
    response = await client.get("/api/v1/courses")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

@pytest.mark.asyncio
async def test_create_course_unauthorized(client: AsyncClient):
    response = await client.post("/api/v1/courses", json={
        "title": "Test Course",
        "description": "Test"
    })
    assert response.status_code == 401
```

---

## 🔒 Security Standards

### 1. Authentication Flow

```python
# JWT Token Structure
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "TEACHER|STUDENT|ADMIN",
  "iat": 1234567890,
  "exp": 1234567890
}
```

- Access token: 15 minutes
- Refresh token: 7 days (stored in Redis)
- Use `@require_role("TEACHER")` decorator for protected endpoints

### 2. Never Commit Secrets

```bash
# ✅ Use .env files (already in .gitignore)
DATABASE_URL="postgresql://..."
JWT_SECRET_KEY="generate-with-openssl-rand-base64-32"

# ❌ NEVER hardcode
SECRET_KEY = "my-secret-key"  # WRONG!
```

### 3. Input Validation

```python
# Always validate with Pydantic
class CourseCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    # Pydantic validates automatically

# Sanitize outputs
from markupsafe import escape
safe_html = escape(user_input)
```

---

## 📝 Git Workflow

### 1. Branch Strategy

```
main          - Production ready
develop       - Integration branch
feature/xxx   - New features
fix/xxx       - Bug fixes
hotfix/xxx    - Critical production fixes
```

### 2. Conventional Commits

```bash
git commit -m "feat(auth): implement JWT refresh flow"
git commit -m "fix(courses): correct enrollment validation"
git commit -m "docs(readme): update deployment guide"
git commit -m "refactor(services): extract course service layer"
```

**Types:** feat, fix, docs, style, refactor, perf, test, chore, build, ci, revert

### 3. Pull Request Template

```markdown
## Changes

- [ ] Describe what changed

## Related Issues

- Closes #123

## Testing

- [ ] How to test?
- [ ] Manual steps?
- [ ] Automated tests added?

## Screenshots (UI changes)

- [ ] Add screenshots

## Checklist

- [ ] Lint passed (`npm run lint`)
- [ ] Type-check passed (`npm run type-check`)
- [ ] Tests passed (`npm run test`)
- [ ] No hardcoded secrets
- [ ] Documentation updated
```

---

## 🚀 Common Tasks - Templates

### Task: Add New API Endpoint

```markdown
## Plan: Add [Feature] API

1. **Backend**
   - Create `backend/app/schemas/feature.py` (Pydantic models)
   - Create `backend/app/services/feature_service.py` (business logic)
   - Create `backend/app/api/feature.py` (REST endpoints)
   - Import router in `backend/main.py`
   - Add tests in `backend/tests/test_feature.py`

2. **Frontend**
   - Add API client method in `apps/*/lib/api/client.ts`
   - Create TypeScript types in `packages/utils/types/feature.ts`
   - Build UI component in `apps/*/components/FeatureComponent.tsx`
   - Add page in `apps/*/app/(role)/feature/page.tsx`
   - Add tests

3. **Database**
   - Update `backend/prisma/schema.prisma`
   - Run `npx prisma migrate dev --name add_feature`
   - Update seed data if needed
```

### Task: Add Shared Component

```markdown
## Plan: Add [Component] to UI Package

1. Create `packages/ui/components/[Component].tsx`
2. Export from `packages/ui/index.ts`
3. Add Storybook story (optional)
4. Add tests in `packages/ui/__tests__/`
5. Update `packages/ui/README.md` if needed
6. Usage: `import { Component } from "@nextgentra/ui"`
```

### Task: Refactor Existing Code

```markdown
## Plan: Refactor [Module]

1. **Analysis**
   - Current structure
   - Dependencies
   - Coupling/cohesion

2. **Changes**
   - Extract interfaces/abstract classes
   - Move logic to appropriate layer
   - Update imports

3. **Testing**
   - Ensure existing tests pass
   - Add tests for new structure
   - Run full CI locally: `make ci-check`
```

---

## 🔍 Debugging Checklist

### Frontend Issues

- [ ] Check browser console (F12)
- [ ] Verify API URL in `.env.local`
- [ ] Check network tab for failed requests
- [ ] Run `npm run lint` - fix warnings
- [ ] Run `npm run type-check` - fix type errors
- [ ] Clear `.next` cache: `rm -rf .next`

### Backend Issues

- [ ] Check logs: `docker-compose logs -f backend`
- [ ] Verify DB connection: `docker-compose exec db psql -U postgres`
- [ ] Test API directly: `curl http://localhost:8000/health`
- [ ] Check Redis: `docker-compose exec redis redis-cli ping`
- [ ] View DB: `npm run db:studio`

### CI/CD Failures

- [ ] Replicate locally: `make ci-check`
- [ ] Check dependency versions
- [ ] Verify environment variables in GitHub Secrets
- [ ] Review workflow logs in GitHub Actions

---

## 📚 Quick References

### Key Commands

```bash
make help              # All commands
make dev               # Start everything
make lint              # Lint all
make type-check        # TypeScript check
make test              # Run tests
make build             # Production build
make docker-up         # Start services
make db:migrate        # Run migrations
```

### File Locations

- **UI Components**: `packages/ui/components/`
- **API Client**: `apps/*/lib/api/`
- **Types**: `packages/utils/types/`
- **Env Vars**: `backend/.env`, `apps/*/.env.local`
- **DB Schema**: `backend/prisma/schema.prisma`
- **API Docs**: `http://localhost:8000/docs` (when running)

### Ports

- Teacher Portal: `http://localhost:3000`
- Student Portal: `http://localhost:3001`
- Backend API: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`
- Prisma Studio: `http://localhost:5555` (`npm run db:studio`)

---

## 🤖 AI Assistant Guidelines

### When Starting a Task

1. **Read this file first** - Understand project structure
2. **Check related files** - See existing patterns
3. **Create a plan** - Use TodoWrite for complex tasks
4. **Ask questions** - If requirements unclear

### Code Generation Rules

- **Strict TypeScript** - No `any`, define interfaces
- **Follow conventions** - Check existing code for patterns
- **Add tests** - Every new feature needs tests
- **Update docs** - Keep documentation current
- **Run checks** - Ensure lint/type-check pass

### What to Avoid

- ❌ Don't modify shared packages without testing both apps
- ❌ Don't skip type definitions
- ❌ Don't hardcode values (use env vars or constants)
- ❌ Don't add console.log in production code
- ❌ Don't create circular dependencies between packages

---

## 📖 Additional Resources

- [README.md](README.md) - Project overview
- [DEVELOPMENT.md](DEVELOPMENT.md) - Complete dev guide
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
- [DEPLOYMENT.md](DEPEPLOYMENT.md) - Production deployment
- [docs/adrs/](docs/adrs/) - Architecture decisions

---

**Last Updated**: 2025-04-25
**Maintainer**: NextGenTra Team
**Claude Code Version**: Compatible with Claude Code v1.0+
