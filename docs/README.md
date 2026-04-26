# Documentation Index

Welcome to the NextGenTra LMS documentation! This index helps you find the right guide for your needs.

## 📚 Core Documentation

| Document                                    | Purpose                                   | Audience                |
| ------------------------------------------- | ----------------------------------------- | ----------------------- |
| [README.md](../README.md)                   | Project overview, quick start, tech stack | Everyone                |
| [CLAUDE.md](../CLAUDE.md)                   | AI assistant (Claude Code) guide          | AI/Developers           |
| [CONTRIBUTING.md](../CONTRIBUTING.md)       | How to contribute, PR process             | Contributors            |
| [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md) | Community guidelines                      | Everyone                |
| [SECURITY.md](../SECURITY.md)               | Security policy, vulnerability reporting  | Security team, all devs |
| [CHANGELOG.md](../CHANGELOG.md)             | Version history, release notes            | Everyone                |

## 🛠️ Development Guides

### [Development Guide](development.md)

Complete guide for setting up and developing the LMS:

- Prerequisites and installation
- Project structure explained
- Development workflow
- Common tasks and troubleshooting
- IDE setup recommendations

### [Deployment Guide](deployment.md)

Production deployment instructions:

- Environment setup
- Docker and manual deployment options
- SSL/HTTPS configuration
- Database setup and backups
- Monitoring and scaling
- Maintenance procedures

## 📐 Standards & Conventions

### [Coding Standards](conventions/coding-standards.md)

Comprehensive coding standards for:

- Frontend (Next.js, TypeScript, React)
- Backend (FastAPI, Python)
- Testing patterns
- Error handling
- Security checklist
- Anti-patterns to avoid

### [Task Templates](conventions/task-templates.md)

Templates for common development tasks:

- New feature implementation
- API endpoint addition
- Refactoring
- Bug fixes
- Database migrations
- Performance optimization
- Security fixes

### [Cleanup Plan](conventions/cleanup-summary.md)

File organization and cleanup strategies:

- What is considered "junk" files
- Prevention mechanisms
- Scaffolds usage
- Clean commands

## 🏗️ Architecture

### [Architecture Decision Records (ADRs)](adrs/README.md)

Important architectural decisions documented:

- [ADR-001: Monorepo Structure](adrs/adr-001-monorepo-structure.md)
- [ADR-002: Technology Stack](adrs/adr-002-technology-stack.md)
- [ADR-003: Authentication Strategy](adrs/adr-003-authentication-strategy.md)
- [ADR-004: API Design](adrs/adr-004-api-design.md)

## 🔌 API Documentation

### [OpenAPI Specification](../docs/api/openapi.yaml)

Complete API specification in OpenAPI 3.1 format:

- All endpoints with methods
- Request/response schemas
- Authentication requirements
- Error codes and responses

**Interactive Docs**: When backend is running, visit `http://localhost:8000/docs` for Swagger UI.

## 🧠 AI Development

### [Claude Code Guide](../CLAUDE.md)

Special instructions for Claude Code and AI assistants:

- Project architecture rules
- Coding conventions
- API contracts
- Task templates
- Common patterns

### [Memory Files](../.claude/memory/)

Auto-loaded context for Claude Code:

- `project.md` - Project context and rules
- `user.md` - Developer preferences
- `reference.md` - External resources

## 🚀 Quick Reference

### Common Commands

```bash
# Development
make dev              # Start all services
make dev-teacher      # Teacher portal only
make dev-student      # Student portal only
make dev-backend      # Backend only

# Quality
make lint             # Run linter
make type-check       # TypeScript check
make test             # Run tests
make ci-check         # All CI checks locally

# Build
make build            # Production build
make docker-up        # Start Docker services
make db-studio        # Open Prisma Studio

# Cleanup
make clean            # Clean build artifacts
make clean-all        # Clean everything
```

### Project Structure

```
nextgentra-lms/
├── apps/              # Frontend applications
│   ├── teacher-portal/    # Teacher UI (port 3000)
│   └── student-portal/    # Student UI (port 3001)
├── packages/          # Shared libraries
│   ├── ui/                 # Reusable components
│   ├── utils/              # Utilities & types
│   └── config/             # Configuration
├── backend/           # FastAPI backend
│   ├── app/
│   │   ├── api/            # REST endpoints
│   │   ├── core/           # Config & security
│   │   ├── services/       # Business logic
│   │   └── schemas/        # Pydantic models
│   ├── prisma/             # Database schema
│   └── tests/
├── docs/              # This documentation
├── scaffolds/         # Code templates
└── .claude/memory/   # AI context files
```

### Ports & URLs

| Service        | Port | URL                        |
| -------------- | ---- | -------------------------- |
| Teacher Portal | 3000 | http://localhost:3000      |
| Student Portal | 3001 | http://localhost:3001      |
| Backend API    | 8000 | http://localhost:8000      |
| API Docs       | 8000 | http://localhost:8000/docs |
| Prisma Studio  | 5555 | http://localhost:5555      |

### Tech Stack

- **Frontend**: Next.js 15, TypeScript 5.4, Tailwind CSS 3.4
- **Backend**: Python 3.11, FastAPI 0.110, Prisma ORM
- **Database**: PostgreSQL 17, Redis 7
- **DevOps**: Docker Compose, GitHub Actions, Turborepo

## 🔍 Finding Specific Information

### "How do I add a new API endpoint?"

1. Read [Task Templates](conventions/task-templates.md#api-endpoint-addition)
2. Follow the scaffold in `scaffolds/api/`
3. Update OpenAPI spec at `docs/api/openapi.yaml`

### "How do I create a new component?"

1. Copy from `scaffolds/components/`
2. Follow [Coding Standards](conventions/coding-standards.md#component-structure)
3. Add tests using `scaffolds/tests/component.test.tsx`

### "How do I deploy to production?"

See [Deployment Guide](deployment.md) for complete instructions.

### "What are the coding conventions?"

See [Coding Standards](conventions/coding-standards.md) for detailed rules.

### "How do I fix a bug?"

Follow the [Bug Fix Template](conventions/task-templates.md#bug-fix).

## 📖 Documentation Standards

All documentation should:

- Use clear, concise language
- Include code examples where helpful
- Keep up-to-date with code changes
- Follow markdown best practices
- Include links to related documents

## 🤝 Contributing to Documentation

Found an issue or want to improve docs?

1. Check [CONTRIBUTING.md](../CONTRIBUTING.md)
2. Make changes in a feature branch
3. Test that links work correctly
4. Submit a PR with clear description

## 📞 Getting Help

- **Code questions**: Check [DEVELOPMENT.md](development.md) first
- **Architecture**: Review [ADRs](adrs/)
- **AI assistance**: See [CLAUDE.md](../CLAUDE.md)
- **Issues**: Create GitHub issue
- **Security**: See [SECURITY.md](../SECURITY.md)

---

**Last Updated**: 2025-04-25  
**Maintained by**: NextGenTra Team  
**Documentation Version**: 1.0.0
