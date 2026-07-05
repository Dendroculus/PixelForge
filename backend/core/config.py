"""Central configuration for the PixelForge backend.

This module defines all runtime settings used by the API, service layer,
storage integration, usage limiter, image validation, and AI provider clients.

Configuration is loaded from environment variables and the local ``.env`` file
through Pydantic Settings. Keep this module focused on declarative settings and
small derived properties. Avoid opening network connections, initializing
database pools, or constructing provider clients here.
"""

import os
from typing import Dict, FrozenSet, List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables.

    The defaults are intended for local development where safe. Secret values
    and deployment-specific values must be provided through environment
    variables or a local ``.env`` file.

    Attributes are grouped by concern:
        - Environment and security
        - Logging
        - Storage
        - Rate and usage limits
        - Database pool configuration
        - Image processing thresholds
        - Validation thresholds
        - Image format mapping
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- Environment & Security ---
    ENVIRONMENT: str = "development"
    STRICT_ENV_VALIDATION: bool = True

    DATABASE_URL: str
    AZURE_CONNECTION_STRING: str
    CLOUDFLARE_TURNSTILE_SECRET_KEY: str
    DISCORD_WEBHOOK_URL: str
    REPLICATE_API_TOKEN: str
    ALLOWED_ORIGINS: str
    ALLOW_TURNSTILE_TEST_BYPASS: bool = False

    # --- Logging ---
    LOG_LEVEL: str = "INFO"
    LOG_TO_FILE: bool = False
    LOG_DIR: str = "logs"
    LOG_FILE_NAME: str = "pixelforge.log"
    LOG_MAX_BYTES: int = 10_485_760
    LOG_BACKUP_COUNT: int = 5

    @property
    def cors_origins_list(self) -> List[str]:
        """Return configured CORS origins as a clean list.

        Returns:
            list[str]:
                Comma-separated origins from ``ALLOWED_ORIGINS`` with empty
                values removed.
        """
        return [
            origin.strip()
            for origin in (self.ALLOWED_ORIGINS or "").split(",")
            if origin.strip()
        ]

    # --- Storage ---
    UPLOAD_CONTAINER: str = "uploads"
    RESULT_CONTAINER: str = "results"

    # --- Rate Limits ---
    UPLOAD_RATE_LIMIT: str = "5/minute"
    POLL_RATE_LIMIT: str = "60/minute"
    FEEDBACK_RATE_LIMIT: str = "3/hour"

    # --- Feature Limits ---
    UPSCALE_DAILY_USAGE_LIMIT: int = 3
    REMBG_DAILY_USAGE_LIMIT: int = 5
    COLOR_RESTORE_DAILY_USAGE_LIMIT: int = 5
    OBJECT_REMOVE_DAILY_USAGE_LIMIT: int = 5
    FEEDBACK_DAILY_USAGE_LIMIT: int = 5

    SAS_EXPIRATION_MINUTES: int = 11

    @property
    def FEATURE_LIMITS(self) -> Dict[str, int]:
        """Map feature names to their 24-hour usage limits.

        Returns:
            dict[str, int]:
                Feature-to-limit mapping consumed by job initialization and
                usage status endpoints.
        """
        return {
            "upscale": self.UPSCALE_DAILY_USAGE_LIMIT,
            "rembg": self.REMBG_DAILY_USAGE_LIMIT,
            "colorrestore": self.COLOR_RESTORE_DAILY_USAGE_LIMIT,
            "objectremove": self.OBJECT_REMOVE_DAILY_USAGE_LIMIT,
            "feedback": self.FEEDBACK_DAILY_USAGE_LIMIT,
        }

    # --- Database ---
    POOL_MIN_SIZE: int = 1
    POOL_MAX_SIZE: int = 10
    POOL_MAX_QUERIES: int = 50000
    POOL_MAX_INACTIVE_CONN_LIFETIME: float = 300.0
    POOL_COMMAND_TIMEOUT: int = 10

    INIT_MAX_RETRIES: int = 8
    INIT_BASE_DELAY_SECONDS: float = 0.5

    USAGE_RETENTION_HOURS: int = 48
    AZURE_SWEEP_INTERVAL_SECONDS: int = 300
    DB_SWEEP_INTERVAL_SECONDS: int = 43200

    # --- Image Processing ---
    MAX_FILE_SIZE_MB: int = 10
    MAX_MEGAPIXELS: int = 3
    MAX_IMAGE_DIMENSION: int = 4000
    OPTIMIZATION_TARGET_PIXELS: int = 1_000_000
    MAX_SAFE_PIXELS: int = 25_000_000
    DEFAULT_SCALE: int = 4
    MAX_CONCURRENT_JOBS: int = 5
    MAX_CONCURRENT_CPU_JOBS: int = 4

    @property
    def MAX_FILE_SIZE_BYTES(self) -> int:
        """Return the upload size limit in bytes."""
        return self.MAX_FILE_SIZE_MB * 1024 * 1024

    @property
    def MAX_PIXELS(self) -> int:
        """Return the upload resolution limit in total pixels."""
        return self.MAX_MEGAPIXELS * 1_000_000

    # --- Validation Thresholds ---
    COLOR_DIFF_THRESHOLD: int = 35
    COLOR_PIXEL_RATIO_THRESHOLD: float = 0.05
    ALPHA_THRESHOLD: int = 20

    # --- Format Mapping ---
    FORMAT_MAP: Dict[str, str] = {
        "jpeg": "jpg",
        "jpg": "jpg",
        "png": "png",
        "webp": "webp",
    }


settings = Settings()

# Replicate's SDK reads this token from the environment. Assigning it here keeps
# the SDK-compatible environment value synchronized with Pydantic settings.
os.environ["REPLICATE_API_TOKEN"] = settings.REPLICATE_API_TOKEN

ALLOWED_EXTENSIONS: FrozenSet[str] = frozenset(
    settings.FORMAT_MAP.keys()
)

ALLOWED_MIME_TYPES: FrozenSet[str] = frozenset(
    [
        f"image/{'jpeg' if ext == 'jpg' else ext}"
        for ext in settings.FORMAT_MAP.values()
    ]
)
