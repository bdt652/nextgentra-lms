# ADR-003: Authentication Strategy

## Status

Accepted

## Context

We need authentication that:

- Works across multiple frontend apps (teacher, student)
- Is stateless for scalability
- Supports role-based access control (teacher/student/admin)
- Can be easily validated by backend
- Supports token refresh for better UX

## Decision

We will use **JWT (JSON Web Tokens)** with refresh tokens stored in **Redis**.

### Flow

1. User logs in with credentials
2. Backend validates and returns:
   - Access token (short-lived, ~15 min)
   - Refresh token (long-lived, ~7 days, stored in Redis)
3. Frontend stores access token in memory (or secure httpOnly cookie)
4. Refresh token stored in Redis with user ID association
5. Protected endpoints require `Authorization: Bearer <token>`
6. When access token expires, use refresh token to get new tokens

### Token Structure

Access token payload:

```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "role": "TEACHER" | "STUDENT" | "ADMIN",
  "iat": 1234567890,
  "exp": 1234567890
}
```

Refresh token stored in Redis:

```
key: refresh:{tokenHash}
value: {userId}
TTL: 7 days
```

## Consequences

### Positive

- Stateless authentication (scales well)
- No server-side session storage needed
- Fast token validation
- Built-in role information
- Standard approach with good library support
- Refresh tokens enable better UX without sacrificing security

### Negative

- Revoking tokens before expiry requires blacklist in Redis
- Token size larger than session ID
- Cannot easily invalidate all tokens on password change (requires changing signing key)
- Client-side storage requires careful security consideration

## Security Considerations

1. Use strong secret keys (min 256-bit)
2. Store refresh tokens in httpOnly cookies or secure storage
3. Implement token rotation on refresh
4. Rate limit login attempts
5. Log authentication events
6. Regular security audits

## Alternatives Considered

1. **Session-based**: Stateful, doesn't scale as well
2. **OAuth/SSO**: Overkill for standalone LMS
3. **Magic links**: Poor UX for frequent access
4. **API keys**: Not suitable for user authentication
