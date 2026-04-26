# ADR-001: Monorepo Structure

## Status

Accepted

## Context

We need to manage multiple related projects: teacher portal, student portal, shared packages, and backend API. We need a structure that allows:

- Shared code between frontend apps
- Unified dependency management
- Consistent tooling across all packages
- Easy CI/CD configuration
- Simple deployment

## Decision

We will use a **monorepo** structure with **NPM Workspaces** and **Turborepo** for build orchestration.

```
nextgentra-lms/
├── apps/
│   ├── teacher-portal/  (Next.js)
│   └── student-portal/  (Next.js)
├── packages/
│   ├── ui/              (Shared UI components)
│   ├── utils/           (Shared utilities)
│   └── config/          (Shared configuration)
├── backend/             (Python FastAPI)
├── package.json         (Root with workspaces)
└── turbo.json           (Build pipeline)
```

## Consequences

### Positive

- Single source of truth for all code
- Unified versioning and dependency management
- Easy to make cross-cutting changes
- Shared tooling and configuration
- Efficient build caching with Turborepo
- Atomic commits across packages

### Negative

- Larger repository size
- All packages coupled to same release cycle
- Requires understanding of monorepo structure
- More complex initial setup

## Alternatives Considered

1. **Multiple repositories**: More independent but harder to share code
2. **Yarn workspaces only**: No build caching or advanced orchestration
3. **Nx**: More features but steeper learning curve

We chose NPM Workspaces + Turborepo for its simplicity and effectiveness.
