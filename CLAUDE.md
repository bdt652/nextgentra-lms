# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**NextGenTra LMS** - A Learning Management System with a monorepo structure containing:

- **Backend API** (backend-python/): FastAPI application with authentication endpoints
- **Student Portal** (student-portal/): Next.js 16 + React 19 frontend for students (port 3001)
- **Teacher Portal** (teacher-portal/): Next.js 16 + React 19 frontend for teachers (port 3000)

## Architecture

### Backend (Python FastAPI)
- Main entry: `backend-python/app/main.py`
- API routers in `backend-python/app/api/`
- Core utilities in `backend-python/app/core/`
- Pydantic schemas in `backend-python/app/schemas/`
- Authentication: JWT tokens (15-minute expiry) with OAuth2PasswordBearer
- Current user storage: In-memory dictionary (not production-ready)
- CORS: Configured for localhost:3000, 3001, 8000
- Redis configured for session/cache layer (currently in .env but not actively used)

### Frontends (Next.js App Router)
- Both portals use Next.js 16 with App Router (`app/` directory)
- Layout structure: `app/layout.tsx` (root) + `app/page.tsx` (home)
- Currently using default create-next-app templates (minimal customization)
- Styling: TailwindCSS v4 with PostCSS
- TypeScript with strict mode enabled
- Both portals are identical templates currently - differentiation needed

## Development Setup

### Quick Start
Use the PowerShell script to launch all services:
```powershell
.\start-dev.ps1
```
This will:
1. Start backend on http://localhost:8000 with auto-reload
2. Start teacher portal on http://localhost:3000
3. Start student portal on http://localhost:3001

### Manual Setup

**Backend (Python):**
```bash
cd backend-python
python -m venv venv
# Windows: venv\Scripts\Activate.ps1
# Unix: source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

**Frontends (Node.js):**
```bash
# Teacher Portal
cd teacher-portal
npm install
npm run dev

# Student Portal (separate terminal)
cd student-portal
npm install
npm run dev
```

## Common Commands

### Backend
- `uvicorn app.main:app --reload` - Start dev server with hot reload
- `pytest` / `python -m pytest` - Run tests
- `pytest --cov=app` - Run tests with coverage
- `black .` - Auto-format code
- `black --check .` - Check formatting without changes
- `ruff check .` - Lint code
- `ruff check . --fix` - Auto-fix lint errors
- `mypy app/` - Type checking
- `npm run dev` - (inside student/teacher portal)

### Frontends (both portals)
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint (max warnings = 0)
- `npm run lint:fix` - Auto-fix ESLint errors
- `npm run format` - Auto-format with Prettier
- `npm run format:check` - Check Prettier formatting
- `npm run type-check` - TypeScript type checking
- `npm test` - Run Jest tests
- `npm run test:coverage` - Run tests with coverage
- `npm run test:watch` - Watch mode for tests

### Database/Migrations
- Prisma is listed in dependencies but schema not yet defined
- Redis is configured but not integrated into auth flow

## Key Configuration Files

### Backend
- `backend-python/pyproject.toml` - Project metadata & tool configs (Black, Ruff, MyPy, pytest)
- `backend-python/requirements.txt` - Python dependencies (with dev group)
- `backend-python/.env` - Environment variables (JWT secrets, Redis URL)
- `backend-python/.env.example` - Template for environment variables
- `backend-python/backend-python/.gitignore` - Git ignore patterns

### Student Portal
- `student-portal/package.json` - Dependencies & npm scripts
- `student-portal/tsconfig.json` - TypeScript configuration (strict mode)
- `student-portal/next.config.ts` - Next.js configuration
- `student-portal/tailwind.config.ts` - TailwindCSS configuration
- `student-portal/eslint.config.mjs` - ESLint config with Next.js + Prettier
- `student-portal/.prettierrc` - Prettier formatting rules
- `student-portal/.prettierignore` - Prettier ignore patterns
- `student-portal/lint-staged.config.js` - Git hooks pre-commit runner
- `student-portal/jest.config.ts` - Jest test configuration
- `student-portal/jest.setup.ts` - Jest test setup
- `student-portal/.husky/pre-commit` - Pre-commit git hook

### Teacher Portal
- Similar to Student Portal (mirrored structure)
- `teacher-portal/package.json` (different name)

### CI/CD
- `.github/workflows/ci.yml` - GitHub Actions CI pipeline
- `.github/CODEOWNERS` - Auto-request code reviewers

## Important Notes

### Security
- JWT secret key is hardcoded in `backend-python/app/core/auth.py` - should be moved to environment variables
- In-memory user storage is temporary - need persistent database
- CORS is configured for development only - restrict for production
- Redis connection string contains credentials in .env - ensure .env is gitignored

### Code Quality
- TypeScript strict mode enabled
- ESLint configured with Next.js recommended rules
- TailwindCSS v4 with PostCSS
- No custom lint scripts found yet (only `eslint` base command)

### Testing
- Backend has `backend-python/tests/` directory but no tests implemented yet
- Frontends have `__tests__/` directories with example test files
- Test framework: Jest (Next.js default)
- Need to configure pytest for backend

### Database
- Currently no database integration (users stored in memory)
- Prisma is available but schema not defined
- Redis configured for potential session/cache layer
- Need to design and implement database schema for production

## Code Quality Standards

### Backend (Python)
**Linting & Formatting:**
- **Ruff** - Fast Python linter (replaces flake8, isort, pyflakes, etc.)
- **Black** - Code formatter (line length: 88)
- **MyPy** - Static type checking (strict mode enabled)

**Testing:**
- **pytest** - Test framework with async support
- Coverage reporting with pytest-cov
- Test files: `backend-python/tests/test_*.py`
- Markers: `unit`, `integration`, `slow`

**Pre-commit checks:** Run manually before push (or set up husky):
```bash
cd backend-python
black .           # Format
ruff check .      # Lint
mypy app/         # Type check
pytest            # Test
```

### Frontends (Next.js)
**Linting & Formatting:**
- **ESLint** - Linter with Next.js + TypeScript config + Prettier integration
- **Prettier** - Code formatter (single quotes, trailing commas, line length 80)
- Rules: 0 warnings threshold (strict)

**Git Hooks (Husky + lint-staged):**
- Pre-commit: Auto-run ESLint fix + Prettier on staged files
- Files affected: `.ts`, `.tsx`, `.js`, `.jsx`, `.json`, `.md`, `.html`, `.css`
- Ensures all committed code meets quality standards

**Testing:**
- **Jest** + React Testing Library
- Next.js test environment with jsdom
- Coverage collection enabled
- Test files: `__tests__/*.test.{ts,tsx}`

**Pre-commit checks:** Automatic via Husky when you commit.

### CI/CD Pipeline (GitHub Actions)
The `.github/workflows/ci.yml` runs on every push/PR:

**Backend Job:**
1. Install dependencies
2. Ruff linter
3. Black formatter check
4. MyPy type checking
5. pytest with coverage
6. Upload coverage to Codecov

**Frontend Jobs (Student & Teacher):**
1. Install dependencies (npm ci)
2. ESLint
3. Prettier check
4. TypeScript type check
5. Jest tests with coverage
6. Build verification (next build)
7. Upload coverage to Codecov

All jobs must pass for PR to merge.

## Architecture Decisions Needed

1. **Database**: Choose SQL (PostgreSQL/MySQL) or NoSQL (MongoDB) and implement Prisma schema
2. **Authentication**: Move from in-memory to persistent user storage; consider refresh tokens
3. **Frontend Differentiation**: Student and Teacher portals need distinct features/UI
4. **API Structure**: Expand beyond auth - courses, assignments, submissions, grading
5. **Testing**: Implement unit and integration tests for both backend and frontend
6. **Deployment**: Configure production builds and deployment pipeline

## Working with This Codebase

- Ports: Backend (8000), Teacher (3000), Student (3001)
- API base URL: `http://localhost:8000`
- All services use hot reload in development
- Windows environment (PowerShell scripts provided)
- Python 3.x required, Node.js 18+ recommended
- Use `start-dev.ps1` for one-command startup

## File Organization

```
lms/
├── backend-python/           # FastAPI backend
│   ├── app/
│   │   ├── api/             # API routers
│   │   ├── core/            # Auth, config, utilities
│   │   ├── schemas/         # Pydantic models
│   │   ├── main.py          # Application entry
│   │   └── __init__.py
│   ├── tests/               # Backend tests (empty)
│   ├── .env                 # Environment variables
│   ├── requirements.txt     # Python dependencies
│   └── .prisma/             # Prisma (not configured)
│
├── student-portal/          # Next.js student app
│   ├── app/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   └── __tests__/           # Frontend tests
│
├── teacher-portal/          # Next.js teacher app (mirrors student)
│   ├── app/
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   └── __tests__/
│
└── start-dev.ps1            # Dev environment launcher
```

## Getting Started with Code Quality

### First-Time Setup

**Backend:**
```bash
cd backend-python
python -m venv venv
# Activate venv (see Manual Setup above)
pip install -r requirements.txt
```

**Frontends (Student & Teacher):**
```bash
cd student-portal  # or teacher-portal
npm install
# Husky hooks will auto-install on first commit
```

### Daily Development Workflow

1. **Make code changes** in any project
2. **Run pre-commit checks** (automatic via Husky for frontend, manual for backend)
3. **Commit** - Husky will auto-lint/stage-fix frontend code
4. **Push** - CI will run full quality checks
5. **PR** - All CI checks must pass before merge

### Manual Quality Checks (Backend)
Before pushing backend changes, run:
```bash
cd backend-python
black .           # Auto-format
ruff check .      # Lint (use --fix to auto-fix)
mypy app/         # Type check
pytest            # Test
```

### Overriding Pre-commit Hooks (if needed)
Skip Husky temporarily:
```bash
git commit --no-verify
```
Use sparingly - only for emergencies like typo fixes.

## Next Steps for Development

1. Implement database schema with Prisma
2. Create database models and migrate from in-memory storage
3. Add more API endpoints (courses, assignments, etc.)
4. Build out frontend pages and components beyond home page
5. Set up proper authentication flow with refresh tokens
6. Implement role-based access control (student vs teacher)
7. Add comprehensive test coverage (use test templates provided)
8. Configure production environment variables
9. Update CODEOWNERS with actual team members
10. Consider implementing monorepo tools (Turborepo/NX) if scaling up
