"""Middleware and global exception-handler registration.

This module configures cross-cutting HTTP behavior for the FastAPI application:
request logging, CORS, rate limiter state, and the SlowAPI rate-limit exception
handler.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.logging.request_logging import RequestLoggingMiddleware
from core.config import settings
from limiter.rate_limiter import limiter


def configure_middleware(app: FastAPI) -> None:
    """Install middleware and global exception handlers on the app.

    Args:
        app:
            FastAPI application instance being configured.
    """
    app.add_middleware(RequestLoggingMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=[
            "GET",
            "POST",
            "PUT",
            "DELETE",
            "OPTIONS",
        ],
        allow_headers=["*"],
    )

    app.state.limiter = limiter

    app.add_exception_handler(
        RateLimitExceeded,
        _rate_limit_exceeded_handler,
    )
