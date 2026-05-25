import os
from typing import List, FrozenSet
from dotenv import load_dotenv
from helper.error import MissingEnvironmentVariableError

load_dotenv()

ENVIRONMENT = os.getenv("ENVIRONMENT", "development").strip().lower()
STRICT_ENV_VALIDATION = os.getenv("STRICT_ENV_VALIDATION", "true").strip().lower() in {"1", "true", "yes", "on"}


def get_required_env(variable_name: str) -> str:
    """
    Fetches the value of an environment variable and raises an error if it's missing when strict validation is enabled.
    
    Args:
        variable_name (str): The name of the environment variable to fetch.
    Returns:
        str: The value of the environment variable, or an empty string if it's missing and strict validation is disabled.
    Raises:
        Exception: If the environment variable is missing and strict validation is enabled.
    """
    value = os.getenv(variable_name)
    if not value and STRICT_ENV_VALIDATION:
        raise MissingEnvironmentVariableError(f"CRITICAL: {variable_name} environment variable is missing.")
    return value or ""


DATABASE_URL = get_required_env("DATABASE_URL")
AZURE_CONNECTION_STRING = get_required_env("AZURE_CONNECTION_STRING")
CLOUDFLARE_TURNSTILE_SECRET_KEY = get_required_env("CLOUDFLARE_TURNSTILE_SECRET_KEY")
DISCORD_WEBHOOK_URL = get_required_env("DISCORD_WEBHOOK_URL")
REPLICATE_API_TOKEN = get_required_env("REPLICATE_API_TOKEN")

ALLOWED_ORIGINS_RAW = get_required_env("ALLOWED_ORIGINS")
ALLOWED_ORIGINS: List[str] = [
    origin.strip() for origin in (ALLOWED_ORIGINS_RAW or "").split(",") if origin.strip()
]



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
    "webp": "webp",
}

ALLOWED_EXTENSIONS: FrozenSet[str] = frozenset(FORMAT_MAP.keys())
ALLOWED_MIME_TYPES: FrozenSet[str] = frozenset([
    f"image/{'jpeg' if ext == 'jpg' else ext}" 
    for ext in FORMAT_MAP.values()
])

DEFAULT_SCALE = 4
MAX_CONCURENT_JOBS = 5

class ContainerNames:
    UPLOAD_CONTAINER: str = "uploads"
    RESULT_CONTAINER: str = "results"

class LimitConfig:
    UPLOAD_RATE_LIMIT: str = "5/minute"
    POLL_RATE_LIMIT: str = "60/minute"
    SAS_EXPIRATION_MINUTES: int = 11
    UPSCALE_DAILY_USAGE_LIMIT: int = 3
    REMBG_DAILY_USAGE_LIMIT: int = 5 
    COLOR_RESTORE_DAILY_USAGE_LIMIT: int = 5
    FEEDBACK_RATE_LIMIT: str = "3/hour"
    FEEDBACK_DAILY_USAGE_LIMIT: int = 5

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
    
FEATURE_LIMITS = {
    "upscale": LimitConfig.UPSCALE_DAILY_USAGE_LIMIT,
    "rembg": LimitConfig.REMBG_DAILY_USAGE_LIMIT,
    "colorrestore": LimitConfig.COLOR_RESTORE_DAILY_USAGE_LIMIT,
    "feedback": LimitConfig.FEEDBACK_DAILY_USAGE_LIMIT,
}