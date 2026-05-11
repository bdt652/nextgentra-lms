"""Health check utilities for monitoring system dependencies."""
import asyncio
from datetime import datetime, timezone

import redis
from fastapi import HTTPException, status
from fastapi.responses import JSONResponse
from prisma import Prisma

from app.core.database import get_prisma, settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class HealthCheckResult:
    """Represents the result of a health check."""

    def __init__(self, name: str, status: str, details: dict = None):
        self.name = name
        self.status = status  # "healthy", "degraded", "unhealthy"
        self.details = details or {}
        self.timestamp = datetime.now(timezone.utc).isoformat()

    def to_dict(self) -> dict:
        """Convert to dictionary for JSON response."""
        return {
            "name": self.name,
            "status": self.status,
            "timestamp": self.timestamp,
            **self.details,
        }


async def check_database() -> HealthCheckResult:
    """Check database connectivity and basic operations."""
    try:
        prisma: Prisma = get_prisma()
        # Test connection with simple query
        result = await prisma.execute_raw("SELECT 1")

        # Check if we can query the User table
        user_count = await prisma.user.count()

        return HealthCheckResult(
            name="database",
            status="healthy",
            details={
                "connection": "ok",
                "query_test": "passed",
                "user_count": user_count,
            },
        )
    except Exception as e:
        logger.error("Database health check failed", error=str(e), exc_info=True)
        return HealthCheckResult(
            name="database",
            status="unhealthy",
            details={
                "connection": "failed",
                "error": str(e),
            },
        )


async def check_redis() -> HealthCheckResult:
    """Check Redis connectivity if configured."""
    if not settings.redis_url:
        return HealthCheckResult(
            name="redis",
            status="skipped",
            details={"reason": "REDIS_URL not configured"},
        )

    try:
        r = redis.from_url(settings.redis_url, socket_timeout=2)
        pong = await asyncio.to_thread(r.ping)

        if pong:
            # Get some basic stats
            info = await asyncio.to_thread(r.info)
            return HealthCheckResult(
                name="redis",
                status="healthy",
                details={
                    "connection": "ok",
                    "version": info.get("redis_version", "unknown"),
                    "connected_clients": info.get("connected_clients", 0),
                },
            )
        else:
            return HealthCheckResult(
                name="redis",
                status="unhealthy",
                details={"error": "PING failed"},
            )
    except Exception as e:
        logger.error("Redis health check failed", error=str(e), exc_info=True)
        return HealthCheckResult(
            name="redis",
            status="unhealthy",
            details={
                "connection": "failed",
                "error": str(e),
            },
        )


async def run_all_checks() -> dict:
    """Run all health checks and return aggregated results."""
    checks = [
        await check_database(),
        await check_redis(),
    ]

    # Determine overall status
    statuses = [c.status for c in checks]
    if all(s == "healthy" or s == "skipped" for s in statuses):
        overall_status = "healthy"
    elif any(s == "unhealthy" for s in statuses):
        overall_status = "unhealthy"
    else:
        overall_status = "degraded"

    return {
        "status": overall_status,
        "service": "lms-backend",
        "version": "1.0.0",
        "checks": {c.name: c.to_dict() for c in checks},
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


async def health_check_endpoint() -> JSONResponse:
    """FastAPI health check endpoint handler."""
    results = await run_all_checks()

    status_code = (
        status.HTTP_200_OK
        if results["status"] == "healthy"
        else status.HTTP_503_SERVICE_UNAVAILABLE
    )

    return JSONResponse(content=results, status_code=status_code)