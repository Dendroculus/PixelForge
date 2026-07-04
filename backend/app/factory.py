from fastapi import FastAPI

from app.lifecycle import lifespan
from app.logging_config import configure_logging
from app.middleware import configure_middleware
from app.routers import register_routers
from core.config import settings


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
    validate_environment()
    configure_logging()

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