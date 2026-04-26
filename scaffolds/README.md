# Scaffolds Directory

Use this directory as templates when creating new files. Copy from here instead of creating from scratch.

## 📁 Structure

```
scaffolds/
├── components/          # Reusable component templates
│   ├── Button/
│   ├── Card/
│   ├── Modal/
│   └── Form/
├── pages/              # Page templates
│   ├── teacher/
│   │   ├── dashboard/
│   │   ├── courses/
│   │   │   ├── page.tsx
│   │   │   └── components/
│   │   ├── assignments/
│   │   └── students/
│   └── student/
│       ├── courses/
│       ├── assignments/
│       └── profile/
├── api/                # API endpoint templates
│   ├── router.py
│   ├── schemas.py
│   └── service.py
├── tests/              # Test templates
│   ├── component.test.tsx
│   ├── api.test.py
│   └── service.test.py
└── README.md           # This file
```

## 🚀 How to Use

1. **Copy template**: `cp -r scaffolds/components/Button packages/ui/components/button.tsx`
2. **Rename & customize**: Update component name, props, implementation
3. **Export**: Add to `packages/ui/index.ts`
4. **Test**: Create test based on `tests/component.test.tsx`

## 📋 Templates Included

### Components

- **Button** - Complete button with variants (default, outline, ghost, destructive) and sizes
- **Card** - Card component with header, content, footer
- **Modal** - Modal dialog with overlay and animations
- **Form** - Form wrapper with validation display

### Pages

- **Teacher Dashboard** - Layout with stats cards and recent activity
- **Teacher Courses** - Course list with create button and search
- **Student Courses** - Enrollment list with progress tracking
- **Profile** - User profile with edit form

### API

- **CRUD Endpoint** - Complete REST endpoint with all methods
- **Service Layer** - Business logic with error handling
- **Schemas** - Pydantic models for request/response

### Tests

- **Component Test** - Render, interaction, state tests
- **API Test** - Endpoint tests with FastAPI TestClient
- **Service Test** - Unit tests with mocking

## 🎯 Best Practices When Using Scaffolds

1. **Always read the comments** in scaffold files - they explain why things are done
2. **Keep the structure** - Don't remove important sections
3. **Update imports** - Adjust paths based on where you place the file
4. **Follow conventions** - Use same patterns as existing code
5. **Add tests** - Every new file needs tests
6. **Update types** - Add new types to `packages/utils/types/index.ts`
7. **Document** - Update relevant docs (API, README)

## 📝 Example: Creating a New Component

```bash
# 1. Copy scaffold
cp -r scaffolds/components/Button packages/ui/components/button.tsx

# 2. Edit the file
# - Change interface name to ButtonProps
# - Adjust variants as needed
# - Update styles

# 3. Export from package
echo "export { Button, type ButtonProps } from './components/button';" >> packages/ui/index.ts

# 4. Create test
cp scaffolds/tests/component.test.tsx packages/ui/__tests__/button.test.tsx
# Edit test file with Button-specific tests

# 5. Run tests
npm run test --workspace=@nextgentra/ui

# 6. Lint and type-check
npm run lint --workspace=@nextgentra/ui
npm run type-check --workspace=@nextgentra/ui
```

## 🔄 Updating Scaffolds

When you create a good component that should be a template:

1. Copy it to `scaffolds/components/`
2. Remove specific business logic
3. Add comments explaining each section
4. Update this README
5. Commit with message: `feat(scaffolds): add [Component] template`

---

**Remember**: Scaffolds are starting points, not final code. Always adapt to your specific needs while maintaining project conventions.
