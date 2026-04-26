# ADR-002: Technology Stack

## Status

Accepted

## Context

We need to choose technologies for building a full-stack Learning Management System with:

- Separate teacher and student portals
- Scalable backend API
- Real-time features potential
- Mobile-responsive design
- Easy maintenance and scaling

## Decision

We will use the following technology stack:

### Frontend

- **Next.js 15** with App Router for both portals
  - Server Components by default for performance
  - Route groups for role-based separation
  - Built-in optimization features
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **shadcn/ui** inspired components in shared package
- **Lucide React** for icons

### Backend

- **Python 3.11** with **FastAPI**
  - High performance async framework
  - Automatic OpenAPI documentation
  - Pydantic for validation
- **PostgreSQL** as primary database
- **Prisma ORM** for database access
- **Redis** for caching
- **JWT** for authentication

### DevOps

- **Docker & Docker Compose** for containerization
- **Nginx** as reverse proxy (future)
- **GitHub Actions** for CI/CD
- **Pytest** for Python testing
- **Jest** for JavaScript testing

## Consequences

### Positive

- Modern, performant stack
- Type safety across frontend and backend
- Good developer experience
- Strong community support
- Scalable architecture
- Good testing support

### Negative

- Learning curve for team unfamiliar with any of these
- Requires knowledge of both JavaScript/TypeScript and Python
- Monorepo complexity
- More complex deployment than single language stack

## Alternatives Considered

1. **Node.js backend (Express/NestJS)**: More consistent stack but Python's data processing libraries are stronger for potential AI features
2. **Vue.js frontend**: Good but Next.js ecosystem and App Router features are superior
3. **Django backend**: More batteries-included but less async support than FastAPI
4. **MongoDB**: PostgreSQL's relational nature fits LMS data better
