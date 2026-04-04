import os
import asyncio
import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from api.routes import router as api_router
from core.config import ALLOWED_ORIGINS
from limiter.rate_limiter import limiter
from core.database import init_db_pool, close_db_pool, run_database_cleanup


if "*" in ALLOWED_ORIGINS:
    raise ValueError("Wildcard '*' is not allowed when credentials are enabled.")


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


async def database_janitor_loop():
    while True:
        await run_database_cleanup()
        await asyncio.sleep(43200)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db_pool()
    janitor_task = asyncio.create_task(database_janitor_loop())

    yield

    janitor_task.cancel()
    try:
        await janitor_task
    except asyncio.CancelledError: 
        pass # noqa

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
    return {
        "status": "online",
        "message": "AI Upscaler API is running",
        "docs": "/docs"
    }


app.include_router(api_router)