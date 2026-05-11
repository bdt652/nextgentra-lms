# Changelog

All notable changes to the NextGenTra LMS project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- Initial project structure with monorepo (backend, student-portal, teacher-portal)
- FastAPI backend with JWT authentication
- Next.js 16 student and teacher portals
- GitHub Actions CI/CD with Ruff, Black, MyPy, ESLint, Prettier, Jest
- Prisma ORM with PostgreSQL
- Husky + lint-staged for pre-commit hooks

### Changed
- N/A

### Deprecated
- N/A

### Removed
- N/A

### Fixed
- N/A

### Security
- N/A

---

## [1.0.0] - 2025-05-11

### Added
- Backend:
  - User authentication endpoints (`/auth/login`, `/auth/register`, `/auth/refresh`)
  - JWT token management (15-minute expiry, refresh tokens)
  - Password hashing with bcrypt
  - CORS middleware for development origins
- Frontends:
  - Next.js App Router structure
  - TypeScript strict mode
  - TailwindCSS v4 styling
  - ESLint + Prettier integration
  - Jest testing setup
- Database:
  - Prisma schema with User model
  - Initial migration
  - PostgreSQL datasource configuration

### Changed
- N/A

### Fixed
- N/A

---

## [0.1.0] - 2025-05-01 (Initial Development)

### Added
- Project scaffolding
- Basic authentication flow
- Template frontends
- CI pipeline foundation

---

## Types of Changes

- **Added** for new features.
- **Changed** for changes in existing functionality.
- **Deprecated** for soon-to-be removed features.
- **Removed** for now removed features.
- **Fixed** for any bug fixes.
- **Security** in case of vulnerabilities.

---

## Versioning Schema

This project uses [Semantic Versioning](https://semver.org/):

- **Major (X.0.0)**: Breaking changes that require migration effort
- **Minor (1.Y.0)**: Backward-compatible new features
- **Patch (1.2.Z)**: Backward-compatible bug fixes

While in `0.x.y` (pre-1.0), breaking changes may occur in minor versions.

---

## How to Update This File

When preparing a release:

1. Move all entries from `[Unreleased]` to a new section `## [X.Y.Z] - YYYY-MM-DD`
2. Add new changes to `[Unreleased]` as you develop
3. Group changes by category: Added, Changed, Deprecated, Removed, Fixed, Security
4. Link to relevant GitHub issues/PRs if helpful
5. Keep descriptions concise but informative

**Automation tip**: Use `npx conventional-changelog -p angular -i CHANGELOG.md -s -r 0` to generate from conventional commits.

---

**Note**: This template includes example entries. When you make your first actual release, replace the example entries with real changes.
