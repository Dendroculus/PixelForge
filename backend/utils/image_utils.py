"""
Image Utilities Module

Provides pure, stateless functions for processing, validating, and 
transforming image byte streams using Pillow. Decoupled from core 
application logic for easy testing and reuse.
"""

import io
import logging
from typing import Tuple
from PIL import Image
from fastapi import HTTPException, status

from core.config import settings

Image.MAX_IMAGE_PIXELS = settings.MAX_PIXELS
logger = logging.getLogger(__name__)

def smart_downscale(img: Image.Image, max_pixels: int) -> Image.Image:
    """
    Proportionally downscales a PIL Image if its total pixel count exceeds the maximum.
    Uses LANCZOS resampling for maximum quality preservation.

    Args:
        img: The input PIL Image object.
        max_pixels: The maximum allowed total pixels (width * height).

    Returns:
        Image.Image: The downscaled image, or the original image if no downscaling was needed.
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
    Attempts to open and fully load an image from raw bytes, verifying its internal structure.

    Args:
        file_bytes: Raw byte string of the uploaded file.

    Raises:
        HTTPException: 
            - 400 error if the image format is unsupported by the configuration.
            - 400 error if the image data is corrupt or cannot be parsed by Pillow.

    Returns:
        Tuple[Image.Image, str]: The loaded PIL Image object and its normalized extension string.
    """
    try:
        img = Image.open(io.BytesIO(file_bytes))
        img.load()

        raw_format = (img.format or "").lower()
        normalized_ext = settings.FORMAT_MAP.get(raw_format)

        if not normalized_ext:
            logger.warning("Rejected unsupported format: %s", raw_format)
            raise HTTPException(status_code=400, detail="Unsupported format.")

        return img, normalized_ext
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=400, detail="Invalid image data.") from e

def validate_resolution(img: Image.Image) -> None:
    """
    Ensures the image's total pixel count does not exceed the absolute security limit.
    This defends against decompression bomb (Zip Bomb) attacks.

    Args:
        img: The loaded PIL Image object.

    Raises:
        HTTPException: 413 error if the resolution exceeds the configured maximum.

    Returns:
        None.
    """
    width, height = img.size
    if (width * height) > settings.MAX_PIXELS:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Resolution exceeds {settings.MAX_MEGAPIXELS} megapixels."
        )

def normalize_image(img: Image.Image, ext: str) -> Tuple[Image.Image, str]:
    """
    Normalizes the image color space to ensure compatibility with AI models.
    Preserves alpha channels (transparency) for PNG and WEBP formats, 
    otherwise flattens the image to standard RGB.

    Args:
        img: The loaded PIL Image object.
        ext: The normalized file extension.

    Returns:
        Tuple[Image.Image, str]: The normalized image and its final destination extension.
    """
    if img.mode in ("RGBA", "LA", "P") and ext in ("png", "webp"):
        return img.convert("RGBA"), ext
    return img.convert("RGB"), "jpg"

def encode_image(clean_img: Image.Image, ext: str) -> io.BytesIO:
    """
    Encodes the cleaned PIL Image object back into an optimized memory stream.

    Args:
        clean_img: The normalized PIL Image object.
        ext: The target file extension.

    Returns:
        io.BytesIO: A memory stream containing the encoded image bytes.
    """
    output_stream = io.BytesIO()
    save_format = "JPEG" if ext == "jpg" else ext.upper()

    clean_img.save(output_stream, format=save_format, quality=90, optimize=True)
    output_stream.seek(0)

    return output_stream