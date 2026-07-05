"""Background janitor service for storage and usage cleanup.

The janitor loop runs for the lifetime of the FastAPI application. It sweeps
expired Azure result files frequently and removes old usage rows less often
according to configured intervals.
"""

import asyncio
import logging

from core.config import settings
from limiter.usage_service import UsageService
from services.azure.storage import StorageService

logger = logging.getLogger(__name__)


async def database_janitor_loop() -> None:
    """Continuously remove expired Azure files and usage records."""
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
