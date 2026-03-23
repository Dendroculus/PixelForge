import os
from dotenv import load_dotenv

load_dotenv() 

AZURE_CONNECTION_STRING = os.getenv("AZURE_CONNECTION_STRING")

# Hardcoded constants - change them here if you ever need to!
MAX_FILE_SIZE_MB = 10
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

MAX_MEGAPIXELS = 3
MAX_PIXELS = MAX_MEGAPIXELS * 1_000_000

MAX_IMAGE_DIMENSION = 2500

ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"]
ALLOWED_MIME_TYPES = [f"image/{ext}" for ext in ALLOWED_EXTENSIONS if ext != "jpg"]