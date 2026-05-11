# NextGenTra LMS - Release Checklist

Use this checklist for every production release. Follow the Release Process documented in `CLAUDE.md`.

---

## Pre-Release Phase

### Code Quality
- [ ] All PRs merged to `main` branch
- [ ] CI pipeline passes on `main` (all 3 jobs: backend, student-portal, teacher-portal)
- [ ] No failing tests locally: `pytest` (backend), `npm test` (frontends)
- [ ] Type checking passes: `mypy app/` (backend), `npm run type-check` (frontends)
- [ ] Linting passes: `ruff check .` (backend), `npm run lint` (frontends)
- [ ] Formatting correct: `black --check .` (backend), `npm run format:check` (frontends)
- [ ] Build succeeds: `npm run build` (frontends)

### Version Management
- [ ] Version numbers identified (SemVer format: X.Y.Z)
- [ ] All unreleased changes listed in `CHANGELOG.md` are accounted for
- [ ] No `[Unreleased]` section remains in CHANGELOG (will be moved to new version)

### Database
- [ ] All Prisma migrations are backward compatible (no destructive changes without rollback plan)
- [ ] Migration files are in `backend-python/.prisma/migrations/`
- [ ] Test migrations on staging database first (if available)
- [ ] `DATABASE_URL` in production `.env` is correct and accessible

### Environment Configuration
- [ ] `.env.example` is up-to-date with all required variables
- [ ] Production environment variables are documented (see `DEPLOYMENT.md` if exists)
- [ ] Secrets (JWT_SECRET, SENTRY_DSN, etc.) are set in production environment
- [ ] CORS allowed origins updated for production domain(s)
- [ ] Redis URL and credentials are correct for production

### Monitoring & Observability
- [ ] Sentry DSN configured in backend `.env` (`SENTRY_DSN`)
- [ ] Sentry DSN configured in frontends (`NEXT_PUBLIC_SENTRY_DSN`)
- [ ] Health check endpoint (`/health`) returns "healthy" in production
- [ ] Log level set appropriately (INFO for production, DEBUG for development)
- [ ] Error alerts configured in Sentry (email, Slack, etc.)

### Documentation
- [ ] API documentation (Swagger/OpenAPI) updated if endpoints changed
- [ ] `CLAUDE.md` updated with any architectural changes
- [ ] README files updated if setup instructions changed
- [ ] Migration guides written for breaking changes (if any)

### Security
- [ ] No hardcoded secrets in code (all in environment variables)
- [ ] JWT secret key is strong and rotated if needed
- [ ] CORS origins restricted to actual domains (no `*` in production)
- [ ] No debug mode enabled in production
- [ ] Dependencies scanned for vulnerabilities (`npm audit`, `pip-audit`)
- [ ] No test accounts or test data left in production

---

## Release Execution Phase

### Create Release Branch
- [ ] Branch created from `main`: `release/vX.Y.Z`
- [ ] Branch pushed to remote: `git push -u origin release/vX.Y.Z`
- [ ] PR opened: `release/vX.Y.Z` → `main`

### Bump Versions
- [ ] `backend-python/pyproject.toml` version updated to `X.Y.Z`
- [ ] `student-portal/package.json` version updated to `X.Y.Z`
- [ ] `teacher-portal/package.json` version updated to `X.Y.Z`
- [ ] Committed with message: `chore(release): prepare vX.Y.Z`

### Update CHANGELOG
- [ ] All "[Unreleased]" entries moved to new `## [X.Y.Z] - YYYY-MM-DD` section
- [ ] New version section includes: Added, Changed, Fixed, Removed (as applicable)
- [ ] Contributors acknowledged (if desired)
- [ ] CHANGELOG committed

### Merge Release PR
- [ ] PR approved by at least one maintainer
- [ ] All CI checks pass on `release/vX.Y.Z` branch
- [ ] PR merged to `main` (squash merge recommended)
- [ ] `main` branch is updated locally: `git checkout main && git pull origin main`

### Tag and GitHub Release
- [ ] Git tag created: `git tag -a vX.Y.Z -m "Release vX.Y.Z"`
- [ ] Git tag pushed: `git push origin vX.Y.Z`
- [ ] GitHub Release drafted at https://github.com/your-org/nextgentra-lms/releases/new
- [ ] Release title: `vX.Y.Z`
- [ ] Release notes generated from merged PRs (use conventional commits)
- [ ] Breaking changes highlighted (if any)
- [ ] Migration instructions included (if needed)
- [ ] Release marked as "latest" and published

---

## Deployment Phase

### Pre-Deployment
- [ ] Production servers are ready (no maintenance window conflicts)
- [ ] Backup procedures in place (database, uploads, configs)
- [ ] Rollback plan documented and tested
- [ ] Monitoring dashboards (Sentry, etc.) are accessible
- [ ] Team availability confirmed (who's deploying, who's on call)

### Deploy to Production
- [ ] SSH to production server(s)
- [ ] Pull latest `main` branch: `git pull origin main`
- [ ] Install/update dependencies:
  - Backend: `cd backend-python && pip install -r requirements.txt`
  - Frontends: `cd student-portal && npm ci` (same for teacher)
- [ ] Run database migrations (if any):
  ```bash
  cd backend-python
  npx prisma migrate deploy
  ```
- [ ] Restart services:
  - Backend: restart `uvicorn` process or systemd service
  - Frontends: rebuild and restart Next.js (if standalone, not using Vercel/Netlify)
- [ ] Verify health endpoint: `curl http://your-api/health` returns `{"status": "healthy"}`
- [ ] Check Sentry for any immediate errors
- [ ] Test core user flows manually (login, dashboard, etc.)

### Post-Deployment Verification
- [ ] All services are running: backend (8000), student portal (3001), teacher portal (3000)
- [ ] No 5xx errors in Sentry (or within acceptable threshold)
- [ ] API response times are normal (check Sentry performance or custom metrics)
- [ ] Database queries are performing well (check slow query logs if available)
- [ ] Frontend builds are serving correctly (no 404s, assets load)
- [ ] SSL/TLS certificates valid (if applicable)
- [ ] CDN/cache invalidated if needed (if using CDN)

### Announce Release
- [ ] Slack/Discord/Teams notification sent to team
- [ ] Stakeholders informed (product managers, QA, etc.)
- [ ] Release notes published to internal wiki or changelog site
- [ ] Customer-facing release notes prepared (if applicable)

---

## Post-Release Phase

### Monitor
- [ ] Watch Sentry for new issues for at least 1 hour post-deploy
- [ ] Monitor application logs (structured logs if implemented)
- [ ] Check health endpoint periodically
- [ ] Respond to any user reports immediately

### Cleanup
- [ ] Delete release branch (optional but recommended): `git branch -d release/vX.Y.Z`
- [ ] Prune stale remote branches: `git fetch --prune`
- [ ] Archive old Docker images (if using) to save storage
- [ ] Rotate secrets if any were exposed during release (security best practice)

### Retrospective (for major releases)
- [ ] Document any issues encountered during release
- [ ] Update this checklist based on lessons learned
- [ ] Identify automation opportunities (e.g., version bumping, changelog generation)
- [ ] Plan improvements for next release

---

## Emergency Rollback Procedure

If critical issue discovered post-release:

1. **Assess impact**: Is it blocking all users? Data loss? Security issue?
2. **Decide**: Rollback vs. hotfix
   - **Rollback** if issue is severe and quick fix unclear
   - **Hotfix** if fix is obvious and can be deployed quickly
3. **Rollback**:
   ```bash
   git checkout main
   git revert <commit-hash-of-release-merge>  # This creates an undo commit
   git push origin main
   # Deploy the reverted state immediately
   ```
   - Create hotfix branch from before release: `git checkout -b hotfix/rollback-v1.2.0 <previous-good-commit>`
   - Or revert the tag and create a new release `v1.2.1`
4. **Hotfix**:
   - Create `hotfix/xxx` branch from `main`
   - Fix issue, commit, push
   - Open PR to `main` (expedited review)
   - Merge, tag `v1.2.1`, deploy
5. **Communicate**: Notify team and stakeholders of rollback/hotfix
6. **Post-mortem**: Document root cause and prevention measures

---

## Release Types

| Type | When to Use | Version Increment | Process |
|------|-------------|-------------------|---------|
| **Full Release** | New features, planned rollout | Minor or Major | Follow complete checklist above |
| **Patch Release** | Hotfix, emergency bug fix | Patch | Skip some steps (e.g., extensive testing if urgent), but still tag and document |
| **Beta/RC Release** | Testing before production | Suffix with `-beta.1` or `-rc.1` | Deploy to staging, no production deployment |
| **Internal Release** | Team-only testing | Suffix with `-dev.1` | No GitHub release, just tag for reference |

---

## Tools & Scripts

### Version Bump Script
Location: `scripts/bump-version.py` or `scripts/bump-version.js`

Usage: `./scripts/bump-version.py 1.2.0`

Updates version in:
- `backend-python/pyproject.toml`
- `student-portal/package.json`
- `teacher-portal/package.json`

### CHANGELOG Generator
Optional: `npx conventional-changelog -p angular -i CHANGELOG.md -s -r 0`

Requires conventional commits in git history.

### GitHub CLI (gh)
Create releases faster:
```bash
gh release create v1.2.0 --notes "Release notes here..." --latest
```

---

## References

- **Branching Strategy**: See `CLAUDE.md` → "Branching Strategy"
- **Release Process**: See `CLAUDE.md` → "Release Process"
- **Conventional Commits**: https://www.conventionalcommits.org/
- **Semantic Versioning**: https://semver.org/
- **GitHub Flow**: https://docs.github.com/en/get-started/quickstart/github-flow

---

**Last Updated**: 2026-05-11  
**Maintainers**: See `.github/CODEOWNERS`  
**Next Review**: Quarterly or after 3 releases
