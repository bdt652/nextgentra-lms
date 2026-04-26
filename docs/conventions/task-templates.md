# Task Templates

Use these templates when starting new work. Copy to your planning document and fill in details.

---

## 🆕 Template: New Feature Implementation

```markdown
# Feature: [Feature Name]

## Goal

[Describe what this feature does and why]

## User Stories

- [ ] As a [role], I want [capability] so that [benefit]

## Technical Tasks

### Backend

- [ ] Update `backend/prisma/schema.prisma` with new models/fields
- [ ] Create migration: `npx prisma migrate dev --name feature_name`
- [ ] Add Pydantic schemas in `backend/app/schemas/feature.py`
- [ ] Implement service in `backend/app/services/feature_service.py`
- [ ] Create API router in `backend/app/api/feature.py`
- [ ] Add tests in `backend/tests/test_feature.py`
- [ ] Update `docs/api/openapi.yaml`

### Frontend (Teacher Portal)

- [ ] Create types in `packages/utils/types/feature.ts`
- [ ] Add API client methods in `apps/teacher-portal/lib/api/feature.ts`
- [ ] Build UI components in `apps/teacher-portal/components/Feature/`
- [ ] Create page in `apps/teacher-portal/app/(teacher)/feature/page.tsx`
- [ ] Add tests in `apps/teacher-portal/__tests__/Feature.test.tsx`

### Frontend (Student Portal)

- [ ] Reuse types from `@nextgentra/utils`
- [ ] Add API client methods if needed
- [ ] Build UI components if needed
- [ ] Create page in `apps/student-portal/app/(student)/feature/page.tsx`
- [ ] Add tests

### Shared UI (if reusable)

- [ ] Create component in `packages/ui/components/FeatureComponent.tsx`
- [ ] Export from `packages/ui/index.ts`
- [ ] Add stories if using Storybook
- [ ] Add tests

### Documentation

- [ ] Update `README.md` with feature description
- [ ] Add ADR if architectural decision needed
- [ ] Update `DEVELOPMENT.md` with usage instructions
- [ ] Update API documentation

## Dependencies

- [ ] Database migrations must run before frontend can use
- [ ] API endpoints must exist before frontend integration
- [ ] Shared packages need to be updated first

## Testing Strategy

- [ ] Unit tests for service layer (backend)
- [ ] Integration tests for API endpoints
- [ ] Component tests for UI
- [ ] E2E tests (future: Playwright)

## Rollback Plan

- [ ] Database: `prisma migrate resolve --rolled-back <migration>`
- [ ] Frontend: Revert commits
- [ ] API: Keep backwards compatibility where possible

## Notes

- [ ] Consider performance implications
- [ ] Add logging for debugging
- [ ] Consider error handling
- [ ] Add metrics/telemetry (future)
```

---

## 🔧 Template: API Endpoint Addition

````markdown
# API: [Endpoint Name]

## Endpoint

- **Method**: `GET|POST|PUT|DELETE|PATCH`
- **Path**: `/api/v1/resource`
- **Auth**: Required? (Yes/No)
- **Roles**: TEACHER, STUDENT, ADMIN, or PUBLIC

## Request

```json
{
  "field1": "string",
  "field2": "number"
}
```
````

## Response

```json
{
  "data": { ... },
  "meta": { ... }
}
```

## Error Codes

- `400` - Validation error
- `401` - Unauthorized
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `409` - Conflict (duplicate)
- `500` - Server error

## Implementation Steps

### 1. Schema (backend/app/schemas/)

```python
# resource.py
class ResourceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    # ...

class ResourceResponse(BaseModel):
    id: str
    name: str
    # ...

    class Config:
        from_attributes = True
```

### 2. Service (backend/app/services/)

```python
# resource_service.py
class ResourceService:
    @staticmethod
    async def create_resource(data: ResourceCreate, user_id: str):
        # Business logic
        pass
```

### 3. Router (backend/app/api/)

```python
# resource.py
@router.post("/resource", response_model=ResourceResponse)
async def create_resource(
    data: ResourceCreate,
    user=Depends(get_current_user)
):
    return await ResourceService.create_resource(data, user.id)
```

### 4. Frontend TypeScript Types

```typescript
// packages/utils/types/resource.ts
export interface Resource {
  id: string;
  name: string;
}
export interface ResourceCreate {
  name: string;
}
```

### 5. Frontend API Client

```typescript
// apps/*/lib/api/resource.ts
export async function fetchResource(id: string): Promise<Resource> {
  const res = await fetch(`${API_BASE_URL}/resource/${id}`);
  return res.json();
}
```

### 6. Tests

- [ ] Backend: unit tests for service, integration tests for endpoint
- [ ] Frontend: component tests that use the API

---

## 🔄 Template: Refactoring

```markdown
# Refactor: [Component/Module Name]

## Current State

[Describe current implementation and its problems]

## Desired State

[Describe target implementation]

## Why Refactor?

- [ ] Code duplication
- [ ] Too complex (high cyclomatic complexity)
- [ ] Poor performance
- [ ] Hard to test
- [ ] Violates single responsibility
- [ ] Outdated patterns

## Steps

### 1. Analysis

- [ ] Identify all usages
- [ ] Document current behavior
- [ ] Add/update tests to capture current behavior

### 2. Extract

- [ ] Create new implementation
- [ ] Keep old implementation temporarily
- [ ] Use feature flag if needed

### 3. Migrate

- [ ] Update consumers one by one
- [ ] Run tests after each change
- [ ] Verify behavior unchanged

### 4. Cleanup

- [ ] Remove old implementation
- [ ] Remove feature flags
- [ ] Update documentation

## Risk Mitigation

- [ ] Have rollback plan
- [ ] Keep old code until new is verified
- [ ] Test thoroughly in staging
- [ ] Monitor after deployment

## Success Criteria

- [ ] All tests pass
- [ ] No regressions in functionality
- [ ] Performance improved or maintained
- [ ] Code coverage maintained or improved
- [ ] Code complexity reduced
```

---

## 🐛 Template: Bug Fix

```markdown
# Bug: [Brief Description]

## Problem

[Detailed description of the bug]

## Steps to Reproduce

1. [First step]
2. [Second step]
3. [Expected vs Actual]

## Error Message/Logs
```

[Paste error here]

````

## Root Cause Analysis
[What's actually causing the bug?]

## Solution
[Describe the fix]

## Implementation

### Files to Change
- `path/to/file1.ts` - [what to change]
- `path/to/file2.py` - [what to change]

### Changes
```diff
- old code
+ new code
````

## Testing

### Reproduction Steps (Verify Fix)

1. [ ] Run same steps, bug should not occur
2. [ ] Test edge cases
3. [ ] Test related functionality

### Automated Tests

- [ ] Add test case that would have caught this bug
- [ ] Ensure existing tests still pass

## Regression Prevention

- [ ] Add validation/guard
- [ ] Add logging/alerting
- [ ] Update documentation to warn about this issue

## Checklist

- [ ] Fix implemented
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No side effects
- [ ] Lint passes
- [ ] Type-check passes
- [ ] Manual testing completed

````

---

## 📊 Template: Database Migration

```markdown
# Migration: [Migration Name]

## Purpose
[Why this migration is needed]

## Changes

### Schema Changes
```prisma
// Add to schema.prisma
model NewModel {
  id        String   @id @default(cuid())
  field     String
  created_at DateTime @default(now())
}
````

### Data Migration (if needed)

```sql
-- If adding non-nullable column with default:
ALTER TABLE "Course" ADD COLUMN "status" VARCHAR(20) NOT NULL DEFAULT 'draft';
UPDATE "Course" SET "status" = 'draft' WHERE "status" IS NULL;

-- If populating new field from existing data:
UPDATE "User" SET "avatar_url" = '/default-avatar.png' WHERE "avatar_url" IS NULL;
```

## Steps

### 1. Update Schema

- [ ] Edit `backend/prisma/schema.prisma`
- [ ] Add model/field with proper constraints

### 2. Create Migration

```bash
cd backend
npx prisma migrate dev --name migration_name
```

### 3. Review Generated Migration

- [ ] Check SQL is correct
- [ ] Verify no data loss
- [ ] Add data migration if needed

### 4. Test Migration

```bash
# On a copy of production data or test database
npx prisma migrate deploy
```

### 5. Update Code

- [ ] Update Prisma client: `npx prisma generate`
- [ ] Update Pydantic schemas if needed
- [ ] Update TypeScript types if needed
- [ ] Update seed data if needed

### 6. Deploy

- [ ] Backup production database
- [ ] Run migration in maintenance window if large
- [ ] Verify application works post-migration
- [ ] Monitor logs for errors

## Rollback Plan

```bash
# If migration causes issues:
npx prisma migrate resolve --rolled-back <migration_name>
# Restore from backup if data was modified
```

## Notes

- [ ] Consider zero-downtime strategies for large tables
- [ ] Add indexes for new queryable fields
- [ ] Consider partial indexes for filtered queries
- [ ] Test with production-like data volume

````

---

## 🎨 Template: New Shared Component

```markdown
# Component: [ComponentName]

## Purpose
[What does this component do? Who uses it?]

## Design
[Describe visual design, states, variants]

## API

### Props
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| variant | "default" \| "outline" \| "ghost" | No | "default" | Visual style |
| size | "sm" \| "md" \| "lg" | No | "md" | Size variant |
| children | React.ReactNode | Yes | - | Content |
| className | string | No | "" | Additional CSS classes |

### Events
| Event | Payload | Description |
|-------|---------|-------------|
| onClick | MouseEvent | Fired when clicked |

## Implementation

### 1. Create Component
```typescript
// packages/ui/components/[ComponentName].tsx
import { cn } from "../../utils/cn";
import type { ComponentProps } from "react";

interface [ComponentName]Props {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  className?: string;
}

export function [ComponentName]({
  variant = "default",
  size = "md",
  className,
  children,
  ...props
}: [ComponentName]Props & ComponentProps<"button">) {
  return (
    <button
      className={cn(
        "base-styles",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export type { [ComponentName]Props };
````

### 2. Export from Index

```typescript
// packages/ui/index.ts
export { [ComponentName] } from "./components/[ComponentName]";
export type { [ComponentName]Props } from "./components/[ComponentName]";
```

### 3. Add Variant Styles (if applicable)

```typescript
// packages/ui/utils/cn.ts or constants
const variantStyles = {
  default: 'bg-primary text-primary-foreground',
  outline: 'border border-input bg-background',
  ghost: 'bg-transparent hover:bg-accent',
};
```

### 4. Add Tests

```typescript
// packages/ui/__tests__/[ComponentName].test.tsx
describe("[ComponentName]", () => {
  it("renders children correctly", () => {
    render(<[ComponentName]>Hello</[ComponentName]>);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("applies variant class", () => {
    render(<[ComponentName] variant="outline">Test</[ComponentName]>);
    expect(screen.getByRole("button")).toHaveClass("border");
  });
});
```

### 5. Documentation

- [ ] Add prop table in comment
- [ ] Add usage examples
- [ ] Update `packages/ui/README.md`

## Usage Examples

```typescript
import { [ComponentName] } from "@nextgentra/ui";

// Default
<[ComponentName]>Click me</[ComponentName]>

// With variant
<[ComponentName] variant="outline">Cancel</[ComponentName]>

// With all props
<[ComponentName]
  variant="ghost"
  size="sm"
  onClick={handleClick}
  className="ml-2"
>
  Submit
</[ComponentName]>
```

## Checklist

- [ ] Component created with proper TypeScript types
- [ ] Exported from package index
- [ ] Tests written and passing
- [ ] Variants working correctly
- [ ] Accessibility (ARIA, keyboard navigation)
- [ ] Responsive design
- [ ] Documentation updated
- [ ] Storybook story (if applicable)

````

---

## 🧪 Template: Test Addition

```markdown
# Tests: [Component/Feature]

## What to Test
- [ ] Unit tests for pure functions
- [ ] Component rendering tests
- [ ] Interaction tests (user events)
- [ ] Integration tests (API + DB)
- [ ] Edge cases

## Test Structure

### Component Test Template
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Component } from '../Component';

describe('Component', () => {
  const defaultProps = {
    // ...
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<Component {...defaultProps} />);
    expect(screen.getByRole(...)).toBeInTheDocument();
  });

  it('displays children correctly', () => {
    render(<Component {...defaultProps}>Hello</Component>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handleClick = jest.fn();
    render(<Component {...defaultProps} onClick={handleClick} />);

    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<Component {...defaultProps} loading={true} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays error message', () => {
    render(<Component {...defaultProps} error="Something wrong" />);
    expect(screen.getByText('Something wrong')).toBeInTheDocument();
  });

  it('handles empty state', () => {
    render(<Component {...defaultProps} items={[]} />);
    expect(screen.getByText('No items found')).toBeInTheDocument();
  });
});
````

### Service Test Template

```python
import pytest
from app.services.feature_service import FeatureService

@pytest.mark.asyncio
async def test_service_method_success(mock_db):
    """Test happy path"""
    result = await FeatureService.method(params)
    assert result is not None
    assert result.field == expected_value

@pytest.mark.asyncio
async def test_service_method_handles_error(mock_db):
    """Test error handling"""
    with pytest.raises(ServiceError):
        await FeatureService.method(invalid_params)
```

## Running Tests

```bash
# All tests
npm run test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage

# Specific file
npm run test -- CourseCard.test.tsx

# Backend only
cd backend && python -m pytest tests/ -v
```

## Coverage Goals

- Components: 80%+
- Utilities: 90%+
- Services: 85%+
- API endpoints: 70%+

## Mocking Guidelines

- Mock external APIs
- Mock database (use test fixtures)
- Mock network requests
- Don't mock the code under test

## Test Data

- Use factories (factory-bot or simple factories)
- Keep test data minimal
- Use descriptive names

---

## 📦 Template: Dependency Addition

````markdown
# Dependency: [Package Name]

## Why Add This?

[Reason for adding this dependency]

## Package

- **Name**: `package-name`
- **Version**: `^x.y.z` or exact version `x.y.z`
- **Source**: npm / PyPI / Docker

## Evaluation

- [ ] License compatible with project (MIT, Apache-2.0, etc.)
- [ ] Active maintenance (last update < 1 year)
- [ ] Good documentation
- [ ] Adequate test coverage
- [ ] No security vulnerabilities (`npm audit`)
- [ ] Bundle size impact acceptable (< 100KB gzipped ideally)

## Alternatives Considered

- Alternative 1: [Why not chosen?]
- Alternative 2: [Why not chosen?]

## Implementation

### 1. Add to package.json

```bash
npm install package-name@^x.y.z
```
````

### 2. Update .gitignore if needed (some packages create cache dirs)

### 3. Create wrapper (optional but recommended)

```typescript
// lib/package-name-client.ts
import { something } from 'package-name';

export const packageNameClient = {
  something,
  // Wrap for easier testing/customization
};
```

### 4. Add TypeScript types (if needed)

Most packages include types. If not:

```bash
npm install -D @types/package-name
```

### 5. Document usage

Update `docs/conventions/coding-standards.md` or `CLAUDE.md` if this becomes a standard dependency.

### 6. Add tests

Write tests that use this dependency to ensure it works as expected.

## Rollback

```bash
npm uninstall package-name
# Revert any code changes that depend on it
```

## Notes

- [ ] Pin major version to avoid breaking changes
- [ ] Review changelog before upgrading
- [ ] Consider tree-shaking for large packages
- [ ] Check for peer dependencies

````

---

## 🔐 Template: Security Fix

```markdown
# Security: [Vulnerability Type]

## Vulnerability
- **CVE**: [CVE ID if applicable]
- **Severity**: Critical / High / Medium / Low
- **Package**: package-name@version
- **Issue**: [Brief description]

## Impact
[How does this affect the application? What data/systems are at risk?]

## Fix

### Immediate Actions
- [ ] Update dependency: `npm update package-name`
- [ ] If no fix available, remove dependency or implement workaround
- [ ] Rotate any compromised secrets

### Code Changes
- [ ] Add input validation
- [ ] Add output encoding
- [ ] Implement proper authentication/authorization
- [ ] Add rate limiting
- [ ] Sanitize user input

### Configuration
- [ ] Update CORS settings
- [ ] Enable security headers (CSP, HSTS)
- [ ] Configure HTTPS only
- [ ] Set secure cookies

## Verification

### Security Audit
```bash
npm audit
# or
npx audit-ci --moderate
````

### Manual Testing

- [ ] Try to reproduce vulnerability
- [ ] Verify fix prevents exploit
- [ ] Test with OWASP ZAP or similar tool

## Prevention

- [ ] Enable Dependabot alerts
- [ ] Set up automated security scanning in CI
- [ ] Regular security reviews
- [ ] Developer security training

## Timeline

- [ ] Fix deployed by: [date]
- [ ] Verification complete by: [date]
- [ ] Post-mortem if critical: [date]

---

## 🚀 Template: Performance Optimization

````markdown
# Performance: [Area to Optimize]

## Current Metrics

- [ ] LCP: [value]
- [ ] FCP: [value]
- [ ] TTI: [value]
- [ ] Bundle size: [value]
- [ ] API response time: [value]

## Target Metrics

- LCP: < 2.5s
- FCP: < 1.8s
- Bundle size: < 200KB (gzipped)

## Bottleneck Analysis

[What's causing the slowness? Use Chrome DevTools, Lighthouse, etc.]

## Optimization Strategies

### 1. Code Splitting

- [ ] Dynamic imports for heavy components
- [ ] Route-based code splitting (already with Next.js)
- [ ] Library-level splitting

### 2. Image Optimization

- [ ] Use Next.js Image component
- [ ] Convert to WebP/AVIF
- [ ] Lazy load below-the-fold images
- [ ] Add proper sizes attribute

### 3. Caching

- [ ] API response caching (Redis)
- [ ] Static asset caching (CDN)
- [ ] Database query caching
- [ ] SWR/React Query for client caching

### 4. Database

- [ ] Add indexes for slow queries
- [ ] Optimize N+1 queries (use Prisma includes)
- [ ] Implement pagination
- [ ] Denormalize frequently accessed data

### 5. Bundle Analysis

```bash
npm run build
npx next-bundle-analyzer
```
````

## Implementation Plan

1. [ ] Measure baseline
2. [ ] Implement one optimization
3. [ ] Measure impact
4. [ ] Repeat or adjust

## Monitoring

- [ ] Set up Core Web Vitals tracking
- [ ] Add custom performance metrics
- [ ] Set up alerts for regressions

## Checklist

- [ ] Bundle size reduced
- [ ] Load time improved
- [ ] No regressions in functionality
- [ ] Tests still passing
- [ ] Performance gains documented

```

---

**Usage**: Copy the relevant template, fill in details, and track progress with checkboxes.
```
