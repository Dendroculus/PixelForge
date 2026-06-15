import io
import logging
from typing import Tuple
from PIL import Image
from fastapi import HTTPException, status

from core.config import FORMAT_MAP, MAX_MEGAPIXELS, MAX_PIXELS

Image.MAX_IMAGE_PIXELS = MAX_PIXELS
logger = logging.getLogger(__name__)

def smart_downscale(img: Image.Image, max_pixels: int) -> Image.Image:
    """
    Proportionally downscales a PIL Image if its total pixel count exceeds the specified maximum.
    Uses LANCZOS resampling for maximum quality.

    Args:
        img (Image.Image): The input PIL Image object.
        max_pixels (int): The maximum allowed total pixels (width * height).

    Returns:
        Image.Image: The downscaled image, or the original image if downscaling is not required.
    """
    width, height = img.size
    total_pixels = width * height

    if total_pixels > max_pixels:
        scale_factor = (max_pixels / total_pixels) ** 0.5
        new_width = max(1, int(width * scale_factor))
        new_height = max(1, int(height * scale_factor))
        return img.resize((new_width, new_height), Image.Resampling.LANCZOS)
    
    return img

def load_and_validate_structure(file_bytes: bytes) -> Tuple[Image.Image, str]:
    """
    Attempts to open and fully load the image from bytes.
    Validates against supported formats mapped in core.config.
    """
    try:
        img = Image.open(io.BytesIO(file_bytes))
        img.load()

        raw_format = (img.format or "").lower()
        normalized_ext = FORMAT_MAP.get(raw_format)

        if not normalized_ext:
            logger.warning("Rejected unsupported format: %s", raw_format)
            raise HTTPException(status_code=400, detail="Unsupported format.")

        return img, normalized_ext
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=400, detail="Invalid image data.") from e


def validate_resolution(img: Image.Image) -> None:
    """Ensures total pixel count does not exceed MAX_PIXELS."""
    width, height = img.size
    if (width * height) > MAX_PIXELS:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Resolution exceeds {MAX_MEGAPIXELS} megapixels."
        )

def normalize_image(img: Image.Image, ext: str) -> Tuple[Image.Image, str]:
    """
    Preserves alpha for PNG/WEBP, converts everything else to RGB/JPG.
    """
    if img.mode in ("RGBA", "LA", "P") and ext in ("png", "webp"):
        return img.convert("RGBA"), ext
    
    return img.convert("RGB"), "jpg"

def encode_image(clean_img: Image.Image, ext: str) -> io.BytesIO:
    """Encodes the cleaned image into a memory stream."""
    output_stream = io.BytesIO()
    save_format = "JPEG" if ext == "jpg" else ext.upper()

    clean_img.save(output_stream, format=save_format, quality=90, optimize=True)
    output_stream.seek(0)

    return output_stream