# Development Workflow Guide

This document outlines the complete workflow to ensure code quality and successful CI/CD pipeline execution.

## Quick Start Checklist

Before pushing code to GitHub, run these checks locally:

```bash
# 1. Format code
npm run format

# 2. Run linting
npm run lint

# 3. Type check
npm run type-check

# 4. Run tests
npm run test

# 5. OR just push - pre-push hook will run all checks automatically
git push
```

---

## Pre-Push Hooks (Automatic)

Husky pre-push hook automatically runs these checks **before every push**:

1. **ESLint** - Code quality and style
2. **Prettier** - Code formatting verification
3. **TypeScript** - Type checking
4. **Tests** - All test suites
5. **Placeholder check** - No TODO/FIXME comments

If any check fails, the push is blocked. Fix the errors and try again.

---

## CI/CD Pipeline

The GitHub Actions CI/CD pipeline runs on every push to `main` and `develop` branches, and on every PR.

### CI Pipeline (`ci.yml`)

Runs on **push** and **pull_request** to `main` and `develop`:

1. **Lint Job**
   - ESLint
   - Prettier check
   - TypeScript type check

2. **Test Job**
   - PostgreSQL service (for backend tests - future)
   - Redis service (for caching - future)
   - Frontend tests (Jest)
   - Coverage report upload to Codecov

3. **Build Job** (if lint & test pass)
   - Build all applications with Turborepo
   - Upload build artifacts

### Deploy Pipeline (`deploy.yml`)

Runs on **push** to `main` only:

1. **Test Job** (on self-hosted runner)
   - Lint
   - Type check
   - Frontend tests

2. **Deploy Job** (if tests pass)
   - SSH to production server
   - Pull latest code
   - Install dependencies
   - Build applications
   - Docker Compose down/up
   - Health checks

---

## Common Issues & Solutions

### Issue: Prettier check fails on Python files in `scaffolds/`

**Solution:** The `scaffolds/` directory contains template files (Python) that shouldn't be formatted. `.prettierignore` excludes this directory.

```bash
# Verify prettier ignores scaffolds
npx prettier --check "**/*.{ts,tsx,md,json,yml,yaml}"
```

### Issue: Deploy workflow fails - workspace not found

**Solution:** Workspace names in `deploy.yml` should NOT include the `@nextgentra/` prefix.

```yaml
# CORRECT
run: npm run test --workspace=teacher-portal
npm run build --workspace=teacher-portal

# WRONG
run: npm run test --workspace=@nextgentra/teacher-portal
```

### Issue: Commitlint fails with "Cannot use import statement"

**Solution:** `commitlint.config.cjs` must use CommonJS syntax (`.cjs` extension):

```javascript
// CORRECT
const { defineConfig } = require('@commitlint/cli')
module.exports = defineConfig({...})

// WRONG
import { defineConfig } from 'commitlint'
export default defineConfig({...})
```

---

## Manual Commands Reference

### Root Level (monorepo)

```bash
# Development
npm run dev                 # Start all dev servers
npm run dev:teacher         # Teacher portal only
npm run dev:student         # Student portal only
npm run dev:backend         # Backend API only

# Code Quality
npm run lint                # Lint all packages
npm run lint:fix            # Lint and auto-fix
npm run type-check          # TypeScript check
npm run format              # Format with Prettier

# Testing
npm run test                # Run all tests
npm run test:coverage       # With coverage
npm run test:backend        # Backend tests (when implemented)

# Build
npm run build               # Build all packages
npm run build:all           # Build in parallel

# Database
npm run db:migrate          # Run Prisma migrations
npm run db:seed             # Seed database
npm run db:studio           # Open Prisma Studio

# Docker
npm run docker:up           # Start all services
npm run docker:down         # Stop all services
npm run docker:logs         # View logs
```

### Per Package

```bash
# Navigate to package
cd apps/teacher-portal

# Package-specific commands
npm run lint
npm run test
npm run build
```

---

## Git Workflow

### Branch Strategy

```
main       - Production ready
develop    - Integration branch
feature/*  - New features
fix/*      - Bug fixes
hotfix/*   - Critical production fixes
```

### Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting (no code change)
- refactor: Code restructuring
- perf: Performance improvement
- test: Test-related
- chore: Build/ tooling changes
- build: Build system changes
- ci: CI/CD changes
- revert: Revert commit
```

Examples:

```bash
git commit -m "feat(auth): implement JWT refresh flow"
git commit -m "fix(courses): correct enrollment validation"
git commit -m "ci: update GitHub Actions workflow"
```

---

## Environment Setup

### Prerequisites

- Node.js 18+
- npm 9+
- Python 3.11 (for backend - coming soon)
- Docker & Docker Compose (optional, for services)
- PostgreSQL 17 (optional, for local DB)

### First Time Setup

```bash
# Install dependencies
npm install

# Setup environment files
cp .env.example .env.local  # Frontend
# Backend .env will be added when backend is implemented

# Start development
npm run dev
```

---

## Troubleshooting

### Pre-push hook failing

```bash
# Check which check is failing
# Logs are saved to:
# - /tmp/husky-lint.log
# - /tmp/husky-prettier.log
# - /tmp/husky-type-check.log
# - /tmp/husky-test.log

# Bypass hooks (use sparingly!)
git push --no-verify
```

### CI/CD failing

1. Replicate locally: Run all commands in CI script
2. Check environment differences
3. Review GitHub Actions logs in browser for full details

### Build failing

```bash
# Clean and rebuild
rm -rf .next node_modules
npm install
npm run build
```

---

## Need Help?

- Check [CLAUDE.md](CLAUDE.md) for project architecture
- Check [DEVELOPMENT.md](DEVELOPMENT.md) for detailed setup
- Open an issue on GitHub

---

**Last Updated**: 2025-04-26
**Maintainer**: NextGenTra Team
