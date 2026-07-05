"""Pure image utility functions for PixelForge.

This module contains reusable Pillow-based helpers for downscaling, validating,
normalizing, and encoding image data. These functions are intentionally
stateless and separate from route/service logic so they are easier to test.
"""

import io
import logging
from typing import Tuple

from fastapi import HTTPException, status
from PIL import Image

from core.config import settings

Image.MAX_IMAGE_PIXELS = settings.MAX_SAFE_PIXELS
logger = logging.getLogger(__name__)


def smart_downscale(img: Image.Image, max_pixels: int) -> Image.Image:
    """Downscale an image proportionally when it exceeds a pixel limit.

    Args:
        img:
            Input Pillow image.
        max_pixels:
            Maximum allowed total pixels.

    Returns:
        Image.Image:
            Downscaled image, or the original image when no resize is needed.
    """
    width, height = img.size
    total_pixels = width * height

    if total_pixels > max_pixels:
        scale_factor = (max_pixels / total_pixels) ** 0.5
        new_width = max(1, int(width * scale_factor))
        new_height = max(1, int(height * scale_factor))

        logger.info(
            "📉 Image downscaled: %sx%s (%s px) -> %sx%s (%s px) to meet %s px limit.",
            width,
            height,
            f"{total_pixels:,}",
            new_width,
            new_height,
            f"{new_width * new_height:,}",
            f"{max_pixels:,}",
        )

        return img.resize((new_width, new_height), Image.Resampling.LANCZOS)

    return img


def load_and_validate_structure(file_bytes: bytes) -> Tuple[Image.Image, str]:
    """Load image bytes and validate that the format is supported.

    Args:
        file_bytes:
            Raw uploaded image bytes.

    Raises:
        HTTPException:
            Raised when image data is invalid or the detected format is not
            supported.

    Returns:
        tuple[Image.Image, str]:
            Loaded Pillow image and normalized extension.
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
    """Validate that an image stays under the configured megapixel limit.

    Args:
        img:
            Loaded Pillow image.

    Raises:
        HTTPException:
            Raised with HTTP 413 when image resolution is too large.
    """
    width, height = img.size
    if (width * height) > settings.MAX_PIXELS:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Resolution exceeds {settings.MAX_MEGAPIXELS} megapixels.",
        )


def normalize_image(img: Image.Image, ext: str) -> Tuple[Image.Image, str]:
    """Normalize image mode and output extension for AI compatibility.

    Args:
        img:
            Loaded Pillow image.
        ext:
            Normalized detected extension.

    Returns:
        tuple[Image.Image, str]:
            Normalized Pillow image and final extension.
    """
    if img.mode in ("RGBA", "LA", "P") and ext in ("png", "webp"):
        return img.convert("RGBA"), ext
    return img.convert("RGB"), "jpg"


def encode_image(clean_img: Image.Image, ext: str) -> io.BytesIO:
    """Encode a normalized Pillow image into an in-memory stream.

    Args:
        clean_img:
            Normalized Pillow image.
        ext:
            Target extension.

    Returns:
        io.BytesIO:
            Encoded image stream positioned at the start.
    """
    output_stream = io.BytesIO()
    save_format = "JPEG" if ext == "jpg" else ext.upper()

    clean_img.save(output_stream, format=save_format, quality=90, optimize=True)
    output_stream.seek(0)

    return output_stream
