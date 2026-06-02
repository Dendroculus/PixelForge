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

from api.routes import router as api_router
from core.config import ALLOWED_ORIGINS, LimitConfig as LC, DatabaseConfig as DC
from limiter.rate_limiter import limiter
from core.database import init_db_pool, close_db_pool, run_database_cleanup
from services.features.storage import StorageService

if "*" in ALLOWED_ORIGINS:
    raise ValueError("Wildcard '*' is not allowed when credentials are enabled.")

logger = logging.getLogger(__name__)

LOG_DIR = Path(os.path.dirname(__file__)) / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        RotatingFileHandler(
            LOG_DIR / "upscaler_backend.log",
            maxBytes=10485760,
            backupCount=5,
            encoding="utf-8"
        ),
        logging.StreamHandler()
    ]
)
logging.getLogger("azure.core.pipeline.policies.http_logging_policy").setLevel(logging.WARNING)

async def database_janitor_loop():
    """
    Periodically clean up expired storage results and database usage records.
    """
    db_cleanup_counter = 0
    loop_ratio = max(1, DC.DB_SWEEP_INTERVAL_SECONDS // DC.AZURE_SWEEP_INTERVAL_SECONDS)

    while True:
        try:
            logger.info("💓 Janitor Heartbeat: Checking Azure for expired files...")
            await StorageService.cleanup_expired_results(
                expiration_minutes=LC.SAS_EXPIRATION_MINUTES
            )

            if db_cleanup_counter % loop_ratio == 0:
                await run_database_cleanup()

            db_cleanup_counter += 1
        except Exception as e:
            logger.exception("Janitor loop iteration failed: %s", e)

        await asyncio.sleep(DC.AZURE_SWEEP_INTERVAL_SECONDS)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage application startup and shutdown lifecycle.

    Initializes database pool and background janitor task on startup,
    and gracefully shuts them down on application termination.

    :param app: FastAPI application instance
    """
    await init_db_pool()
    janitor_task = asyncio.create_task(database_janitor_loop())

    yield

    janitor_task.cancel()
    with contextlib.suppress(asyncio.CancelledError):
        await janitor_task

    await close_db_pool()

app = FastAPI(
    root_path="/api",
    title="AI Image Upscaler API",
    description="Production-ready FastAPI backend for Real-ESRGAN",
    version="1.1.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.get("/", tags=["Health Check"])
async def root():
    """
    Health check endpoint.

    :return: API status and documentation path
    """
    return {
        "status": "online",
        "message": "AI Upscaler API is running",
        "docs": "/docs"
    }

app.include_router(api_router)