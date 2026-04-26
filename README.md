# NextGenTra LMS

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-336791.svg)

A modern, full-stack Learning Management System built with separate teacher and student portals. Features a Python FastAPI backend and two Next.js frontends with a comprehensive development infrastructure.

## Features

- **Monorepo Architecture**: NPM workspaces with Turborepo for efficient builds
- **Role-Based Portals**: Separate teacher and student interfaces
- **Type-Safe**: Full TypeScript coverage across frontend and shared packages
- **Production Ready**: Docker Compose, CI/CD, automated testing
- **Developer Experience**: ESLint, Prettier, Husky hooks, comprehensive documentation

## 📚 Quick Links

- [📖 Documentation](docs/README.md) - Complete documentation index
- [🚀 Quick Start](#quick-start)
- [🏗️ Architecture](#architecture)
- [🤝 Contributing](CONTRIBUTING.md)
- [🔒 Security](SECURITY.md)
- [📋 Development Guide](docs/development.md)
- [🚢 Deployment](docs/deployment.md)
- [📝 Changelog](CHANGELOG.md)

## Tech Stack

### Frontend

- **Next.js 15** with App Router
- **TypeScript 5.4**
- **Tailwind CSS** with custom shadcn/ui components
- **Lucide React** icons

### Backend

- **Python 3.11** with **FastAPI**
- **Prisma ORM** for database management
- **PostgreSQL 17** as primary database
- **Redis 7** for caching and sessions
- **JWT** authentication

### DevOps & Quality

- **Turborepo** for build orchestration and caching
- **GitHub Actions** CI/CD with automated testing
- **Dependabot** for dependency updates
- **Docker Compose** for containerization
- **ESLint + Prettier** for code quality
- **Husky** + **lint-staged** for git hooks
- **Jest** + **Testing Library** for frontend tests
- **Pytest** for backend tests

## Documentation

| Document                           | Purpose                                 |
| ---------------------------------- | --------------------------------------- |
| [README.md](README.md)             | This file - project overview            |
| [DEVELOPMENT.md](DEVELOPMENT.md)   | Complete development setup and workflow |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution guidelines and processes   |
| [DEPLOYMENT.md](DEPLOYMENT.md)     | Production deployment guide             |
| [SECURITY.md](SECURITY.md)         | Security policy and reporting           |
| [CHANGELOG.md](CHANGELOG.md)       | Version history and changes             |
| [docs/adrs/](docs/adrs/)           | Architecture decision records           |

## Architecture

```
nextgentra-lms/
├── apps/                    # Application code
│   ├── teacher-portal/     # Next.js 15 (port 3000)
│   └── student-portal/     # Next.js 15 (port 3001)
├── packages/               # Shared libraries
│   ├── ui/                 # @nextgentra/ui components
│   ├── utils/              # @nextgentra/utils helpers
│   └── config/             # @nextgentra/config settings
├── backend/                # Python FastAPI (port 8000)
│   ├── app/
│   │   ├── api/           # REST endpoints
│   │   ├── core/          # Config & security
│   │   ├── models/        # Data models
│   │   ├── schemas/       # Pydantic validation
│   │   └── services/      # Business logic
│   ├── prisma/            # Database schema
│   └── tests/             # Backend tests
├── .github/
│   └── workflows/         # CI/CD pipelines
└── docker-compose.yml     # Full stack orchestration
```

### Key Design Decisions

- **Monorepo**: Single repository for all packages with NPM workspaces
- **Separation of Concerns**: Distinct apps for teacher and student portals
- **Shared Packages**: Reusable UI components and utilities
- **Type Safety**: Full TypeScript with strict mode
- **RESTful API**: FastAPI with automatic OpenAPI documentation
- **Container-First**: Docker support for all services

## Quick Start

### Prerequisites

- Node.js 18+ ([Download](https://nodejs.org/))
- Python 3.11+ ([Download](https://www.python.org/downloads/))
- Docker & Docker Compose (recommended)

### 1. Clone and Install

```bash
# Clone repository
git clone <repository-url>
cd nextgentra-lms

# Install dependencies
npm install
```

### 2. Docker Setup (Recommended)

```bash
# Start all services (PostgreSQL, Redis, Backend)
npm run docker:up

# Access the applications:
# - Teacher Portal: http://localhost:3000
# - Student Portal: http://localhost:3001
# - Backend API: http://localhost:8000
# - API Documentation: http://localhost:8000/docs
```

### 3. Development Mode

```bash
# Install all workspace dependencies
npm install

# Start all development servers
npm run dev

# Or start individually:
npm run dev:teacher      # Teacher portal on port 3000
npm run dev:student      # Student portal on port 3001
npm run dev:backend      # Backend API on port 8000
```

### 4. Verify Setup

```bash
# Run linter
npm run lint

# Run type check
npm run type-check

# Run tests
npm run test

# Build all applications
npm run build
```

## API Endpoints

All endpoints are prefixed with `/api/v1`

### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user
- `POST /auth/refresh` - Refresh access token

### Courses

- `GET /courses` - List courses (with filters)
- `GET /courses/{id}` - Get course detail
- `POST /courses` - Create course (teacher only)
- `PUT /courses/{id}` - Update course
- `DELETE /courses/{id}` - Delete course

### Lessons

- `GET /lessons/course/{course_id}` - Get lessons for course
- `POST /lessons` - Create lesson
- `PUT /lessons/{id}` - Update lesson
- `DELETE /lessons/{id}` - Delete lesson

### Assignments

- `GET /assignments` - List assignments
- `GET /assignments/{id}` - Get assignment detail
- `POST /assignments` - Create assignment
- `PUT /assignments/{id}` - Update assignment
- `DELETE /assignments/{id}` - Delete assignment

### Submissions

- `GET /submissions` - List submissions (filterable)
- `POST /submissions` - Submit assignment
- `PATCH /submissions/{id}/grade` - Grade submission

See [API Documentation](http://localhost:8000/docs) when running locally.

## Database Schema

Key models:

- **User**: `id`, `email`, `name`, `role` (TEACHER/STUDENT/ADMIN)
- **Course**: `id`, `title`, `description`, `teacherId`, `status`
- **Lesson**: `id`, `courseId`, `title`, `content`, `order`, `videoUrl`
- **Enrollment**: `userId`, `courseId`, `progress`
- **Assignment**: `id`, `courseId`, `title`, `dueDate`, `points`
- **Submission**: `id`, `assignmentId`, `userId`, `grade`, `feedback`

## Development Commands

```bash
# Using Make (recommended)
make help            # Show all available commands
make dev             # Start all development servers
make test            # Run all tests
make lint            # Run linter
make build           # Build all applications
make docker-up       # Start Docker services

# Using npm scripts
npm run dev          # Start everything
npm run build        # Build all apps
npm run test         # Run tests
npm run lint         # Lint code
npm run type-check   # TypeScript checking
npm run format       # Format with Prettier
npm run ci-check     # Run all CI checks locally
```

See [DEVELOPMENT.md](DEVELOPMENT.md) for complete guide.

## Testing

### Frontend (Jest + Testing Library)

```bash
# Run tests
npm run test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Backend (Pytest)

```bash
cd backend
python -m pytest tests/ -v
python -m pytest tests/ --cov=app --cov-report=html
```

### CI/CD

All tests run automatically on:

- Pull requests to `main` and `develop`
- Pushes to `main` and `develop`
- Scheduled daily runs

See [`.github/workflows/`](.github/workflows/) for pipeline configuration.

## Code Quality

This project enforces:

- **TypeScript strict mode** - No `any` types
- **ESLint** - Code quality rules
- **Prettier** - Consistent formatting
- **Husky + lint-staged** - Pre-commit checks
- **Commitlint** - Conventional commits
- **Type checking** - All PRs must pass `tsc --noEmit`

## Shared Packages

### `@nextgentra/ui`

Reusable UI components with shadcn/ui style:

```tsx
import { Button, Card, Input } from '@nextgentra/ui';
```

### `@nextgentra/utils`

Shared utilities and types:

```tsx
import { formatDate, cn } from '@nextgentra/utils';
import { User, Course } from '@nextgentra/utils/types';
```

### `@nextgentra/config`

Shared configuration:

```tsx
import { API_BASE_URL, APP_NAME } from '@nextgentra/config';
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for:

- Development workflow
- Code of Conduct
- Pull request guidelines
- Conventional commits

## Security

For security issues, please see [SECURITY.md](SECURITY.md).

**Do not** open GitHub issues for security vulnerabilities.

## License

MIT - see [LICENSE](LICENSE) file.

## Support

- **Documentation**: Check [DEVELOPMENT.md](DEVELOPMENT.md) and [DEPLOYMENT.md](DEPLOYMENT.md)
- **Issues**: [GitHub Issues](https://github.com/your-org/nextgentra-lms/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/nextgentra-lms/discussions)

## Acknowledgments

Built with:

- [Next.js](https://nextjs.org/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Prisma](https://www.prisma.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Turborepo](https://turbo.build/)

---

**Made with ❤️ by NextGenTra Team**
