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

### Naming Conventions

**Python (Backend):**
- ✅ **snake_case** for variables, functions, methods, and module names
- ✅ **PascalCase** for classes and exceptions
- ✅ **UPPER_SNAKE_CASE** for constants
- Database fields follow Prisma schema (all snake_case)

Examples:
```python
# Good
user_id = "123"
def get_user_by_email():
class UserResponse:
MAX_RETRIES = 3

# Avoid
userId = "123"  # camelCase
def GetUser():  # PascalCase for function
```

**TypeScript (Frontend):**
- Follow JavaScript conventions: **camelCase** for variables, functions, methods
- **PascalCase** for React components and classes
- API payload keys should use snake_case to match backend

```typescript
// Good
const userId = "123";
function getUserData() {}
interface UserResponse {}
// API payload: { user_id: "...", created_at: "..." }

// Avoid
const UserId = "123";  // PascalCase for variable
```

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

## MCP Server Configuration

This project uses **Model Context Protocol (MCP)** servers to enhance Claude Code's capabilities during development.

### Available MCP Servers

The following MCP servers are configured in `.mcp.json`:

| Server | Purpose | Version |
|--------|---------|---------|
| **memory** | Persistent knowledge storage across conversations | @modelcontextprotocol/server-memory@2026.1.26 |
| **context7** | Real-time documentation lookup for libraries | @upstash/context7-mcp@2.1.4 |
| **sequential-thinking** | Structured problem-solving with thought chains | @modelcontextprotocol/server-sequential-thinking@2025.12.18 |
| **playwright** | Browser automation for UI testing | @playwright/mcp@0.0.69 |

### Using MCP Tools

When working in this project, Claude Code automatically has access to these MCP servers. You can invoke their capabilities using natural language:

- **Memory**: Ask Claude to "remember this" or "check the memory" - it will store/retrieve project-specific knowledge
- **Context7**: Ask "how do I use FastAPI CORS?" - Claude will fetch up-to-date docs from Context7
- **Sequential Thinking**: For complex problems, Claude automatically uses this to break down tasks systematically
- **Playwright**: For UI testing, ask "test the login flow" - Claude can automate browser actions

### Installing/Updating MCP Servers

To install or update MCP servers, edit `.mcp.json` and restart the Claude Code extension to reload the configuration.

See [MCP Documentation](https://modelcontextprotocol.io) for more details.

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

## Branching Strategy

This project uses **GitHub Flow** with modifications for release stability.

### Branch Naming Convention

```
main                    # Production-ready code (default branch)
feature/xxx            # New features
fix/xxx                # Bug fixes
release/v1.2.0         # Release preparation branches
hotfix/critical-issue  # Emergency production fixes
```

### Standard Workflow

1. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/student-dashboard
   ```

2. **Make commits** using [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat(dashboard): add student progress chart"
   git commit -m "fix(auth): resolve login redirect bug"
   ```

3. **Push and open a Pull Request** to `main`:
   - All CI checks must pass (backend + frontend quality gates)
   - At least one code review approval required
   - Link to an issue/ticket in PR description

4. **Squash and merge** to `main` (keep commit history clean)

5. **CI/CD** will:
   - Run all quality checks
   - Deploy to staging (if configured)
   - Notify team (if configured)

### Release Branches

When preparing a production release:

1. **Create release branch** from `main`:
   ```bash
   git checkout -b release/v1.2.0
   ```

2. **Perform final testing** and fix any last-minute issues directly on this branch

3. **Bump versions** in all projects:
   - `backend-python/pyproject.toml`
   - `student-portal/package.json`
   - `teacher-portal/package.json`

4. **Update CHANGELOG.md** with new version section

5. **Commit version bump**:
   ```bash
   git commit -m "chore(release): prepare v1.2.0"
   ```

6. **Open PR** from `release/v1.2.0` → `main` (merge after approval)

7. **Create Git tag** and push:
   ```bash
   git checkout main
   git pull origin main
   git tag -a v1.2.0 -m "Release v1.2.0"
   git push origin v1.2.0
   ```

8. **Create GitHub Release** from the tag (auto-generate release notes from commits)

9. **Deploy to production**

10. **Delete release branch** (optional cleanup)

### Hotfix Process

For critical production issues:

1. **Create hotfix branch** from `main`:
   ```bash
   git checkout -b hotfix/login-crash
   ```

2. **Fix the issue**, commit, push

3. **Open PR** to `main` (expedited review)

4. **Merge to main**, create tag `v1.2.1`

5. **Also cherry-pick** to any active `release/` branches if needed

6. **Deploy immediately**

### Branch Protection Rules (GitHub)

Configure these in repository settings:

- **`main` branch**:
  - Require pull request reviews (1 approval)
  - Require status checks (all CI jobs must pass)
  - Require linear history (no merge commits)
  - Require signed commits (optional but recommended)
  - Restrict pushes (only maintainers can force push)

- **`release/*` branches**:
  - Same protections as `main`
  - Allow maintainers to bypass (for urgent fixes)

### Why GitHub Flow?

- **Simplicity**: Only one long-lived branch (`main`)
- **Continuous delivery**: Always deployable code
- **Reduced merge conflicts**: Small, frequent merges
- **Better code review**: Every change goes through PR
- **Rollback capability**: Release branches enable quick rollbacks

See [GitHub Flow documentation](https://docs.github.com/en/get-started/quickstart/github-flow) for more details.

## Release Process

This document describes the semi-automated release process for NextGenTra LMS.

### Pre-Release Checklist

Before creating a release, verify:

- [ ] All features/fixes merged to `main`
- [ ] CI pipeline passes on `main` (all 3 jobs: backend, student, teacher)
- [ ] No merge conflicts in `main`
- [ ] Version numbers identified (X.Y.Z format: major.minor.patch)
- [ ] CHANGELOG.md updated with all changes since last release
- [ ] Database migrations are backward compatible (if any)
- [ ] Environment variables documented (`.env.example` is current)
- [ ] API documentation updated (if endpoints changed)
- [ ] All security reviews completed (for major releases)
- [ ] Staging deployment tested (if staging environment exists)

### Release Execution Steps

#### 1. Create Release Branch

```bash
git checkout main
git pull origin main
git checkout -b release/v1.2.0
```

#### 2. Bump Versions

Update version strings in all projects:

- `backend-python/pyproject.toml`: `version = "1.2.0"`
- `student-portal/package.json`: `"version": "1.2.0"`
- `teacher-portal/package.json`: `"version": "1.2.0"`

**Use the version bump script** (recommended):
```bash
./scripts/bump-version.sh 1.2.0
# or
./scripts/bump-version.py 1.2.0
```

#### 3. Update CHANGELOG

Move all "Unreleased" changes in `CHANGELOG.md` to a new `## [1.2.0] - YYYY-MM-DD` section.

**Use conventional-changelog** (recommended):
```bash
npx conventional-changelog -p angular -i CHANGELOG.md -s -r 0
```

#### 4. Commit Release Preparation

```bash
git add .
git commit -m "chore(release): prepare v1.2.0"
```

#### 5. Push and Open PR

```bash
git push -u origin release/v1.2.0
```

Then open PR: `release/v1.2.0` → `main`

- Get PR approval from at least one maintainer
- Ensure CI passes on the release branch
- Squash and merge to `main`

#### 6. Tag the Release

```bash
git checkout main
git pull origin main
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin v1.2.0
```

#### 7. Create GitHub Release

1. Go to repository **Releases** page
2. Click "Draft a new release"
3. Select tag `v1.2.0`
4. Auto-generate release notes from merged PRs
5. Add any additional notes (breaking changes, migration steps)
6. Mark as **latest release**
7. Publish

#### 8. Deploy to Production

Follow your deployment procedure:
- Pull latest `main` on production server(s)
- Run database migrations (if any): `npx prisma migrate deploy`
- Restart services (systemd, Docker, etc.)
- Verify health endpoint: `curl http://your-api/health`

#### 9. Post-Release

- Announce release to stakeholders (Slack, email, etc.)
- Monitor Sentry for new errors
- Update team documentation if needed
- Delete release branch: `git branch -d release/v1.2.0` (optional)

### Automated Release Workflow (Optional)

You can add `.github/workflows/release.yml` to automate:

- Building Docker images
- Deploying to staging/production
- Sending notifications to Slack/Discord
- Updating dependency manifests (if needed)

Example trigger: On `push` of tags matching `v*.*.*`

### Version Numbering (Semantic Versioning)

Follow [SemVer 2.0.0](https://semver.org/):

- **Major (X.0.0)**: Breaking changes (backward incompatible)
- **Minor (1.Y.0)**: New features (backward compatible)
- **Patch (1.2.Z)**: Bug fixes (backward compatible)

Given current project stage (pre-1.0), you may use `0.x.y` where:
- `0.1.0` = initial development
- Increment minor for features, patch for fixes
- Major = 1.0.0 when API stabilizes

### Rollback Procedure

If a release introduces critical issues:

1. **Roll back to previous tag**:
   ```bash
   git checkout main
   git revert <commit-hash-of-release-merge>  # Creates an undo commit
   git push origin main
   ```

2. **Or create hotfix**: Follow hotfix process to fix and release `v1.2.1` quickly

3. **Deploy the rollback/hotfix** immediately

4. **Investigate** the issue in a feature branch before next release

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
