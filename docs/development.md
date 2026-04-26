# Development Guide

This guide helps new developers get started with the NextGenTra LMS project.

## Table of Contents

- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)
- [Useful Commands](#useful-commands)

## Quick Start

### Prerequisites Installation

1. **Node.js 18+** ([Download](https://nodejs.org/))

   ```bash
   node --version  # Should show v18+
   ```

2. **Python 3.11+** ([Download](https://www.python.org/downloads/))

   ```bash
   python --version  # Should show 3.11+
   pip --version
   ```

3. **Docker & Docker Compose** (optional but recommended)
   - Docker Desktop for Windows/Mac
   - Docker Engine for Linux

### First Setup

```bash
# 1. Clone repository
git clone <your-fork-url>
cd nextgentra-lms

# 2. Install dependencies
npm install

# 3. Copy environment files
cp backend/.env.example backend/.env
# Edit backend/.env if needed

# 4. Start with Docker (recommended)
npm run docker:up

# 5. Access the applications
# Teacher Portal: http://localhost:3000
# Student Portal: http://localhost:3001
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Alternative: Local Services

If not using Docker:

```bash
# 1. Install dependencies
npm install

# 2. Start PostgreSQL locally
# Create database: createdb lms

# 3. Start Redis locally
# redis-server

# 4. Setup backend
cd backend
python -m venv venv
# Activate: source venv/bin/activate (or venv\Scripts\activate on Windows)
pip install -r requirements.txt
npx prisma generate
npx prisma migrate dev

# 5. Start all services (in separate terminals or use tmux)
npm run dev:backend   # Terminal 1
npm run dev:teacher   # Terminal 2
npm run dev:student   # Terminal 3
```

## Project Structure

```
nextgentra-lms/
├── apps/
│   ├── teacher-portal/      # Next.js teacher portal
│   │   ├── app/(teacher)/   # Teacher routes (dashboard, courses, etc.)
│   │   ├── components/      # React components
│   │   ├── lib/             # API clients, utilities
│   │   └── package.json
│   └── student-portal/      # Next.js student portal
│       ├── app/(student)/   # Student routes (courses, lessons, etc.)
│       ├── components/
│       ├── lib/
│       └── package.json
├── packages/
│   ├── ui/                  # Shared UI components (@nextgentra/ui)
│   │   ├── components/      # Button, Card, Dialog, etc.
│   │   └── index.ts
│   ├── utils/               # Shared utilities (@nextgentra/utils)
│   │   ├── helpers/         # Date formatting, validation, etc.
│   │   ├── types/           # TypeScript interfaces
│   │   └── index.ts
│   └── config/              # Shared config (@nextgentra/config)
│       ├── constants/       # API URLs, constants
│       ├── tailwind/        # Tailwind config
│       └── index.ts
├── backend/                 # Python FastAPI backend
│   ├── app/
│   │   ├── api/            # API routers
│   │   │   ├── auth.py
│   │   │   ├── courses.py
│   │   │   ├── lessons.py
│   │   │   └── ...
│   │   ├── core/           # Config, security, database
│   │   ├── models/         # Prisma client usage
│   │   ├── schemas/        # Pydantic models
│   │   └── services/       # Business logic
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   ├── tests/
│   └── main.py             # FastAPI app entry
├── .github/
│   └── workflows/          # CI/CD pipelines
├── docs/
│   └── adrs/               # Architecture decisions
├── docker-compose.yml      # Local dev orchestration
├── turbo.json              # Turborepo config
├── package.json            # Root monorepo config
└── Makefile                # Common tasks

```

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

### 2. Make Changes

Follow the coding standards:

- TypeScript strictly (no `any`)
- Follow ESLint rules
- Add tests for new features
- Update documentation

### 3. Run Checks Locally

```bash
# Run all checks
make ci-check

# Or individually
make lint
make type-check
make test
```

### 4. Commit Changes

```bash
git add .
git commit -m "feat(portal): add user dashboard"
# Husky will run lint-staged automatically
```

Commit message format: `type(scope): description`

Types: feat, fix, docs, style, refactor, perf, test, chore, build, ci

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Create a Pull Request on GitHub with:

- Clear description of changes
- Reference to any related issues
- Screenshots for UI changes
- Testing instructions

### 6. Code Review

- Address review comments
- Make requested changes
- Squash commits if needed
- Get approval and merge

## Common Tasks

### Adding a New API Endpoint

1. Define Pydantic schema in `backend/app/schemas/`
2. Create router in `backend/app/api/`
3. Add service method if needed in `backend/app/services/`
4. Update tests
5. Add frontend API client method in `apps/*/lib/api/`

### Adding a Shared Component

1. Create component in `packages/ui/components/`
2. Add to `packages/ui/index.ts`
3. Use in apps: `import { Button } from "@nextgentra/ui"`
4. Add tests if reusable

### Database Schema Changes

1. Edit `backend/prisma/schema.prisma`
2. Run migration:
   ```bash
   cd backend
   npx prisma migrate dev --name your_migration_name
   ```
3. Update affected schemas and services

### Adding a New Page

**Teacher Portal:**

- Create in `apps/teacher-portal/app/(teacher)/new-page/page.tsx`
- Add to navigation if needed

**Student Portal:**

- Create in `apps/student-portal/app/(student)/new-page/page.tsx`

## Troubleshooting

### Issue: "Module not found" errors

**Solution:** Make sure you've run `npm install` at root. Shared packages are symlinked via workspaces.

### Issue: Backend won't start

**Solution:**

1. Check Python version: `python --version` (needs 3.11+)
2. Install dependencies: `cd backend && pip install -r requirements.txt`
3. Generate Prisma client: `cd backend && npx prisma generate`
4. Check database connection in `.env`

### Issue: Docker services not starting

**Solution:**

```bash
# Check Docker is running
docker ps

# Rebuild
npm run docker:down
docker system prune -a
npm run docker:up
```

### Issue: Tests failing

**Solution:**

```bash
# Clear caches
rm -rf .next coverage node_modules/.cache

# Reinstall
npm install

# Run specific test file
npm run test -- --testPathPattern=my-test-file
```

### Issue: Port already in use

**Solution:**

```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9  # or 3001, 8000

# Or change ports in next.config.ts
```

## Useful Commands

See `Makefile` for comprehensive commands:

```bash
make help           # Show all commands
make dev            # Start all dev servers
make build          # Build all apps
make lint           # Run linter
make test           # Run tests
make format         # Format code
make docker-up      # Start Docker
make db-migrate     # Run migrations
```

Or use npm scripts:

```bash
npm run dev         # Start everything
npm run build       # Build all
npm run test        # Run tests
npm run lint        # Lint code
npm run type-check  # Type checking
```

## IDE Setup

### VS Code (Recommended)

Install extensions:

- ESLint
- Prettier
- Python
- Pylance
- Tailwind CSS IntelliSense

Settings (`.vscode/settings.json`):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

### PyCharm / IntelliJ

1. Open backend/ as project
2. Configure Python interpreter
3. Install required plugins: Python, .env files

## Getting Help

- Read the [README.md](README.md) for project overview
- Check [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines
- Review [docs/adrs/](docs/adrs/) for architecture decisions
- Search existing [GitHub Issues](https://github.com/your-org/nextgentra-lms/issues)
- Ask in team Slack/Discord channel

## Next Steps

- Read [DEPLOYMENT.md](DEPLOYMENT.md) for production setup
- Review [SECURITY.md](SECURITY.md) for security practices
- Explore the codebase structure
- Check out the API docs at http://localhost:8000/docs when running

Happy coding!
