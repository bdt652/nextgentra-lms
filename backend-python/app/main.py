"""FastAPI main application module."""

from collections.abc import AsyncGenerator, Awaitable
from contextlib import asynccontextmanager
from datetime import datetime, timezone
import os
from typing import Callable

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

# Optional Sentry import - will be None if not installed
try:
    import sentry_sdk
    from sentry_sdk.integrations.asgi import SentryAsgiMiddleware

    SENTRY_AVAILABLE = True
except ImportError:
    SENTRY_AVAILABLE = False

from app.api import (
    admin_router,
    auth_student_router,
    auth_teacher_router,
    categories_router,
    class_content_router,
    class_members_router,
    classes_router,
    courses_router,
    exams_router,
    lessons_router,
    sections_router,
    student_portal_router,
    upload_router,
)
from app.core.database import connect_db, disconnect_db
from app.core.health import health_check_endpoint
from app.core.logging import (
    configure_logging,
    get_logger,
    log_request,
    log_shutdown,
    log_startup,
)

# Initialize logging configuration
configure_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncGenerator[None, None]:
    """Manage database connection lifecycle."""
    # Startup: connect to database
    env = os.getenv("ENVIRONMENT", "development")
    log_startup("Starting application", version="1.0.0", environment=env)
    await connect_db()
    log_startup("Database connected successfully")
    yield
    # Shutdown: disconnect
    await disconnect_db()
    log_shutdown("Application shutdown complete")


# Initialize Sentry if DSN is configured and Sentry is available
sentry_dsn = os.getenv("SENTRY_DSN")
if sentry_dsn and SENTRY_AVAILABLE:
    sentry_sdk.init(
        dsn=sentry_dsn,
        environment=os.getenv("SENTRY_ENVIRONMENT", "development"),
        release="backend@1.0.0",
        traces_sample_rate=1.0 if os.getenv("ENVIRONMENT") == "development" else 0.1,
        send_default_pii=False,  # Don't send PII for GDPR compliance
        debug=os.getenv("ENVIRONMENT") == "development",
    )
    logger.info("Sentry error tracking initialized", dsn=sentry_dsn[:30] + "...")
elif sentry_dsn:
    logger.warning(
        "Sentry SDK not installed but SENTRY_DSN is set - "
        "install sentry-sdk to enable error tracking"
    )
else:
    logger.info("Sentry not configured (SENTRY_DSN not set) - error tracking disabled")


app = FastAPI(
    title="NextGenTra LMS API",
    description="Learning Management System Backend API",
    version="1.0.0",
    lifespan=lifespan,
)

# Add Sentry middleware if available
if sentry_dsn and SENTRY_AVAILABLE:
    app.add_middleware(SentryAsgiMiddleware)  # type: ignore[arg-type]


# Logging middleware
class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log all HTTP requests."""

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        start_time = datetime.now(timezone.utc)

        response = await call_next(request)

        # Calculate request duration
        duration = (datetime.now(timezone.utc) - start_time).total_seconds()

        # Log the request
        log_request(
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            duration=duration,
            client_host=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent", ""),
        )

        return response


app.add_middleware(LoggingMiddleware)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(auth_student_router)
app.include_router(auth_teacher_router)
app.include_router(admin_router)
app.include_router(categories_router)
app.include_router(courses_router)
app.include_router(sections_router)
app.include_router(lessons_router)
app.include_router(exams_router)
app.include_router(classes_router)
app.include_router(class_members_router)
app.include_router(class_content_router)
app.include_router(student_portal_router)
app.include_router(upload_router)


@app.get("/")
async def root() -> dict:
    """Root endpoint."""
    return {"message": "NextGenTra LMS API", "version": "1.0.0", "status": "running"}


@app.get("/health")
async def health_check() -> JSONResponse:
    """Enhanced health check endpoint with database and Redis status."""
    return await health_check_endpoint()
