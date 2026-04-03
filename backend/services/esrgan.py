# services/esrgan.py
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
    Executes an end-to-end AI image upscaling pipeline using Replicate.
    """

    def __init__(self, max_concurrent_jobs: int = 5):
        logger.info("🚀 Web AI Engine Initialized (Memory-Stream Mode)")
        self._semaphore = asyncio.Semaphore(max_concurrent_jobs)
        self.MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_BYTES

    async def run_upscale(self, safe_filename: str, job_id: str, model_type: str) -> bool:
        """
        Runs the full upscaling workflow for a single job.
        """
        try:
            async with self._semaphore:
                logger.info(f"📥 Job #{job_id} - Downloading raw image from Azure...")
                raw_bytes = await StorageService.get_upload_bytes(safe_filename)

                if len(raw_bytes) > self.MAX_FILE_SIZE_BYTES:
                    raise ValueError("Payload exceeds maximum allowed size.")

                optimized_stream = await asyncio.to_thread(self._optimize_image_sync, raw_bytes, job_id)
                output_url = await self._process_with_ai(optimized_stream, job_id, model_type)
                result_bytes = await self._download_ai_result(output_url, job_id)

                result_filename = get_result_filename(job_id)
                logger.info(f"☁️ Job #{job_id} - Uploading final result to Azure...")
                await StorageService.save_result(result_bytes, result_filename)

                logger.info(f"Job #{job_id} Success! Cloud pipeline complete.")
                return True

        except Exception as e:
            logger.error(f"❌ Critical Error in AI Engine (Job #{job_id}): {e}")
            return False

    def _optimize_image_sync(self, raw_bytes: bytes, job_id: str) -> io.BytesIO:
        """
        Validates and prepares the image for AI processing, preserving format and transparency.
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
                    logger.info(f"📐 Job #{job_id} - Optimizing to target resolution...")
                    ratio = (OPTIMIZATION_TARGET_PIXELS / total_pixels) ** 0.5
                    new_width = int(width * ratio)
                    new_height = int(height * ratio)

                    resized_img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
                    
                    if resized_img.mode in ("RGBA", "P") and save_format != "PNG":
                        resized_img = resized_img.convert("RGB")

                    resized_img.save(output_stream, format=save_format, quality=95)
                else:
                    logger.info(f"📐 Job #{job_id} - Standard resolution. Preparing stream.")
                    
                    if img.mode in ("RGBA", "P") and save_format != "PNG":
                        img = img.convert("RGB")
                        
                    img.save(output_stream, format=save_format, quality=95)

                output_stream.seek(0)
                return output_stream

    async def _process_with_ai(self, image_stream: io.BytesIO, job_id: str, model_type: str) -> str:
        """
        Executes AI upscaling using a model resolved from ModelRegistry.
        """
        logger.info(f" ⚒️ Job #{job_id} - Processing on Replicate GPUs using [{model_type}]...")

        try:
            model_str = ModelRegistry.get_replicate_id(model_type)
            params = ModelRegistry.get_params(model_type)
        except ValueError:
            logger.warning(f"⚠️ Job #{job_id} - Unknown model type '{model_type}'. Defaulting to general.")
            model_str = ModelRegistry.get_replicate_id("general")
            params = ModelRegistry.get_params("general")

        params["image"] = image_stream

        def call_replicate():
            try:
                return replicate.run(model_str, input=params)
            finally:
                image_stream.close()

        output = await asyncio.wait_for(asyncio.to_thread(call_replicate), timeout=300)
        return str(output[0]) if isinstance(output, list) else str(output)

    async def _download_ai_result(self, url: str, job_id: str) -> bytes:
        """
        Retrieves the processed image from a secure external source.
        """
        parsed_url = urllib.parse.urlparse(url)
        if parsed_url.scheme != "https":
            raise ValueError("Insecure protocol: HTTPS required for output retrieval.")
            
        if parsed_url.netloc not in ("replicate.delivery", "pbxt.replicate.delivery"):
            raise ValueError("Untrusted output URL domain.")

        logger.info(f"☁️ Job #{job_id} - Downloading result from Replicate...")

        timeout = aiohttp.ClientTimeout(total=60)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get(url) as resp:
                if resp.status != 200:
                    raise ValueError(f"Failed to download result: Status {resp.status}")
                return await resp.read()

ai_upscaler = AIUpscaler()