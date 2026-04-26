# Claude Memory Index

This directory contains memory files that Claude Code uses to maintain context across conversations.

## Memory Files

### [project.md](project.md) - Project Context

**Essential information about the NextGenTra LMS project**

- Tech stack, architecture, conventions
- Important files and locations
- Development workflow
- Critical rules and gotchas
- Common commands

**When to read**: Always read this first when starting work on this project.

---

### [user.md](user.md) - User Profile

**Information about the developer**

- Role, goals, preferences
- Knowledge level by technology
- Communication and working style

**When to read**: Read to understand how to interact effectively.

---

### [reference.md](reference.md) - External Resources

**Links to documentation, tools, and external resources**

- Official docs for Next.js, FastAPI, Prisma, etc.
- CI/CD tools
- Security resources
- Deployment targets

**When to read**: When you need to look up official documentation or external resources.

---

## How Memory Works

Claude Code automatically loads all `.md` files from `.claude/memory/` at the start of conversations. These files provide persistent context that helps understand:

1. **Project structure** and conventions
2. **Developer preferences** and working style
3. **External references** and resources

## Updating Memory

When you discover important information about the project:

1. **Project changes**: Update `project.md` with new architecture decisions, tech stack changes, important file locations
2. **User preferences**: Update `user.md` if you learn about new preferences or working style
3. **New references**: Add to `reference.md` when you discover useful external resources

## Memory Guidelines

- **Be concise**: Use bullet points and clear sections
- **Stay current**: Update when project evolves
- **Link to sources**: Use file paths to reference actual code
- **Indicate importance**: Mark critical rules as "Non-Negotiable"
- **Version info**: Include dates when information might change

## Quick Reference for Claude

When starting work:

1. Read `.claude/memory/project.md` (MOST IMPORTANT)
2. Read `.claude/memory/user.md` (understand preferences)
3. Check `reference.md` if you need external docs

When making decisions:

- Follow conventions in `project.md`
- Match the established patterns
- Keep type safety and quality gates in mind

---

**Note**: These files are loaded automatically by Claude Code. No need to explicitly reference them in conversation.
