---
name: Project Context
description: Key information about the NextGenTra LMS project
type: project
---

# NextGenTra LMS - Project Context

## Project Identity

- **Name**: NextGenTra LMS
- **Purpose**: Full-stack Learning Management System with separate teacher and student portals
- **Status**: Production Ready (Infrastructure Complete, Features to Build)
- **Architecture**: Monorepo with NPM workspaces + Turborepo

## Tech Stack (Must Use)

- **Frontend**: Next.js 15, TypeScript 5.4, Tailwind CSS 3.4
- **Backend**: Python 3.11, FastAPI 0.110, Prisma ORM
- **Database**: PostgreSQL 17, Redis 7
- **DevOps**: Docker Compose, GitHub Actions, Dependabot

## Key Conventions (Non-Negotiable)

### 1. Monorepo Structure

- `apps/` - teacher-portal (3000), student-portal (3001)
- `packages/` - @nextgentra/ui, @nextgentra/utils, @nextgentra/config
- `backend/` - Python FastAPI service
- Always use workspace imports: `@nextgentra/ui`, NOT relative paths

### 2. TypeScript Strict Mode

- No `any` types allowed (ESLint rule)
- All functions must have return types
- All component props must have interfaces
- Use types from `@nextgentra/utils/types`

### 3. Next.js 15 Best Practices

- Server Components by DEFAULT (no "use client")
- Only use "use client" for: useState, useEffect, event handlers, browser APIs
- Use Route Groups: `(teacher)`, `(student)` for role-based layouts
- Data fetching: Direct `await` in Server Components

### 4. Backend Layered Architecture

```
API Router → Service Layer → Database (Prisma)
```

- Services contain business logic
- Schemas in `backend/app/schemas/` (Pydantic)
- Always use async/await

### 5. API Contract

- RESTful endpoints under `/api/v1/`
- JWT authentication required (except /health, /auth/\*)
- Response format: `{ "data": ..., "meta": {...} }`
- Error format: `{ "error": "...", "message": "..." }`
- See OpenAPI spec at `docs/api/openapi.yaml`

## Important Files

### Configuration

- `package.json` - Root workspace config with scripts
- `turbo.json` - Build pipeline (uses `tasks`, not `pipeline`)
- `.eslintrc.js` - ESLint configuration (ESLint 8.57.1)
- `commitlint.config.js` - Conventional Commits
- `.lintstagedrc.json` - Pre-commit hooks

### Documentation (Read These)

- `CLAUDE.md` - AI assistant guide (THIS IS KEY!)
- `README.md` - Project overview for humans
- `DEVELOPMENT.md` - Complete dev setup guide
- `CONTRIBUTING.md` - Contribution guidelines
- `docs/conventions/coding-standards.md` - Detailed standards
- `docs/adrs/` - Architecture Decision Records

### TypeScript Types

- `packages/utils/types/index.ts` - All frontend types
- These MUST match backend Pydantic schemas

## Common Commands

```bash
make help              # Show all commands
make dev               # Start everything (Docker)
make build             # Build all apps
make lint              # ESLint
make type-check        # TypeScript check
make test              # Run tests
make ci-check          # Run all CI checks locally
npm run docker:up      # Start PostgreSQL + Redis + Backend
```

### Direct npm commands (via Turborepo)

```bash
npm run build          # turbo run build
npm run lint           # turbo run lint
npm run test           # turbo run test
npm run type-check     # turbo run type-check
```

## Development Workflow

1. **Start**: `make dev` or `npm run docker:up && npm run dev:teacher`
2. **Hot reload**: All apps support hot reload
3. **Database**: Use Prisma Studio: `npm run db:studio`
4. **API Docs**: http://localhost:8000/docs (when backend running)

## Ports

- Teacher Portal: http://localhost:3000
- Student Portal: http://localhost:3001
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- Prisma Studio: http://localhost:5555

## Critical Rules (Do NOT Violate)

1. **NEVER** use relative imports to packages
   - ✅ `import { Button } from "@nextgentra/ui"`
   - ❌ `import { Button } from "../../packages/ui/components/button"`

2. **ALWAYS** add types to function parameters and returns
   - ✅ `function fetchCourse(id: string): Promise<Course>`
   - ❌ `function fetchCourse(id)`

3. **NEVER** hardcode secrets
   - ✅ Use `backend/.env` with `.env.example` template
   - ❌ `SECRET_KEY = "my-secret-key"`

4. **ALWAYS** use ESLint + Prettier before committing
   - Husky hooks will run lint-staged automatically
   - Fix errors: `npm run lint:fix`

5. **NEVER** commit without passing CI
   - Run `make ci-check` locally first
   - GitHub Actions will block failing PRs

## Common Gotchas

### Path Resolution

The `@nextgentra/*` imports work because of tsconfig `paths`:

```json
{
  "paths": {
    "@ui/*": ["packages/ui/*"],
    "@utils/*": ["packages/utils/*"],
    "@config/*": ["packages/config/*"]
  }
}
```

### ESLint Version

Using ESLint 8.57.1 (pinned). DO NOT upgrade to v9+ without testing.

### Tailwind Config

Both apps import shared config: `import sharedConfig from "@nextgentra/config/tailwind/shared"`
Add app-specific content paths in each app's `tailwind.config.ts`.

### Testing on Windows

Backend dependencies (psycopg2-binary, pydantic-core) need Rust compiler.
**Solution**: Use Docker Compose for backend. Frontend works fine on Windows.

## When Adding New Features

1. Check if shared component needed → Add to `@nextgentra/ui`
2. Check if new types needed → Add to `@nextgentra/utils/types`
3. Check if new API endpoint needed → Follow `docs/conventions/task-templates.md`
4. Update OpenAPI spec: `docs/api/openapi.yaml`
5. Add ADR if architectural change: `docs/adrs/`

## Need Help?

1. Read `CLAUDE.md` (AI-specific guide)
2. Check `docs/conventions/coding-standards.md`
3. Look at existing code for patterns
4. Run `make help` for commands
5. Check `package.json` scripts

---

**Last Updated**: 2025-04-25
**Maintainer**: NextGenTra Team
