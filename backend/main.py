import os
import asyncio
import contextlib
import logging

from logging.handlers import RotatingFileHandler
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from api.routes import ai_tools, feedback, system

from limiter.rate_limiter import limiter
from limiter.usage_service import UsageService

from core.config import settings

from database.db_pool import (
    init_db_pool,
    close_db_pool,
)

from services.azure.storage import StorageService


# --- Environment Validation ---

if not settings.ALLOWED_ORIGINS:
    raise ValueError(
        "CRITICAL: ALLOWED_ORIGINS must be defined in the environment."
    )

if "*" in settings.ALLOWED_ORIGINS:
    raise ValueError(
        "CRITICAL: Wildcard '*' is not allowed in ALLOWED_ORIGINS for production."
    )


logger = logging.getLogger("main")


# --- Logging Configuration ---

LOG_DIR = Path(os.path.dirname(__file__)) / "logs"
LOG_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        RotatingFileHandler(
            LOG_DIR / "upscaler_backend.log",
            maxBytes=10485760,
            backupCount=5,
            encoding="utf-8",
        ),
        logging.StreamHandler(),
    ],
)


logging.getLogger(
    "azure.core.pipeline.policies.http_logging_policy"
).setLevel(logging.WARNING)


async def database_janitor_loop() -> None:
    """
    Background maintenance worker.

    Periodically:
    - Removes expired Azure storage files.
    - Cleans expired usage tracking records.

    Runs continuously while the application is alive.
    """
    db_cleanup_counter = 0

    loop_ratio = max(
        1,
        settings.DB_SWEEP_INTERVAL_SECONDS
        // settings.AZURE_SWEEP_INTERVAL_SECONDS,
    )

    while True:
        try:
            logger.info(
                "Janitor Heartbeat: Sweeping expired files and records..."
            )

            await StorageService.cleanup_expired_results(
                expiration_minutes=settings.SAS_EXPIRATION_MINUTES,
            )

            if db_cleanup_counter % loop_ratio == 0:
                await UsageService.run_database_cleanup()

            db_cleanup_counter += 1

        except Exception as e:
            logger.exception(
                "Janitor loop iteration failed: %s",
                e,
            )

        await asyncio.sleep(
            settings.AZURE_SWEEP_INTERVAL_SECONDS
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application startup and shutdown lifecycle manager.

    Startup:
    - Initializes database pool.
    - Starts background cleanup worker.

    Shutdown:
    - Cancels background worker.
    - Closes database connections.
    """
    await init_db_pool()

    janitor_task = asyncio.create_task(
        database_janitor_loop()
    )

    yield

    janitor_task.cancel()

    with contextlib.suppress(asyncio.CancelledError):
        await janitor_task

    await close_db_pool()


app = FastAPI(
    root_path="/api",
    title="PixelForge API",
    description="Production backend for PixelForge Image Studio",
    version="1.1.0",
    lifespan=lifespan,
)


# --- Middleware ---

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


# --- Rate Limiting ---

app.state.limiter = limiter

app.add_exception_handler(
    RateLimitExceeded,
    _rate_limit_exceeded_handler,
)


@app.get("/", tags=["Health Check"])
async def root() -> dict:
    """
    Health check endpoint.

    Returns:
        dict:
            API availability status.
    """
    return {
        "status": "online",
        "message": "PixelForge API is running",
        "docs": "/api/docs",
    }


# --- Routes ---

app.include_router(ai_tools.router)
app.include_router(feedback.router)
app.include_router(system.router)