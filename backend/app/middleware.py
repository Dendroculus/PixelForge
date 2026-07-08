"""Middleware and global exception-handler registration.

This module configures cross-cutting HTTP behavior for the FastAPI application:

    - request logging middleware
    - CORS middleware
    - SlowAPI limiter state
    - PixelForge global exception handlers

Request-time errors are normalized by handlers registered from
``utils.error.handlers``. Background AI job failures are handled separately by
``JobManager`` and returned later through the result polling endpoint.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.logging.request_logging import RequestLoggingMiddleware
from core.config import settings
from limiter.rate_limiter import limiter
from utils.error.handlers import register_exception_handlers


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
    register_exception_handlers(app)
