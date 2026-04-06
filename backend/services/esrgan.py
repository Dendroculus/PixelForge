import asyncio
import aiohttp
import io
import logging
import replicate
import urllib.parse
from PIL import Image
from services.storage import StorageService
from core.config import DEFAULT_SCALE, MAX_FILE_SIZE_BYTES, OPTIMIZATION_TARGET_PIXELS
from core.model_registry import ModelRegistry
from helper.utils import get_result_filename

logger = logging.getLogger(__name__)


class AIUpscaler:
    """
    Purpose: Handles full AI image upscaling pipeline using Replicate
    Why: Orchestrates download, optimization, AI processing, compression, and storage
    """

    def __init__(self, max_concurrent_jobs: int = 5):
        self._semaphore = asyncio.Semaphore(max_concurrent_jobs)
        self.MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_BYTES

    async def run_upscale(self, safe_filename: str, job_id: str, model_type: str, scale: int = 4) -> bool:
        """
        Purpose: Executes full upscaling workflow for a single job
        Input:
            safe_filename (str): source file identifier
            job_id (str): unique job identifier
            model_type (str): selected AI model type
            scale (int): upscaling multiplier (e.g. 1, 2, 3, 4)
        Output:
            bool: success status
        """
        try:
            async with self._semaphore:
                raw_bytes = await StorageService.get_upload_bytes(safe_filename)

                if len(raw_bytes) > self.MAX_FILE_SIZE_BYTES:
                    raise ValueError("Payload exceeds maximum allowed size.")

                optimized_stream = await asyncio.to_thread(self._optimize_image_sync, raw_bytes, job_id)
                output_url = await self._process_with_ai(optimized_stream, job_id, model_type, scale)

                raw_result_bytes = await self._download_ai_result(output_url, job_id)
                compressed_bytes = await asyncio.to_thread(self._compress_output_sync, raw_result_bytes)

                if len(compressed_bytes) > self.MAX_FILE_SIZE_BYTES:
                    raise ValueError("Compressed output still exceeds maximum allowed size.")

                result_filename = get_result_filename(job_id)
                await StorageService.save_result(compressed_bytes, result_filename)

                return True

        except Exception as e:
            logger.error(f"❌ AI Engine Error (Job #{job_id}): {e}")
            return False

    def _optimize_image_sync(self, raw_bytes: bytes, job_id: str) -> io.BytesIO:
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
                    save_kwargs.update({"quality": 95, "optimize": True})

                img.save(output_stream, **save_kwargs)
                output_stream.seek(0)
                return output_stream

    def _compress_output_sync(self, raw_bytes: bytes) -> bytes:
        MAX_DIMENSION = 4096

        with io.BytesIO(raw_bytes) as input_stream:
            with Image.open(input_stream) as img:
                img.load()

                if max(img.size) > MAX_DIMENSION:
                    img.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.Resampling.LANCZOS)

                output_stream = io.BytesIO()
                
                img.save(output_stream, format="PNG", optimize=False)
                
                return output_stream.getvalue()

    async def _process_with_ai(self, image_stream: io.BytesIO, job_id: str, model_type: str, scale: int) -> str:
        try:
            model_str = ModelRegistry.get_replicate_id(model_type)
            params = ModelRegistry.get_params(model_type, scale=scale)
        except ValueError:
            model_str = ModelRegistry.get_replicate_id("general")
            params = ModelRegistry.get_params("general", scale=DEFAULT_SCALE)

        params["image"] = image_stream

        def call_replicate():
            try:
                return replicate.run(model_str, input=params)
            finally:
                image_stream.close()

        output = await asyncio.wait_for(asyncio.to_thread(call_replicate), timeout=300)
        return str(output[0]) if isinstance(output, list) else str(output)

    async def _download_ai_result(self, url: str, job_id: str) -> bytes:
        parsed_url = urllib.parse.urlparse(url)

        if parsed_url.scheme != "https":
            raise ValueError("Insecure protocol")

        if parsed_url.netloc not in ("replicate.delivery", "pbxt.replicate.delivery"):
            raise ValueError("Untrusted domain")

        timeout = aiohttp.ClientTimeout(total=60)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get(url) as resp:
                if resp.status != 200:
                    raise ValueError(f"Download failed: {resp.status}")
                return await resp.read()


ai_upscaler = AIUpscaler()