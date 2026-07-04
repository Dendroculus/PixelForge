import logging

from fastapi import FastAPI

from app.lifecycle import lifespan
from app.logging.logging_config import configure_logging
from app.middleware import configure_middleware
from app.routers import register_routers
from core.config import settings


logger = logging.getLogger(__name__)


def validate_environment() -> None:
    if not settings.ALLOWED_ORIGINS:
        raise ValueError(
            "CRITICAL: ALLOWED_ORIGINS must be defined in the environment."
        )

    if "*" in settings.ALLOWED_ORIGINS:
        raise ValueError(
            "CRITICAL: Wildcard '*' is not allowed in ALLOWED_ORIGINS for production."
        )


def create_app() -> FastAPI:
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

logger.info(
    "Logging configured. level=%s log_to_file=%s handlers=%s",
    settings.LOG_LEVEL,
    settings.LOG_TO_FILE,
    [
        type(handler).__name__
        for handler in logging.getLogger().handlers
    ],
)