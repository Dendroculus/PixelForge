import asyncio
import aiohttp
import io
import logging
import replicate
import urllib.parse
from PIL import Image
from services.storage import StorageService
from core.config import MAX_FILE_SIZE_BYTES, OPTIMIZATION_TARGET_PIXELS
from core.model_registry import ModelRegistry
from helper.utils import get_result_filename

logger = logging.getLogger(__name__)


class AIUpscaler:
    """
    Purpose: Handles full AI image upscaling pipeline
    Why: Orchestrates optimization → AI processing → download → encoding → storage
    """

    def __init__(self, max_concurrent_jobs: int = 5):
        """
        Purpose: Initialize concurrency control and limits
        Why: Prevents system overload with too many parallel AI jobs
        """
        self._semaphore = asyncio.Semaphore(max_concurrent_jobs)
        self.MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_BYTES

    @staticmethod
    def _sanitize_scale(scale) -> int:
        """
        Purpose: Validate and normalize scale value
        Why: Ensures scale stays within safe bounds (1–4)
        """
        try:
            n = int(scale)
        except (TypeError, ValueError):
            return 2
        if n < 1:
            return 1
        if n > 4:
            return 4
        return n

    async def run_upscale(
        self,
        safe_filename: str,
        job_id: str,
        model_type: str,
        scale: int = 2
    ) -> tuple[bool, str | None, str | None]:
        """
        Purpose: Execute full upscale workflow
        Flow:
            1. Load image
            2. Optimize input
            3. Send to AI model
            4. Download result
            5. Encode output
            6. Save result
        Output:
            (success, result_filename, error_message)
        """
        try:
            safe_scale = self._sanitize_scale(scale)

            async with self._semaphore:
                raw_bytes = await StorageService.get_upload_bytes(safe_filename)

                if len(raw_bytes) > self.MAX_FILE_SIZE_BYTES:
                    return False, None, "Payload exceeds maximum allowed size."

                optimized_stream = await asyncio.to_thread(
                    self._optimize_image_sync,
                    raw_bytes,
                    job_id
                )

                output_url = await self._process_with_ai(
                    optimized_stream,
                    job_id,
                    model_type
                )

                raw_result_bytes = await self._download_ai_result(
                    output_url,
                    job_id
                )

                final_bytes, ext = await asyncio.to_thread(
                    self._encode_output_sync,
                    raw_result_bytes,
                    safe_scale
                )

                if len(final_bytes) > self.MAX_FILE_SIZE_BYTES:
                    return False, None, "Final output exceeds maximum allowed size."

                result_filename = get_result_filename(job_id)

                if "." in result_filename:
                    result_filename = result_filename.rsplit(".", 1)[0] + f".{ext}"
                else:
                    result_filename = f"{result_filename}.{ext}"

                await StorageService.save_result(final_bytes, result_filename)

                return True, result_filename, None

        except Exception as e:
            logger.error("AI Engine error (Job #%s): %s", job_id, e)
            return False, None, "AI pipeline error."

    def _optimize_image_sync(self, raw_bytes: bytes, job_id: str) -> io.BytesIO:
        """
        Purpose: Reduce image size and validate integrity
        Why: Prevents excessive memory usage and improves AI processing efficiency
        """
        with io.BytesIO(raw_bytes) as img_stream:
            with Image.open(img_stream) as img:
                img.verify()

        with io.BytesIO(raw_bytes) as img_stream:
            with Image.open(img_stream) as img:
                width, height = img.size
                total_pixels = width * height

                output_stream = io.BytesIO()
                save_format = img.format or "JPEG"

                if total_pixels > OPTIMIZATION_TARGET_PIXELS:
                    ratio = (OPTIMIZATION_TARGET_PIXELS / total_pixels) ** 0.5
                    new_width = max(1, int(width * ratio))
                    new_height = max(1, int(height * ratio))
                    img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

                if img.mode in ("RGBA", "P") and save_format != "PNG":
                    img = img.convert("RGB")

                save_kwargs = {"format": save_format}

                if save_format.upper() in ("JPEG", "JPG"):
                    save_kwargs.update({
                        "quality": 95,
                        "optimize": True
                    })

                img.save(output_stream, **save_kwargs)
                output_stream.seek(0)

                return output_stream

    def _encode_output_sync(self, raw_bytes: bytes, scale: int = 2) -> tuple[bytes, str]:
        """
        Purpose: Resize and encode final AI output
        Why: Controls final resolution and ensures consistent format
        """
        safe_scale = self._sanitize_scale(scale)
        max_dimension = 4096

        with io.BytesIO(raw_bytes) as stream:
            with Image.open(stream) as img:
                img.load()

                if max(img.size) > max_dimension:
                    img.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)

                if safe_scale < 4:
                    target_w = max(1, int(img.width * (safe_scale / 4.0)))
                    target_h = max(1, int(img.height * (safe_scale / 4.0)))
                    img = img.resize((target_w, target_h), Image.Resampling.LANCZOS)

                if img.mode not in ("RGB", "RGBA"):
                    img = img.convert("RGBA" if "A" in img.getbands() else "RGB")

                out = io.BytesIO()
                img.save(out, format="PNG", optimize=True, compress_level=6)

                return out.getvalue(), "png"

    async def _process_with_ai(
        self,
        image_stream: io.BytesIO,
        job_id: str,
        model_type: str
    ) -> str:
        """
        Purpose: Send image to AI model (Replicate)
        Why: Performs actual upscaling using selected model
        """
        try:
            model_str = ModelRegistry.get_replicate_id(model_type)
            params = ModelRegistry.get_params(model_type)
        except ValueError:
            model_str = ModelRegistry.get_replicate_id("general")
            params = ModelRegistry.get_params("general")

        params["image"] = image_stream

        def call_replicate():
            try:
                return replicate.run(model_str, input=params)
            finally:
                image_stream.close()

        output = await asyncio.wait_for(
            asyncio.to_thread(call_replicate),
            timeout=300
        )

        return str(output[0]) if isinstance(output, list) else str(output)

    async def _download_ai_result(self, url: str, job_id: str) -> bytes:
        """
        Purpose: Download AI output securely
        Why: Validates source and prevents unsafe external requests
        """
        parsed_url = urllib.parse.urlparse(url)

        if parsed_url.scheme != "https":
            raise ValueError("Insecure protocol.")

        if parsed_url.netloc not in (
            "replicate.delivery",
            "pbxt.replicate.delivery"
        ):
            raise ValueError("Untrusted output URL domain.")

        timeout = aiohttp.ClientTimeout(total=60)

        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get(url) as resp:
                if resp.status != 200:
                    raise ValueError(f"Failed to download result: {resp.status}")
                return await resp.read()


ai_upscaler = AIUpscaler()