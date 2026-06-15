import logging

from database.db_pool import get_db_pool
from core.config import settings
from repository.usage_repo import UsageRepository


logger = logging.getLogger(__name__)


WINDOW_HOURS = 24
WINDOW_MS = WINDOW_HOURS * 60 * 60 * 1000


class UsageService:
    """
    Handles feature usage tracking and daily limit enforcement.

    Responsible for:
    - Checking client usage limits.
    - Incrementing usage counters.
    - Refunding usage after failed jobs.
    - Providing usage status.
    - Cleaning expired usage records.
    """

    @staticmethod
    def _get_feature_key(ip_address: str, feature: str) -> str:
        """
        Creates a unique usage tracking key.

        Combines client IP and feature name so each feature
        maintains an independent usage counter.
        """
        return f"{ip_address}:{feature}"


    @classmethod
    async def check_daily_limit(
        cls,
        ip_address: str,
        limit_24h: int,
        feature: str,
    ) -> bool:
        """
        Checks whether a client can use a feature.

        Args:
            ip_address:
                Client identifier.
            limit_24h:
                Maximum allowed usage within the window.
            feature:
                AI feature being checked.

        Returns:
            bool:
                True if usage is available.
        """
        if limit_24h <= 0:
            return False

        pool = get_db_pool()

        if pool is None:
            logger.error(
                "DB pool not initialized. Failing open for daily limit check."
            )
            return True

        feature_ip = cls._get_feature_key(
            ip_address,
            feature,
        )

        try:
            async with pool.acquire() as conn:
                used = await UsageRepository.get_usage_sum(
                    conn,
                    feature_ip,
                )

                return used < limit_24h

        except Exception:
            logger.exception(
                "Database error during limit check. Failing open."
            )
            return True


    @classmethod
    async def increment_daily_limit(
        cls,
        ip_address: str,
        feature: str,
    ) -> None:
        """
        Records successful feature usage.

        Increments the usage counter after a job
        has passed validation.
        """
        pool = get_db_pool()

        if pool is None:
            return

        feature_ip = cls._get_feature_key(
            ip_address,
            feature,
        )

        try:
            async with pool.acquire() as conn:
                await UsageRepository.increment_usage(
                    conn,
                    feature_ip,
                )

        except Exception:
            logger.exception(
                "Database error during usage increment."
            )


    @classmethod
    async def decrement_daily_limit(
        cls,
        ip_address: str,
        feature: str,
    ) -> None:
        """
        Refunds usage after a failed job.

        Used when processing fails after usage
        has already been reserved.
        """
        pool = get_db_pool()

        if pool is None:
            return

        feature_ip = cls._get_feature_key(
            ip_address,
            feature,
        )

        try:
            async with pool.acquire() as conn:
                await UsageRepository.decrement_usage(
                    conn,
                    feature_ip,
                )

        except Exception:
            logger.exception(
                "Database error during usage refund."
            )


    @classmethod
    async def get_usage_status(
        cls,
        ip_address: str,
        limit_24h: int,
        feature: str,
    ) -> dict:
        """
        Returns current usage state for a feature.

        Calculates:
        - Remaining available usage.
        - Next reset timestamp when limit is reached.

        Returns:
            dict:
                Usage remaining and reset information.
        """
        if limit_24h <= 0:
            return {
                "uses_remaining": 0,
                "reset_timestamp": None,
            }

        pool = get_db_pool()

        if pool is None:
            return {
                "uses_remaining": limit_24h,
                "reset_timestamp": None,
            }

        feature_ip = cls._get_feature_key(
            ip_address,
            feature,
        )

        try:
            async with pool.acquire() as conn:
                rec = await UsageRepository.get_usage_and_oldest_bucket(
                    conn,
                    feature_ip,
                )

            used = (
                rec["used"]
                if rec and rec["used"] is not None
                else 0
            )

            oldest_ms = (
                rec["oldest_bucket_ms"]
                if rec
                else None
            )

            uses_remaining = max(
                0,
                limit_24h - used,
            )

            reset_timestamp = (
                int(oldest_ms + WINDOW_MS)
                if used >= limit_24h and oldest_ms is not None
                else None
            )

            return {
                "uses_remaining": uses_remaining,
                "reset_timestamp": reset_timestamp,
            }

        except Exception:
            logger.exception(
                "Failed to get usage status."
            )

            return {
                "uses_remaining": limit_24h,
                "reset_timestamp": None,
            }


    @classmethod
    async def run_database_cleanup(cls) -> int:
        """
        Removes expired usage records.

        Uses configured retention period to clean
        old tracking data.

        Returns:
            int:
                Number of deleted records.
        """
        pool = get_db_pool()

        if pool is None:
            logger.warning(
                "DB pool not ready for cleanup."
            )
            return 0

        try:
            async with pool.acquire() as conn:
                deleted = await UsageRepository.delete_expired_records(
                    conn,
                    settings.USAGE_RETENTION_HOURS,
                )

            logger.info(
                "Usage cleanup complete: %s rows removed.",
                deleted,
            )

            return deleted

        except Exception as e:
            logger.exception(
                "Database cleanup failed: %s",
                e,
            )

            return 0