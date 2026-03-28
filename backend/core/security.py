import io
import uuid
import logging
from typing import Tuple

from fastapi import HTTPException, UploadFile, status
from PIL import Image, UnidentifiedImageError

from core.config import (
    MAX_FILE_SIZE_MB, 
    MAX_FILE_SIZE_BYTES, 
    MAX_MEGAPIXELS, 
    MAX_PIXELS,
    ALLOWED_MIME_TYPES
)

Image.MAX_IMAGE_PIXELS = MAX_PIXELS

logger = logging.getLogger(__name__)

ALLOWED_FORMATS = frozenset(["jpeg", "png", "webp"])

async def process_and_sanitize_image(file: UploadFile) -> Tuple[str, str, io.BytesIO]:
    """
    Validates, sanitizes, and re-encodes an uploaded image to neutralize 
    polyglots and strip EXIF data.

    Args:
        file (UploadFile): The uploaded file object.

    Returns:
        Tuple[str, str, io.BytesIO]:
            - job_id (str): Unique identifier for the job.
            - safe_filename (str): Generated safe filename with the correct extension.
            - image_stream (io.BytesIO): The sanitized, re-encoded image data ready for saving.

    Raises:
        HTTPException: If the file exceeds size limits, has an invalid format, 
                       or fails security verification.
    """
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported media type."
        )

    file_bytes = bytearray()
    chunk_size = 1024 * 1024  # 1MB

    try:
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

        if not file_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty."
            )

        with Image.open(io.BytesIO(file_bytes)) as img:
            img.verify()

        with Image.open(io.BytesIO(file_bytes)) as img:
            img_format = img.format.lower() if img.format else None
            
            if img_format not in ALLOWED_FORMATS:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid or unsupported image format."
                )

            width, height = img.size
            if (width * height) > MAX_PIXELS:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"Resolution exceeds {MAX_MEGAPIXELS} megapixels."
                )

            ext = "jpg" if img_format == "jpeg" else img_format
            
            if img.mode in ("RGBA", "LA", "P") and ext in ("png", "webp"):
                clean_img = img.convert("RGBA")
            else:
                clean_img = img.convert("RGB")
                ext = "jpg"

            output_stream = io.BytesIO()
            save_format = "JPEG" if ext == "jpg" else ext.upper()
            
            clean_img.save(output_stream, format=save_format, quality=90, optimize=True)
            output_stream.seek(0)

            job_id = uuid.uuid4().hex
            safe_filename = f"{job_id}.{ext}"

            return job_id, safe_filename, output_stream

    except HTTPException:
        raise
    except UnidentifiedImageError:
        logger.warning("Unidentified image format. Possible malicious polyglot attempt.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image data."
        )
    except Exception as e:
        logger.error(f"Image processing failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Image processing failed due to file corruption or invalid data."
        )
    finally:
        await file.close()