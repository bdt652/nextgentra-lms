# ADR-004: API Design

## Status

Accepted

## Context

We need a consistent API design that:

- Is intuitive for frontend developers
- Supports both teacher and student roles
- Is RESTful and well-documented
- Handles errors gracefully
- Supports pagination for list endpoints
- Is versionable for future changes

## Decision

We will implement a **RESTful API** with the following conventions:

### URL Structure

```
/api/v1/{resource}
/api/v1/{resource}/{id}
/api/v1/{resource}/{id}/action
```

Examples:

- `GET /api/v1/courses` - List courses
- `POST /api/v1/courses` - Create course
- `GET /api/v1/courses/123` - Get course details
- `PUT /api/v1/courses/123` - Update course
- `DELETE /api/v1/courses/123` - Delete course
- `GET /api/v1/courses/123/lessons` - Get course lessons

### Authentication

All protected endpoints require:

```
Authorization: Bearer <jwt_token>
```

### Response Format

Success response:

```json
{
  "data": { ... },
  "meta": {
    "timestamp": "2025-04-25T10:30:00Z"
  }
}
```

List response with pagination:

```json
{
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

Error response:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "issue": "must be a valid email"
    }
  }
}
```

### Status Codes

- `200 OK` - Success
- `201 Created` - Resource created
- `204 No Content` - Success, no body
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict
- `422 Unprocessable Entity` - Validation error
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

### Filtering, Sorting, Pagination

List endpoints support query parameters:

```
GET /api/v1/courses?page=1&limit=20&sort=title&order=asc&status=published
```

### Role-Based Access

- Teacher endpoints: `/api/v1/teacher/*`
- Student endpoints: `/api/v1/student/*`
- Admin endpoints: `/api/v1/admin/*`

Or use resource-based checks with user role in JWT.

## Consequences

### Positive

- Consistent, predictable API
- Easy to document with OpenAPI/Swagger
- Good error handling
- Supports future versioning
- Clear separation of concerns
- Easy for frontend to consume

### Negative

- More verbose than GraphQL for some use cases
- Multiple endpoints for related resources
- Potential for N+1 query issues

## Tools

- **FastAPI** provides automatic OpenAPI documentation at `/docs`
- Use **Pydantic** schemas for request/response validation
- Generate **TypeScript types** from OpenAPI spec

## Examples

### List with filtering

```python
@router.get("/courses")
async def list_courses(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    teacher_id: Optional[str] = None
):
    # Implementation
```

### Create with validation

```python
@router.post("/courses")
async def create_course(
    data: CourseCreate,
    user: User = Depends(get_current_user)
):
    # Check permissions
    if user.role != Role.TEACHER:
        raise HTTPException(403, "Only teachers can create courses")
    # Implementation
```

## Alternatives Considered

1. **GraphQL**: More flexible but more complex, overkill for LMS
2. **gRPC**: Better for internal services, not HTTP clients
3. **JSON:API**: Too opinionated, REST is more flexible
