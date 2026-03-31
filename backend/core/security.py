import io
import uuid
import logging
import asyncio
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

def _process_image_cpu(file_bytes: bytes) -> Tuple[str, str, bytes]:
    try:
        img, ext = _load_and_validate_structure(file_bytes)
        _validate_resolution(img)
        clean_img, final_ext = _normalize_image(img, ext)
        output_stream = _encode_image(clean_img, final_ext)
        job_id, safe_filename = _generate_metadata(final_ext)
        return job_id, safe_filename, output_stream.getvalue()
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

async def process_and_sanitize_image(file: UploadFile) -> Tuple[str, str, io.BytesIO]:
    try:
        file_bytes = await _read_file_with_limit(file)
        job_id, safe_filename, output_bytes = await asyncio.to_thread(_process_image_cpu, file_bytes)
        return job_id, safe_filename, io.BytesIO(output_bytes)
    finally:
        await file.close()

async def _read_file_with_limit(file: UploadFile) -> bytes:
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
    width, height = img.size
    if (width * height) > MAX_PIXELS:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Resolution exceeds {MAX_MEGAPIXELS} megapixels."
        )

def _normalize_image(img: Image.Image, ext: str) -> Tuple[str, Image.Image]:
    if img.mode in ("RGBA", "LA", "P") and ext in ("png", "webp"):
        clean_img = img.convert("RGBA")
    else:
        clean_img = img.convert("RGB")
        ext = "jpg"
        
    return clean_img, ext

def _encode_image(clean_img: Image.Image, ext: str) -> io.BytesIO:
    output_stream = io.BytesIO()
    save_format = "JPEG" if ext == "jpg" else ext.upper()

    clean_img.save(output_stream, format=save_format, quality=90, optimize=True)
    output_stream.seek(0)

    return output_stream

def _generate_metadata(ext: str) -> Tuple[str, str]:
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