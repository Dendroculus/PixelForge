import asyncpg

class UsageRepository:
    """Handles raw SQL interactions for usage tracking."""

    @staticmethod
    async def get_usage_sum(conn: asyncpg.Connection, ip_key: str) -> int:
        sql = """
        SELECT COALESCE(SUM(usage_count), 0)::int AS used
        FROM ip_usage_hourly
        WHERE ip_address = $1 AND bucket_start > NOW() - INTERVAL '24 hours';
        """
        return await conn.fetchval(sql, ip_key)

    @staticmethod
    async def increment_usage(conn: asyncpg.Connection, ip_key: str) -> None:
        sql = """
        INSERT INTO ip_usage_hourly (ip_address, bucket_start, usage_count)
        VALUES ($1, date_trunc('hour', NOW()), 1)
        ON CONFLICT (ip_address, bucket_start)
        DO UPDATE SET usage_count = ip_usage_hourly.usage_count + 1;
        """
        await conn.execute(sql, ip_key)

    @staticmethod
    async def decrement_usage(conn: asyncpg.Connection, ip_key: str) -> None:
        sql = """
        UPDATE ip_usage_hourly 
        SET usage_count = GREATEST(usage_count - 1, 0)
        WHERE ip_address = $1 AND bucket_start = date_trunc('hour', NOW());
        """
        await conn.execute(sql, ip_key)

    @staticmethod
    async def get_usage_and_oldest_bucket(conn: asyncpg.Connection, ip_key: str) -> dict:
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
        sql = f"""
        DELETE FROM ip_usage_hourly
        WHERE bucket_start < NOW() - INTERVAL '{retention_hours} hours';
        """
        result = await conn.execute(sql)
        return int(result.split()[-1])