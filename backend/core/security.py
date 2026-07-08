"""Upload sanitization helpers for PixelForge.

This module provides a legacy/direct upload sanitization path. It protects the
backend from invalid or malicious image uploads by combining:

    - chunked streaming with an explicit byte limit
    - magic-number MIME validation
    - Pillow structure validation
    - resolution limits
    - controlled CPU concurrency for image normalization

The current direct-to-Azure flow may bypass this module for some endpoints, but
the functions remain useful for routes that accept ``UploadFile`` directly.
"""

import asyncio
import io
import logging
import os
import uuid
from typing import Tuple

import filetype
from fastapi import HTTPException, UploadFile, status
from PIL import UnidentifiedImageError

from core.config import ALLOWED_MIME_TYPES, settings
from services.azure.storage_utils import get_upload_filename
from utils.error import codes
from utils.error.responses import build_error_payload
from utils.image.image_utils import (
    encode_image,
    load_and_validate_structure,
    normalize_image,
    validate_resolution,
)

logger = logging.getLogger(__name__)

_SANITIZE_CPU_CONCURRENCY = int(os.getenv("SANITIZE_CPU_CONCURRENCY", "4"))
_sanitize_semaphore = asyncio.Semaphore(max(1, _SANITIZE_CPU_CONCURRENCY))


async def _read_file_with_limit(file: UploadFile) -> bytes:
    """Read and validate an uploaded file without exceeding memory limits.

    The first chunk is used for MIME signature detection. Remaining chunks are
    read incrementally so oversized uploads can be rejected as soon as they
    exceed the configured maximum size.

    Args:
        file:
            FastAPI uploaded file object.

    Raises:
        HTTPException:
            - 400 with ``INVALID_IMAGE`` when the upload is empty.
            - 415 with ``UNSUPPORTED_FORMAT`` when the file signature is not an
              allowed image MIME type.
            - 413 with ``UPLOAD_TOO_LARGE`` when the upload exceeds
              ``MAX_FILE_SIZE_BYTES``.

    Returns:
        bytes:
            Complete validated file bytes.
    """
    file_bytes = bytearray()
    chunk_size = 1024 * 1024

    initial_chunk = await file.read(2048)
    if not initial_chunk:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=build_error_payload(
                codes.INVALID_IMAGE,
                "Uploaded file is empty.",
            ),
        )

    kind = filetype.guess(initial_chunk)
    detected_mime = kind.mime if kind else "application/octet-stream"

    if detected_mime not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=build_error_payload(
                codes.UNSUPPORTED_FORMAT,
                "Unsupported media type.",
            ),
        )

    file_bytes.extend(initial_chunk)

    while True:
        chunk = await file.read(chunk_size)
        if not chunk:
            break

        file_bytes.extend(chunk)

        if len(file_bytes) > settings.MAX_FILE_SIZE_BYTES:
            logger.warning(
                "Upload aborted: File exceeded %sMB limit.",
                settings.MAX_FILE_SIZE_MB,
            )
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=build_error_payload(
                    codes.UPLOAD_TOO_LARGE,
                    f"File exceeds the {settings.MAX_FILE_SIZE_MB}MB limit.",
                ),
            )

    return bytes(file_bytes)


def _process_image_cpu(file_bytes: bytes) -> Tuple[str, str, bytes]:
    """Validate, normalize, and encode image bytes on a worker thread.

    Args:
        file_bytes:
            Raw image bytes from an uploaded file.

    Raises:
        HTTPException:
            Raised when image data is invalid, unsupported, oversized, or
            cannot be safely processed.

    Returns:
        tuple[str, str, bytes]:
            Generated job ID, safe upload filename, and normalized image bytes.
    """
    try:
        img, ext = load_and_validate_structure(file_bytes)
        validate_resolution(img)
        clean_img, final_ext = normalize_image(img, ext)
        output_stream = encode_image(clean_img, final_ext)

        job_id = uuid.uuid4().hex
        safe_filename = get_upload_filename(job_id, final_ext)

        return job_id, safe_filename, output_stream.getvalue()

    except HTTPException:
        raise
    except UnidentifiedImageError as e:
        logger.warning("Invalid file uploaded.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=build_error_payload(
                codes.INVALID_IMAGE,
                "Invalid image data.",
            ),
        ) from e
    except Exception as e:
        logger.error("Image processing failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=build_error_payload(
                codes.INVALID_IMAGE,
                "Image processing failed due to file corruption or invalid data.",
            ),
        ) from e


async def process_and_sanitize_image(file: UploadFile) -> Tuple[str, str, io.BytesIO]:
    """Sanitize an uploaded image and return a safe in-memory stream.

    Args:
        file:
            FastAPI uploaded file object.

    Returns:
        tuple[str, str, io.BytesIO]:
            Generated job ID, safe filename, and normalized image stream.
    """
    try:
        file_bytes = await _read_file_with_limit(file)
        async with _sanitize_semaphore:
            job_id, safe_filename, output_bytes = await asyncio.to_thread(
                _process_image_cpu,
                file_bytes,
            )
        return job_id, safe_filename, io.BytesIO(output_bytes)
    finally:
        await file.close()
