# Contributing to NextGenTra LMS

Thank you for your interest in contributing to NextGenTra LMS! This document provides guidelines and information for contributors.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Accept responsibility and apologize for mistakes

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL (optional if using Docker)
- Redis (optional if using Docker)

### Setup

1. Fork and clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment files:
   ```bash
   cp backend/.env.example backend/.env
   ```
4. Start with Docker (recommended):
   ```bash
   npm run docker:up
   ```
5. Or start services individually:
   ```bash
   npm run dev
   ```

### Development Workflow

1. Create a feature branch:

   ```bash
   git checkout -b feature/amazing-feature
   ```

2. Make your changes following our coding standards

3. Run checks before committing:

   ```bash
   npm run lint
   npm run type-check
   npm run test
   ```

4. Commit with conventional commit messages:

   ```bash
   git commit -m "feat(portal): add user dashboard"
   ```

5. Push and create a Pull Request:
   ```bash
   git push origin feature/amazing-feature
   ```

## Conventional Commits

We follow [Conventional Commits](https://www.conventionalcommits.org/). Format:

```
type(scope?): description

body?

footer?
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Formatting, missing semicolons, etc. (no code change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Changes to build process or auxiliary tools
- `build`: Changes that affect the build system or external dependencies
- `ci`: Changes to CI configuration files and scripts
- `revert`: Revert a previous commit

**Examples:**

```
feat(auth): implement JWT token refresh
fix(api): correct course enrollment validation
docs(readme): update installation instructions
test(portal): add component tests for dashboard
```

## Code Style

- Use TypeScript strictly (no `any`)
- Follow ESLint and Prettier configuration
- 2 spaces for indentation
- Single quotes for strings
- Semicolons required
- Use meaningful variable/function names
- Add JSDoc comments for complex functions

## Project Structure

```
nextgentra-lms/
├── apps/
│   ├── teacher-portal/     # Next.js app for teachers
│   └── student-portal/     # Next.js app for students
├── packages/
│   ├── ui/                 # Shared UI components
│   ├── utils/              # Shared utilities
│   └── config/             # Shared configuration
├── backend/                # Python FastAPI backend
│   ├── app/
│   │   ├── api/           # API routes
│   │   ├── core/          # Core config
│   │   ├── models/        # Data models
│   │   ├── schemas/       # Pydantic schemas
│   │   └── services/      # Business logic
│   ├── prisma/
│   └── tests/
├── .github/
│   └── workflows/         # CI/CD pipelines
└── docker-compose.yml     # Full stack orchestration
```

## Testing

### Frontend Tests

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Backend Tests

```bash
cd backend
python -m pytest tests/ -v
python -m pytest tests/ --cov=app --cov-report=html
```

## Pull Request Process

1. Ensure all tests pass
2. Update documentation if needed
3. Fill out PR template completely
4. Request review from appropriate team members
5. Address review comments
6. Squash and merge when approved

## Code Review Guidelines

- Focus on code quality, readability, and maintainability
- Check for proper error handling
- Verify tests are adequate
- Look for potential security issues
- Ensure TypeScript types are properly defined

## Architecture Guidelines

### Frontend (Next.js)

- Use Server Components by default
- "use client" only when interactive
- Shared UI in `@nextgentra/ui`
- API calls via `fetch` to `http://localhost:8000/api/v1`
- Type-safe responses using `@nextgentra/utils`

### Backend (FastAPI)

- Async functions with `await`
- Pydantic schemas for validation
- Prisma for database operations
- JWT authentication
- Follow layered architecture: API → Services → Models

## Questions?

Contact the maintainers or open an issue for clarification.
