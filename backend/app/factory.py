"""FastAPI application factory for PixelForge.

This module owns top-level application construction. It configures logging,
validates critical environment settings, creates the FastAPI instance, installs
middleware, and registers routers.

Keeping application creation in a factory makes startup behavior explicit and
helps tests create isolated app instances when needed.
"""

import logging

from fastapi import FastAPI

from app.lifecycle import lifespan
from app.logging.logging_config import configure_logging
from app.middleware import configure_middleware
from app.routers import register_routers
from core.config import settings


logger = logging.getLogger(__name__)


def validate_environment() -> None:
    """Validate critical environment settings before application startup.

    Raises:
        ValueError:
            Raised when required CORS configuration is missing or unsafe.
    """
    if not settings.ALLOWED_ORIGINS:
        raise ValueError(
            "CRITICAL: ALLOWED_ORIGINS must be defined in the environment."
        )

    if "*" in settings.ALLOWED_ORIGINS:
        raise ValueError(
            "CRITICAL: Wildcard '*' is not allowed in ALLOWED_ORIGINS for production."
        )


def create_app() -> FastAPI:
    """Create and configure the PixelForge FastAPI application.

    Returns:
        FastAPI:
            Fully configured FastAPI application instance.
    """
    configure_logging()

    logger.info(
        "Logging configured. level=%s log_to_file=%s",
        settings.LOG_LEVEL,
        settings.LOG_TO_FILE,
    )

    validate_environment()

    app = FastAPI(
        root_path="/api",
        title="PixelForge API",
        description="Production backend for PixelForge Image Studio",
        version="1.1.0",
        lifespan=lifespan,
    )

    configure_middleware(app)
    register_routers(app)

    return app
