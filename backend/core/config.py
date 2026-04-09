import os
from typing import List, FrozenSet
from dotenv import load_dotenv

load_dotenv()

ENVIRONMENT = os.getenv("ENVIRONMENT", "development").strip().lower()
STRICT_ENV_VALIDATION = os.getenv("STRICT_ENV_VALIDATION", "true").strip().lower() in {"1", "true", "yes", "on"}

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL and STRICT_ENV_VALIDATION:
    raise ValueError("CRITICAL: DATABASE_URL environment variable is missing.")

AZURE_CONNECTION_STRING: str | None = os.getenv("AZURE_CONNECTION_STRING")
if not AZURE_CONNECTION_STRING and STRICT_ENV_VALIDATION:
    raise ValueError("CRITICAL: AZURE_CONNECTION_STRING environment variable is missing.")

CLOUDFLARE_TURNSTILE_SECRET_KEY: str | None = os.getenv("CLOUDFLARE_TURNSTILE_SECRET_KEY")
if not CLOUDFLARE_TURNSTILE_SECRET_KEY and STRICT_ENV_VALIDATION:
    raise ValueError("CRITICAL: CLOUDFLARE_TURNSTILE_SECRET_KEY environment variable is missing.")

ALLOWED_ORIGINS_RAW: str | None = os.getenv("ALLOWED_ORIGINS")
if not ALLOWED_ORIGINS_RAW and STRICT_ENV_VALIDATION:
    raise ValueError("CRITICAL: ALLOWED_ORIGINS environment variable is missing.")
ALLOWED_ORIGINS: List[str] = [origin.strip() for origin in (ALLOWED_ORIGINS_RAW or "").split(",") if origin.strip()]

MAX_FILE_SIZE_MB: int = 10
MAX_FILE_SIZE_BYTES: int = MAX_FILE_SIZE_MB * 1024 * 1024
MAX_MEGAPIXELS: int = 3
MAX_PIXELS: int = MAX_MEGAPIXELS * 1_000_000
MAX_IMAGE_DIMENSION: int = 1700
OPTIMIZATION_TARGET_PIXELS = 1_000_000

FORMAT_MAP = {
    "jpeg": "jpg",
    "jpg": "jpg",
    "png": "png",
    "webp": "webp"
}

ALLOWED_EXTENSIONS: FrozenSet[str] = frozenset(FORMAT_MAP.keys())
ALLOWED_MIME_TYPES: FrozenSet[str] = frozenset([
    f"image/{'jpeg' if ext == 'jpg' else ext}" 
    for ext in FORMAT_MAP.values()
])

DEFAULT_SCALE = 4

class ContainerNames:
    UPLOAD_CONTAINER: str = "uploads"
    RESULT_CONTAINER: str = "results"

class LimitConfig:
    UPLOAD_RATE_LIMIT: str = "5/minute"
    POLL_RATE_LIMIT: str = "60/minute"
    SAS_EXPIRATION_MINUTES: int = 11
    DAILY_USAGE_LIMIT: int = 3
    REMBG_DAILY_USAGE_LIMIT: int = 10  # Added for Background Removal

class DatabaseConfig:
    POOL_MIN_SIZE = 1
    POOL_MAX_SIZE = 10
    POOL_MAX_QUERIES = 50000
    POOL_MAX_INACTIVE_CONN_LIFETIME = 300.0
    POOL_COMMAND_TIMEOUT = 10

    INIT_MAX_RETRIES = 8
    INIT_BASE_DELAY_SECONDS = 0.5

    USAGE_RETENTION_HOURS = 48
    AZURE_SWEEP_INTERVAL_SECONDS = 300   # 5 minutes
    DB_SWEEP_INTERVAL_SECONDS = 43200    # 12 hours