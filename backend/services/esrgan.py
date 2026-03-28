import asyncio
import aiohttp
import io
import logging
import replicate
from PIL import Image
from services.storage import StorageService

logger = logging.getLogger(__name__)

class AIUpscaler:
    """
    Runs the full in-memory AI upscaling pipeline using Replicate.

    Downloads input, optimizes resolution, performs inference, and stores
    the final result without using local disk.
    """

    def __init__(self):
        logger.info("🚀 Web AI Engine Initialized (Memory-Stream Mode)")

    async def run_upscale(self, safe_filename: str, job_id: str) -> bool:
        """
        Executes the complete upscaling workflow for a given job.

        Returns True on success, False on failure.
        """
        try:
            logger.info(f"📥 Job #{job_id} - Downloading raw image from Azure...")
            raw_bytes = await StorageService.get_upload_bytes(safe_filename)

            optimized_stream = await asyncio.to_thread(self._optimize_image_sync, raw_bytes, job_id)

            output_url = await self._process_with_ai(optimized_stream, job_id)

            result_bytes = await self._download_ai_result(output_url, job_id)

            result_filename = f"{job_id}.png"
            logger.info(f"☁️ Job #{job_id} - Uploading final result to Azure...")
            await StorageService.save_result(result_bytes, result_filename)
            
            logger.info(f"✅ Job #{job_id} Success! Cloud pipeline complete.")
            return True

        except Exception as e:
            logger.error(f"❌ Critical Error in AI Engine (Job #{job_id}): {e}")
            return False

    def _optimize_image_sync(self, raw_bytes: bytes, job_id: str) -> io.BytesIO:
        """
        Resizes and normalizes the image in memory before AI processing.
        """
        img_stream = io.BytesIO(raw_bytes)
        
        with Image.open(img_stream) as img:
            width, height = img.size
            total_pixels = width * height
            
            output_stream = io.BytesIO()
            
            if total_pixels > 1_000_000:
                logger.info(f"📐 Job #{job_id} - High resolution ({width}x{height}). Optimizing to 1MP...")
                ratio = (1_000_000 / total_pixels) ** 0.5
                new_width = int(width * ratio)
                new_height = int(height * ratio)
                
                resized_img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
                if resized_img.mode in ("RGBA", "P"):
                    resized_img = resized_img.convert("RGB")
                
                resized_img.save(output_stream, format="JPEG", quality=95)
            else:
                logger.info(f"📐 Job #{job_id} - Standard resolution. Preparing stream.")
                if img.mode in ("RGBA", "P"):
                    img = img.convert("RGB")
                img.save(output_stream, format="JPEG", quality=95)
            
            output_stream.seek(0)
            return output_stream

    async def _process_with_ai(self, image_stream: io.BytesIO, job_id: str) -> str:
        """
        Sends the image stream to the Replicate model and returns the output URL.
        """
        logger.info(f" ⚒️ Job #{job_id} - Processing on Replicate GPUs (Scale: 4x)...")
        model_str = "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b"
        
        def call_replicate():
            return replicate.run(
                model_str,
                input={"image": image_stream, "scale": 4, "face_enhance": False}
            )

        output = await asyncio.to_thread(call_replicate)
        
        return str(output[0]) if isinstance(output, list) else str(output)

    async def _download_ai_result(self, url: str, job_id: str) -> bytes:
        """
        Downloads the processed image from the returned URL.
        """
        logger.info(f"☁️ Job #{job_id} - Downloading result from Replicate...")
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as resp:
                if resp.status != 200:
                    raise ValueError(f"Failed to download result: Status {resp.status}")
                return await resp.read()

ai_upscaler = AIUpscaler()