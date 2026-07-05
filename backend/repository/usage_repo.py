"""Repository for usage tracking SQL operations.

This module contains only raw database queries for the ``ip_usage_hourly`` table.
Business decisions such as failing open, calculating remaining quota, and
handling refunds belong in ``UsageService``.
"""

import asyncpg


class UsageRepository:
    """Raw SQL access helpers for feature usage tracking."""

    @staticmethod
    async def get_usage_sum(conn: asyncpg.Connection, ip_key: str) -> int:
        """Return total usage for a key in the last 24 hours.

        Args:
            conn:
                Active asyncpg connection.
            ip_key:
                Usage key generated from client IP and feature name.

        Returns:
            int:
                Total usage count in the rolling 24-hour window.
        """
        sql = """
        SELECT COALESCE(SUM(usage_count), 0)::int AS used
        FROM ip_usage_hourly
        WHERE ip_address = $1 AND bucket_start > NOW() - INTERVAL '24 hours';
        """
        return await conn.fetchval(sql, ip_key)

    @staticmethod
    async def increment_usage(conn: asyncpg.Connection, ip_key: str) -> None:
        """Increment current-hour usage for a key.

        Args:
            conn:
                Active asyncpg connection.
            ip_key:
                Usage key generated from client IP and feature name.
        """
        sql = """
        INSERT INTO ip_usage_hourly (ip_address, bucket_start, usage_count)
        VALUES ($1, date_trunc('hour', NOW()), 1)
        ON CONFLICT (ip_address, bucket_start)
        DO UPDATE SET usage_count = ip_usage_hourly.usage_count + 1;
        """
        await conn.execute(sql, ip_key)

    @staticmethod
    async def decrement_usage(conn: asyncpg.Connection, ip_key: str) -> None:
        """Decrement current-hour usage for a key without going below zero.

        Args:
            conn:
                Active asyncpg connection.
            ip_key:
                Usage key generated from client IP and feature name.
        """
        sql = """
        UPDATE ip_usage_hourly 
        SET usage_count = GREATEST(usage_count - 1, 0)
        WHERE ip_address = $1 AND bucket_start = date_trunc('hour', NOW());
        """
        await conn.execute(sql, ip_key)

    @staticmethod
    async def get_usage_and_oldest_bucket(conn: asyncpg.Connection, ip_key: str) -> dict:
        """Return total usage and oldest active bucket timestamp.

        Args:
            conn:
                Active asyncpg connection.
            ip_key:
                Usage key generated from client IP and feature name.

        Returns:
            asyncpg.Record:
                Record containing ``used`` and ``oldest_bucket_ms``.
        """
        sql = """
        WITH windowed AS (
            SELECT COALESCE(SUM(usage_count), 0)::int AS used, MIN(bucket_start) AS oldest_bucket
            FROM ip_usage_hourly
            WHERE ip_address = $1 AND bucket_start >= NOW() - INTERVAL '24 hours'
        )
        SELECT used, EXTRACT(EPOCH FROM oldest_bucket) * 1000 AS oldest_bucket_ms
        FROM windowed;
        """
        return await conn.fetchrow(sql, ip_key)

    @staticmethod
    async def delete_expired_records(conn: asyncpg.Connection, retention_hours: int) -> int:
        """Delete usage records older than the configured retention window.

        Args:
            conn:
                Active asyncpg connection.
            retention_hours:
                Number of hours to keep usage rows.

        Returns:
            int:
                Number of deleted rows parsed from asyncpg's command status.
        """
        sql = f"""
        DELETE FROM ip_usage_hourly
        WHERE bucket_start < NOW() - INTERVAL '{retention_hours} hours';
        """
        result = await conn.execute(sql)
        return int(result.split()[-1])
