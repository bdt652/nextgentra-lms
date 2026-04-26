# Security Policy

## Supported Versions

We currently support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |

## Reporting a Vulnerability

We take the security of NextGenTra LMS seriously. If you believe you have found a security vulnerability, please report it to us as described below.

**Please do not report security vulnerabilities through public GitHub issues.**

### How to Report

1. **Email**: Send an email to security@nextgentra.com with the subject line "NextGenTra LMS - Security Vulnerability"

2. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Any suggested fixes (optional)

3. **Response Timeline**:
   - We will acknowledge receipt within 48 hours
   - We will provide an estimated timeline for fixing within 7 days
   - Critical vulnerabilities will be addressed as soon as possible

### What to Expect

- You will receive a confirmation of your report
- We will investigate and determine if it's a valid issue
- We will keep you informed of progress
- Once fixed, we will publicly acknowledge your responsible disclosure (unless you prefer anonymity)

### Security Best Practices

For developers working on this project:

1. **Never commit secrets**: Use environment variables, never hardcode credentials
2. **Use HTTPS**: All external API calls must use HTTPS
3. **Validate input**: All user input must be validated both client and server-side
4. **Sanitize output**: Prevent XSS by properly escaping user content
5. **Use parameterized queries**: Prevent SQL injection with Prisma
6. **Keep dependencies updated**: Use `npm audit` and `pip-audit` regularly
7. **Implement rate limiting**: On API endpoints to prevent abuse
8. **Use strong JWT secrets**: Rotate secrets regularly in production

### Dependencies Security

We use multiple tools to monitor dependency vulnerabilities:

- **Dependabot**: Automatically creates PRs for vulnerable dependencies
- **GitHub Security Advisories**: Monitor and patch known vulnerabilities
- **Regular audits**:
  ```bash
  npm audit
  pip-audit  # in backend directory
  ```

### JWT Authentication

The application uses JWT tokens for authentication. In production:

- Use strong, random secret keys (minimum 256-bit)
- Store secrets securely in environment variables or secret management service
- Set appropriate token expiration times
- Implement token refresh mechanism
- Use HTTPS only

### Database Security

- Use strong database passwords
- Restrict database access to application servers only
- Regular backups with encryption
- Use connection pooling
- Enable PostgreSQL SSL connections

## Security Checklist for PRs

When submitting a PR, ensure:

- [ ] No hardcoded secrets or credentials
- [ ] Input validation on all user inputs
- [ ] Proper error handling (no stack traces in production)
- [ ] TypeScript types properly defined
- [ ] API endpoints have proper authentication/authorization
- [ ] SQL queries use parameterized queries (Prisma)
- [ ] Frontend components sanitize user-generated content
- [ ] No sensitive data in logs
- [ ] Tests cover security-critical paths

## Known Issues

- N/A

## Credits

Thank you to all security researchers who have helped keep NextGenTra LMS secure.
