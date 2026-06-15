import io
import uuid
import logging
import asyncio
import os
import filetype
from typing import Tuple

from fastapi import HTTPException, UploadFile, status
from PIL import UnidentifiedImageError

from core.config import MAX_FILE_SIZE_MB, MAX_FILE_SIZE_BYTES, ALLOWED_MIME_TYPES
from utils.storage_utils import get_upload_filename
from utils.image_utils import (
    load_and_validate_structure,
    validate_resolution,
    normalize_image,
    encode_image
)

logger = logging.getLogger(__name__)

_SANITIZE_CPU_CONCURRENCY = int(os.getenv("SANITIZE_CPU_CONCURRENCY", "4"))
_sanitize_semaphore = asyncio.Semaphore(max(1, _SANITIZE_CPU_CONCURRENCY))


async def _read_file_with_limit(file: UploadFile) -> bytes:
    """
    Streams file in chunks. Defends against memory spikes and oversized payloads.
    Also acts as the first line of defense by checking MIME types via magic numbers.
    """
    file_bytes = bytearray()
    chunk_size = 1024 * 1024

    initial_chunk = await file.read(2048)
    if not initial_chunk:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty.")

    kind = filetype.guess(initial_chunk)
    detected_mime = kind.mime if kind else "application/octet-stream"

    if detected_mime not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Unsupported media type.")

    file_bytes.extend(initial_chunk)

    while True:
        chunk = await file.read(chunk_size)
        if not chunk:
            break

        file_bytes.extend(chunk)

        if len(file_bytes) > MAX_FILE_SIZE_BYTES:
            logger.warning("Upload aborted: File exceeded %sMB limit during streaming.", MAX_FILE_SIZE_MB)
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds the {MAX_FILE_SIZE_MB}MB limit."
            )

    return bytes(file_bytes)


def _process_image_cpu(file_bytes: bytes) -> Tuple[str, str, bytes]:
    """
    Synchronous pipeline delegating to pure utility functions.
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
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="FILE INVALID.") from e
    except Exception as e:
        logger.error("Image processing failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Image processing failed due to file corruption or invalid data."
        ) from e


async def process_and_sanitize_image(file: UploadFile) -> Tuple[str, str, io.BytesIO]:
    """
    Asynchronous entry point. Limits CPU-bound processing concurrency to prevent thread starvation.
    """
    try:
        file_bytes = await _read_file_with_limit(file)
        async with _sanitize_semaphore:
            job_id, safe_filename, output_bytes = await asyncio.to_thread(_process_image_cpu, file_bytes)
        return job_id, safe_filename, io.BytesIO(output_bytes)
    finally:
        await file.close()