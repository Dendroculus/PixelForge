"""Pure image utility functions for PixelForge.

This module contains reusable Pillow-based helpers for downscaling, validating,
normalizing, and encoding image data. These functions are intentionally
stateless and separate from route/service logic so they are easier to test.

The helpers here protect the AI pipeline from two common image risks:
    - compressed files with deceptively large resolution
    - generated AI outputs that become too large after processing

The frontend may run similar validation for user experience, but these backend
helpers remain the source of truth because browser validation can be bypassed.
"""

import io
import logging
from typing import Tuple

from fastapi import HTTPException, status
from PIL import Image

from core.config import settings
from utils.error import codes
from utils.error.responses import build_error_payload

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
            Raised with structured ``INVALID_IMAGE`` or ``UNSUPPORTED_FORMAT``
            payloads when image data is invalid or the detected format is not
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
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=build_error_payload(
                    codes.UNSUPPORTED_FORMAT,
                    "Unsupported image format.",
                ),
            )

        return img, normalized_ext
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=build_error_payload(
                codes.INVALID_IMAGE,
                "Invalid image data.",
            ),
        ) from e


def validate_resolution(
    img: Image.Image,
    max_pixels: int | None = None,
    max_megapixels: float | None = None,
) -> None:
    """Validate that an image stays under the configured pixel limit.

    Args:
        img:
            Loaded Pillow image.
        max_pixels:
            Maximum allowed total pixels. Defaults to the public upload limit.
        max_megapixels:
            User-facing megapixel label for error messages. Defaults to the
            public upload megapixel limit.

    Raises:
        HTTPException:
            Raised with HTTP 413 and ``IMAGE_TOO_LARGE`` when image resolution
            is too large.
    """
    width, height = img.size
    total_pixels = width * height
    resolved_max_pixels = max_pixels or settings.MAX_PIXELS
    resolved_max_megapixels = max_megapixels or settings.MAX_MEGAPIXELS

    if total_pixels > resolved_max_pixels:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=build_error_payload(
                codes.IMAGE_TOO_LARGE,
                (
                    f"Resolution exceeds {resolved_max_megapixels:g} megapixels. "
                    f"Uploaded image is {width}x{height}."
                ),
                details={
                    "width": width,
                    "height": height,
                    "pixels": total_pixels,
                    "max_pixels": resolved_max_pixels,
                },
            ),
        )


    def validate_image_bytes_resolution(
        file_bytes: bytes,
        max_pixels: int | None = None,
        max_megapixels: float | None = None,
    ) -> Tuple[int, int, int]:
        """Validate uploaded image bytes and return width, height, and pixel count.

        This helper is used by the direct-to-Azure AI job flow after the backend
        downloads the uploaded blob. It prevents small-byte but unsafe-resolution
        images from being sent to AI providers.

        Args:
            file_bytes:
                Raw uploaded image bytes.
            max_pixels:
                Maximum allowed total pixels. Defaults to the public upload limit.
            max_megapixels:
                User-facing megapixel label for error messages.

        Raises:
            HTTPException:
                Raised when image data is invalid, unsupported, or exceeds the
                configured resolution limit.

        Returns:
            tuple[int, int, int]:
                Image width, height, and total pixel count.
        """
        img, _ = load_and_validate_structure(file_bytes)
        validate_resolution(
            img,
            max_pixels=max_pixels,
            max_megapixels=max_megapixels,
        )

        width, height = img.size
        return width, height, width * height


def validate_image_bytes_resolution(file_bytes: bytes) -> Tuple[int, int, int]:
    """Validate uploaded image bytes and return width, height, and pixel count.

    This helper is used by the direct-to-Azure AI job flow after the backend
    downloads the uploaded blob. It prevents small-byte but huge-resolution
    images from being sent to AI providers.

    Args:
        file_bytes:
            Raw uploaded image bytes.

    Raises:
        HTTPException:
            Raised when image data is invalid, unsupported, or exceeds the
            configured resolution limit.

    Returns:
        tuple[int, int, int]:
            Image width, height, and total pixel count.
    """
    img, _ = load_and_validate_structure(file_bytes)
    validate_resolution(img)

    width, height = img.size
    return width, height, width * height


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


def image_has_alpha(img: Image.Image) -> bool:
    """Return whether an image has transparency that should be preserved.

    Args:
        img:
            Pillow image to inspect.

    Returns:
        bool:
            ``True`` when the image has an alpha channel or palette
            transparency metadata.
    """
    return (
        img.mode in ("RGBA", "LA")
        or (img.mode == "P" and "transparency" in img.info)
    )


def encode_png_under_size(
    img: Image.Image,
    max_bytes: int,
    *,
    min_dimension: int = settings.MIN_OUTPUT_DIMENSION,
    shrink_step: float = settings.OUTPUT_SHRINK_STEP,
) -> bytes:
    """Encode an image as PNG and shrink it until it fits under max_bytes.

    The output remains PNG because PixelForge result filenames currently use
    ``.png``. Transparency is preserved for features like background removal.

    Args:
        img:
            Pillow image to encode.
        max_bytes:
            Maximum encoded byte size.
        min_dimension:
            Smallest allowed maximum dimension before giving up.
        shrink_step:
            Multiplicative resize factor used after each failed encode attempt.

    Raises:
        ValueError:
            Raised when the result cannot be made small enough without going
            below ``min_dimension``.

    Returns:
        bytes:
            PNG-encoded image bytes under ``max_bytes``.
    """
    if image_has_alpha(img):
        working_img = img.convert("RGBA")
    else:
        working_img = img.convert("RGB")

    while True:
        output_stream = io.BytesIO()
        working_img.save(
            output_stream,
            format="PNG",
            optimize=True,
            compress_level=9,
        )
        result_bytes = output_stream.getvalue()

        if len(result_bytes) <= max_bytes:
            return result_bytes

        width, height = working_img.size

        if max(width, height) <= min_dimension:
            raise ValueError("Output exceeds maximum size even after compression.")

        new_width = max(1, int(width * shrink_step))
        new_height = max(1, int(height * shrink_step))

        logger.warning(
            "Generated image too large: %.2f MB. Shrinking %sx%s -> %sx%s.",
            len(result_bytes) / 1024 / 1024,
            width,
            height,
            new_width,
            new_height,
        )

        working_img = working_img.resize(
            (new_width, new_height),
            Image.Resampling.LANCZOS,
        )


def fit_image_bytes_under_size(
    image_bytes: bytes,
    max_bytes: int,
    *,
    min_dimension: int = settings.MIN_OUTPUT_DIMENSION,
    shrink_step: float = settings.OUTPUT_SHRINK_STEP,
) -> bytes:
    """Open image bytes and return PNG bytes that fit under max_bytes.

    This function is used after AI generation and before saving to Azure. It
    prevents oversized AI outputs from failing late or being stored too large.

    Args:
        image_bytes:
            Raw encoded image bytes returned by an AI provider or feature
            postprocessor.
        max_bytes:
            Maximum allowed output byte size.
        min_dimension:
            Smallest allowed maximum dimension before giving up.
        shrink_step:
            Multiplicative resize factor used after each failed encode attempt.

    Returns:
        bytes:
            PNG-encoded bytes under ``max_bytes``.
    """
    with io.BytesIO(image_bytes) as input_stream:
        with Image.open(input_stream) as img:
            img.load()

            return encode_png_under_size(
                img,
                max_bytes,
                min_dimension=min_dimension,
                shrink_step=shrink_step,
            )
