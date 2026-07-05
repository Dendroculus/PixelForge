"""Application startup and shutdown lifecycle management.

The FastAPI lifespan context initializes shared infrastructure when the server
starts and releases it when the server stops.

Startup responsibilities:
    - Initialize the PostgreSQL connection pool.
    - Start the janitor task for expired usage records and Azure result cleanup.

Shutdown responsibilities:
    - Cancel the janitor task cleanly.
    - Close the PostgreSQL connection pool.
"""

import asyncio
import contextlib

from contextlib import asynccontextmanager
from fastapi import FastAPI

from database.db_pool import close_db_pool, init_db_pool
from services.maintenance.janitor_service import database_janitor_loop


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage PixelForge application startup and shutdown resources.

    Args:
        app:
            FastAPI application instance supplied by the framework.

    Yields:
        None:
            Control is yielded to FastAPI while the application is running.
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
