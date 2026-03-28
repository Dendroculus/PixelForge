import os
from typing import List, FrozenSet
from dotenv import load_dotenv

load_dotenv()

ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development").lower()

AZURE_CONNECTION_STRING: str | None = os.getenv("AZURE_CONNECTION_STRING")
if not AZURE_CONNECTION_STRING:
    raise ValueError("CRITICAL: AZURE_CONNECTION_STRING environment variable is missing. Application cannot start.")

CLOUDFLARE_TURNSTILE_SECRET_KEY: str | None = os.getenv("CLOUDFLARE_TURNSTILE_SECRET_KEY")
if not CLOUDFLARE_TURNSTILE_SECRET_KEY:
    raise ValueError("CRITICAL: CLOUDFLARE_TURNSTILE_SECRET_KEY environment variable is missing. Application cannot start.")

ALLOWED_ORIGINS_RAW: str | None = os.getenv("ALLOWED_ORIGINS")
if not ALLOWED_ORIGINS_RAW:
    raise ValueError("CRITICAL: ALLOWED_ORIGINS environment variable is missing. Application cannot start securely.")
ALLOWED_ORIGINS: List[str] = [origin.strip() for origin in ALLOWED_ORIGINS_RAW.split(",") if origin.strip()]

MAX_FILE_SIZE_MB: int = 10
MAX_FILE_SIZE_BYTES: int = MAX_FILE_SIZE_MB * 1024 * 1024
MAX_MEGAPIXELS: int = 3
MAX_PIXELS: int = MAX_MEGAPIXELS * 1_000_000
MAX_IMAGE_DIMENSION: int = 1700

ALLOWED_EXTENSIONS: FrozenSet[str] = frozenset(["jpg", "jpeg", "png", "webp"])
ALLOWED_MIME_TYPES: FrozenSet[str] = frozenset([
    "image/jpeg", 
    "image/png", 
    "image/webp"
])