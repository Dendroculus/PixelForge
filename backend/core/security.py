import io
import uuid
import logging
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

async def process_and_sanitize_image(file: UploadFile) -> Tuple[str, str, io.BytesIO]:
    """
    High-level orchestration for secure image ingestion.

    Pipeline:
    - Validate MIME type
    - Stream and enforce size limits
    - Verify image integrity
    - Validate format and resolution
    - Normalize and re-encode image
    - Generate job metadata

    Returns:
        Tuple[str, str, io.BytesIO]:
            job_id, safe_filename, sanitized image stream
    """
    try:
        _validate_mime_type(file)
        
        file_bytes = await _read_file_with_limit(file)

        img, ext = _load_and_validate_structure(file_bytes)
        
        _validate_resolution(img)

        clean_img, final_ext = _normalize_image(img, ext)
        output_stream = _encode_image(clean_img, final_ext)

        job_id, safe_filename = _generate_metadata(final_ext)
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
        logger.error(f"Image processing failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Image processing failed due to file corruption or invalid data."
        )
    finally:
        await file.close()


def _validate_mime_type(file: UploadFile) -> None:
    """
    Ensures the uploaded file MIME type is allowed.
    """
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported media type."
        )


async def _read_file_with_limit(file: UploadFile) -> bytes:
    """
    Streams file content while enforcing maximum size limits.

    Returns:
        bytes: Complete file content within allowed size
    """
    file_bytes = bytearray()
    chunk_size = 1024 * 1024

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

    return bytes(file_bytes)


def _validate_resolution(img: Image.Image) -> None:
    """
    Validates image resolution against configured limits.
    """
    width, height = img.size
    if (width * height) > MAX_PIXELS:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Resolution exceeds {MAX_MEGAPIXELS} megapixels."
        )


def _normalize_image(img: Image.Image, ext: str) -> Tuple[str, Image.Image]:
    """
    Normalizes color mode. Extension is assumed already normalized to 'jpg', 'png', or 'webp'.
    """
    # ext is already "jpg" from _load_and_validate_structure
    if img.mode in ("RGBA", "LA", "P") and ext in ("png", "webp"):
        clean_img = img.convert("RGBA")
    else:
        clean_img = img.convert("RGB")
        ext = "jpg"
        
    return clean_img, ext

def _encode_image(clean_img: Image.Image, ext: str) -> io.BytesIO:
    """
    Re-encodes image to strip metadata and enforce safe format.

    Returns:
        io.BytesIO: Encoded image stream
    """
    output_stream = io.BytesIO()
    save_format = "JPEG" if ext == "jpg" else ext.upper()

    clean_img.save(output_stream, format=save_format, quality=90, optimize=True)
    output_stream.seek(0)

    return output_stream


def _generate_metadata(ext: str) -> Tuple[str, str]:
    """
    Generates job identifier and safe filename.

    Returns:
        Tuple[str, str]: job_id and filename
    """
    job_id = uuid.uuid4().hex
    safe_filename = get_upload_filename(job_id, ext)
    return job_id, safe_filename

def _load_and_validate_structure(file_bytes: bytes) -> Tuple[Image.Image, str]:
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
        raise HTTPException(status_code=400, detail="Invalid image data.")