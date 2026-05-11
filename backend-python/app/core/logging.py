"""Logging configuration for the LMS backend."""
import os
import sys
from typing import Optional

import structlog
from structlog.contextvars import merge_contextvars


def get_log_level() -> str:
    """Get log level from environment, default to INFO."""
    return os.getenv("LOG_LEVEL", "INFO").upper()


def configure_logging() -> None:
    """Configure structlog for structured logging."""
    log_level = get_log_level()
    is_development = os.getenv("ENVIRONMENT", "development").lower() == "development"

    # Shared processors
    shared_processors = [
        merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso", key="timestamp"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
    ]

    if is_development:
        # Human-readable console output for development
        structlog.configure(
            processors=[
                *shared_processors,
                structlog.stdlib.filter_by_level,
                structlog.dev.ConsoleRenderer(colors=True),
            ],
            wrapper_class=structlog.stdlib.BoundLogger,
            context_class=dict,
            logger_factory=structlog.stdlib.LoggerFactory(),
            cache_logger_on_first_use=True,
        )
    else:
        # JSON output for production (structured, machine-readable)
        structlog.configure(
            processors=[
                *shared_processors,
                structlog.stdlib.filter_by_level,
                structlog.processors.JSONRenderer(
                    sort_keys=True, ensure_ascii=False
                ),
            ],
            wrapper_class=structlog.stdlib.BoundLogger,
            context_class=dict,
            logger_factory=structlog.stdlib.LoggerFactory(),
            cache_logger_on_first_use=True,
        )

    # Configure standard library logging to route through structlog
    logging_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "handlers": {
            "default": {
                "class": "logging.StreamHandler",
                "stream": sys.stdout,
            },
        },
        "loggers": {
            "": {  # Root logger
                "handlers": ["default"],
                "level": log_level,
                "propagate": True,
            },
            "uvicorn": {
                "handlers": ["default"],
                "level": log_level,
                "propagate": False,
            },
            "uvicorn.access": {
                "handlers": ["default"],
                "level": log_level,
                "propagate": False,
            },
            "fastapi": {
                "handlers": ["default"],
                "level": log_level,
                "propagate": False,
            },
        },
    }

    # Apply logging configuration
    import logging
    import logging.config

    logging.config.dictConfig(logging_config)


def get_logger(name: Optional[str] = None) -> structlog.stdlib.BoundLogger:
    """Get a structured logger instance.

    Args:
        name: Logger name (usually __name__)

    Returns:
        Configured BoundLogger instance
    """
    return structlog.get_logger(name)


# Convenience functions for common logging patterns
def log_startup(message: str, **kwargs) -> None:
    """Log application startup information."""
    logger = get_logger("startup")
    logger.info(message, **kwargs)


def log_shutdown(message: str, **kwargs) -> None:
    """Log application shutdown information."""
    logger = get_logger("shutdown")
    logger.info(message, **kwargs)


def log_request(
    method: str,
    path: str,
    status_code: int,
    duration: float,
    **kwargs
) -> None:
    """Log HTTP request details."""
    logger = get_logger("http")
    logger.info(
        "request_processed",
        method=method,
        path=path,
        status_code=status_code,
        duration_seconds=round(duration, 4),
        **kwargs,
    )


def log_error(error: Exception, context: Optional[dict] = None, **kwargs) -> None:
    """Log error with context."""
    logger = get_logger("error")
    logger.error(
        "error_occurred",
        error_type=type(error).__name__,
        error_message=str(error),
        **(context or {}),
        **kwargs,
    )


def log_auth_event(
    event: str,
    user_id: Optional[str] = None,
    email: Optional[str] = None,
    **kwargs
) -> None:
    """Log authentication events."""
    logger = get_logger("auth")
    logger.info(
        f"auth.{event}",
        user_id=user_id,
        email=email,
        **kwargs,
    )


def log_database_operation(
    operation: str,
    model: Optional[str] = None,
    **kwargs
) -> None:
    """Log database operations (debug level)."""
    logger = get_logger("database")
    logger.debug(
        f"db.{operation}",
        model=model,
        **kwargs,
    )


def log_external_api(service: str, operation: str, status: str, **kwargs) -> None:
    """Log external API calls."""
    logger = get_logger("external")
    logger.info(
        "external_api_call",
        service=service,
        operation=operation,
        status=status,
        **kwargs,
    )
