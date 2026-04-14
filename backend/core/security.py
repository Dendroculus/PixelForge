import io
import uuid
import logging
import asyncio
import os
import filetype
from typing import Tuple

from fastapi import HTTPException, UploadFile, status
from PIL import Image, UnidentifiedImageError

from core.config import (
    FORMAT_MAP,
    MAX_FILE_SIZE_MB,
    MAX_FILE_SIZE_BYTES,
    MAX_MEGAPIXELS,
    MAX_PIXELS,
    ALLOWED_MIME_TYPES,
)
from helper.utils import get_upload_filename

Image.MAX_IMAGE_PIXELS = MAX_PIXELS

logger = logging.getLogger(__name__)

_SANITIZE_CPU_CONCURRENCY = int(os.getenv("SANITIZE_CPU_CONCURRENCY", "4"))
_sanitize_semaphore = asyncio.Semaphore(max(1, _SANITIZE_CPU_CONCURRENCY))


def _process_image_cpu(file_bytes: bytes) -> Tuple[str, str, bytes]:
    """
    Perform CPU-bound image processing and sanitization.

    Steps:
    - Load and validate image structure and format.
    - Validate resolution against configured limits.
    - Normalize image mode and format.
    - Encode the cleaned image into bytes.
    - Generate metadata (job ID and safe filename).

    Args:
        file_bytes (bytes): Raw uploaded file content.

    Returns:
        Tuple[str, str, bytes]:
            job_id (str): Unique identifier for the processing job.
            safe_filename (str): Sanitized filename for storage.
            output_bytes (bytes): Processed image in byte form.

    Raises:
        HTTPException: If image is invalid, unsupported, or corrupted.
    """
    try:
        img, ext = _load_and_validate_structure(file_bytes)
        _validate_resolution(img)
        clean_img, final_ext = _normalize_image(img, ext)
        output_stream = _encode_image(clean_img, final_ext)
        job_id, safe_filename = _generate_metadata(final_ext)
        return job_id, safe_filename, output_stream.getvalue()
    except HTTPException:
        raise
    except UnidentifiedImageError as e:
        logger.warning("Unidentified image format. Possible malicious polyglot attempt.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image data."
        ) from e
    except Exception as e:
        logger.error(f"Image processing failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Image processing failed due to file corruption or invalid data."
        ) from e


async def process_and_sanitize_image(file: UploadFile) -> Tuple[str, str, io.BytesIO]:
    """
    Asynchronously process and sanitize an uploaded image file.

    This function:
    - Reads file safely with size and MIME validation.
    - Limits concurrent CPU-bound processing using a semaphore.
    - Offloads heavy processing to a background thread.

    Args:
        file (UploadFile): Uploaded file from FastAPI request.

    Returns:
        Tuple[str, str, io.BytesIO]:
            job_id (str): Unique identifier for the processing job.
            safe_filename (str): Sanitized filename.
            output_stream (BytesIO): Processed image stream.

    Raises:
        HTTPException: If file validation or processing fails.
    """
    try:
        file_bytes = await _read_file_with_limit(file)
        async with _sanitize_semaphore:
            job_id, safe_filename, output_bytes = await asyncio.to_thread(_process_image_cpu, file_bytes)
        return job_id, safe_filename, io.BytesIO(output_bytes)
    finally:
        await file.close()


async def _read_file_with_limit(file: UploadFile) -> bytes:
    """
    Read uploaded file in chunks while enforcing size and MIME type restrictions.

    This function:
    - Reads initial bytes to detect MIME type.
    - Validates against allowed MIME types.
    - Streams the file in chunks to avoid memory spikes.
    - Enforces maximum file size limit.

    Args:
        file (UploadFile): Uploaded file object.

    Returns:
        bytes: Full file content.

    Raises:
        HTTPException:
            - 400 if file is empty.
            - 415 if MIME type is unsupported.
            - 413 if file exceeds size limit.
    """
    file_bytes = bytearray()
    chunk_size = 1024 * 1024

    initial_chunk = await file.read(2048)
    if not initial_chunk:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty."
        )

    kind = filetype.guess(initial_chunk)
    detected_mime = kind.mime if kind else "application/octet-stream"

    if detected_mime not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported media type."
        )

    file_bytes.extend(initial_chunk)

    while True:
        chunk = await file.read(chunk_size)
        if not chunk:
            break

        file_bytes.extend(chunk)

        if len(file_bytes) > MAX_FILE_SIZE_BYTES:
            logger.warning(f"Upload aborted: File exceeded {MAX_FILE_SIZE_MB}MB limit during streaming.")
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds the {MAX_FILE_SIZE_MB}MB limit."
            )

    return bytes(file_bytes)


def _validate_resolution(img: Image.Image) -> None:
    """
    Validate that image resolution does not exceed configured limits.

    Args:
        img (Image.Image): Loaded image object.

    Raises:
        HTTPException: If total pixel count exceeds MAX_PIXELS.
    """
    width, height = img.size
    if (width * height) > MAX_PIXELS:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Resolution exceeds {MAX_MEGAPIXELS} megapixels."
        )


def _normalize_image(img: Image.Image, ext: str) -> Tuple[Image.Image, str]:
    """
    Normalize image mode and adjust format if necessary.

    Rules:
    - Preserve alpha channel for PNG/WEBP when applicable.
    - Convert all other formats to RGB and fallback to JPEG.

    Args:
        img (Image.Image): Loaded image.
        ext (str): Original normalized extension.

    Returns:
        Tuple[Image.Image, str]:
            clean_img (Image.Image): Converted image.
            ext (str): Final output extension.
    """
    if img.mode in ("RGBA", "LA", "P") and ext in ("png", "webp"):
        clean_img = img.convert("RGBA")
    else:
        clean_img = img.convert("RGB")
        ext = "jpg"

    return clean_img, ext


def _encode_image(clean_img: Image.Image, ext: str) -> io.BytesIO:
    """
    Encode image into a compressed output stream.

    Args:
        clean_img (Image.Image): Processed image.
        ext (str): Target file extension.

    Returns:
        io.BytesIO: Encoded image stream.
    """
    output_stream = io.BytesIO()
    save_format = "JPEG" if ext == "jpg" else ext.upper()

    clean_img.save(output_stream, format=save_format, quality=90, optimize=True)
    output_stream.seek(0)

    return output_stream


def _generate_metadata(ext: str) -> Tuple[str, str]:
    """
    Generate unique job metadata.

    Args:
        ext (str): File extension for output image.

    Returns:
        Tuple[str, str]:
            job_id (str): Unique identifier.
            safe_filename (str): Generated safe filename.
    """
    job_id = uuid.uuid4().hex
    safe_filename = get_upload_filename(job_id, ext)
    return job_id, safe_filename


def _load_and_validate_structure(file_bytes: bytes) -> Tuple[Image.Image, str]:
    """
    Load image from bytes and validate its format.

    This function:
    - Attempts to open and fully load the image.
    - Extracts and normalizes its format.
    - Validates against supported formats.

    Args:
        file_bytes (bytes): Raw file content.

    Returns:
        Tuple[Image.Image, str]:
            img (Image.Image): Loaded image object.
            normalized_ext (str): Validated file extension.

    Raises:
        HTTPException:
            - 400 if image is invalid or unsupported.
    """
    try:
        img = Image.open(io.BytesIO(file_bytes))
        img.load()

        raw_format = (img.format or "").lower()
        normalized_ext = FORMAT_MAP.get(raw_format)

        if not normalized_ext:
            logger.warning(f"Rejected unsupported format: {raw_format}")
            raise HTTPException(status_code=400, detail="Unsupported format.")

        return img, normalized_ext
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=400, detail="Invalid image data.") from e