import asyncio
import aiohttp
import io
import logging
import urllib.parse
import time
from PIL import Image
from services.storage import StorageService
from core.config import DEFAULT_SCALE, MAX_FILE_SIZE_BYTES, OPTIMIZATION_TARGET_PIXELS
from core.model_registry import ModelRegistry
from helper.utils import get_result_filename
from helper.replicate_wrapper import smart_replicate_run

logger = logging.getLogger(__name__)


class AIUpscaler:
    """
    Handles full AI image upscaling pipeline using Replicate.
    """

    def __init__(
        self,
        max_concurrent_replicate_jobs: int = 5,
        max_concurrent_cpu_jobs: int = 4,
    ):
        self._replicate_semaphore = asyncio.Semaphore(max_concurrent_replicate_jobs)
        self._cpu_semaphore = asyncio.Semaphore(max_concurrent_cpu_jobs)
        self.MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_BYTES

    async def run_upscale(self, safe_filename: str, job_id: str, model_type: str, scale: int = 4) -> bool:
        """
        Executes full upscaling workflow for a single job.
        
        Args:
            safe_filename (str): Source file identifier.
            job_id (str): Unique job identifier.
            model_type (str): Selected AI model type.
            scale (int): Upscaling multiplier.
            
        Returns:
            bool: Success status.
        """
        started_at = time.perf_counter()
        try:
            t0 = time.perf_counter()
            raw_bytes = await StorageService.get_upload_bytes(safe_filename)
            t1 = time.perf_counter()

            if len(raw_bytes) > self.MAX_FILE_SIZE_BYTES:
                raise ValueError("Payload exceeds maximum allowed size.")

            cpu_q0 = time.perf_counter()
            async with self._cpu_semaphore:
                cpu_wait_opt = time.perf_counter() - cpu_q0
                o0 = time.perf_counter()
                optimized_stream = await asyncio.to_thread(self._optimize_image_sync, raw_bytes, job_id)
                o1 = time.perf_counter()

            rep_q0 = time.perf_counter()
            async with self._replicate_semaphore:
                rep_wait = time.perf_counter() - rep_q0
                r0 = time.perf_counter()
                output_url = await self._process_with_ai(optimized_stream, job_id, model_type, scale)
                r1 = time.perf_counter()

            d0 = time.perf_counter()
            raw_result_bytes = await self._download_ai_result(output_url, job_id)
            d1 = time.perf_counter()

            cpu_q1 = time.perf_counter()
            async with self._cpu_semaphore:
                cpu_wait_cmp = time.perf_counter() - cpu_q1
                c0 = time.perf_counter()
                compressed_bytes = await asyncio.to_thread(self._compress_output_sync, raw_result_bytes)
                c1 = time.perf_counter()

            if len(compressed_bytes) > self.MAX_FILE_SIZE_BYTES:
                raise ValueError("Compressed output still exceeds maximum allowed size.")

            s0 = time.perf_counter()
            result_filename = get_result_filename(job_id)
            await StorageService.save_result(compressed_bytes, result_filename)
            s1 = time.perf_counter()

            total = time.perf_counter() - started_at
            logger.info(
                "Upscale done job=%s total=%.3fs read=%.3fs optimize=%.3fs replicate=%.3fs download=%.3fs compress=%.3fs save=%.3fs "
                "queue_waits(cpu_opt=%.3fs, rep=%.3fs, cpu_cmp=%.3fs)",
                job_id, total, (t1 - t0), (o1 - o0), (r1 - r0), (d1 - d0), (c1 - c0), (s1 - s0),
                cpu_wait_opt, rep_wait, cpu_wait_cmp,
            )

            return True

        except Exception as e:
            logger.error(f"AI Engine Error (Job #{job_id}): {e}")
            return False

    def _optimize_image_sync(self, raw_bytes: bytes, job_id: str) -> io.BytesIO:
        """
        Optimizes an image via CPU-bound PIL transformations.
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
                    save_kwargs.update({"quality": 95, "optimize": True})

                img.save(output_stream, **save_kwargs)
                output_stream.seek(0)
                return output_stream

    def _compress_output_sync(self, raw_bytes: bytes) -> bytes:
        """
        Compresses image output via CPU-bound PIL transformations.
        """
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
        """
        Processes the image stream through Replicate.
        """
        try:
            model_str = ModelRegistry.get_replicate_id(model_type)
            params = ModelRegistry.get_params(model_type, scale=scale)
        except ValueError:
            model_str = ModelRegistry.get_replicate_id("general")
            params = ModelRegistry.get_params("general", scale=DEFAULT_SCALE)

        params["image"] = image_stream

        try:
            output = await smart_replicate_run(model_str, params=params)
            return str(output[0]) if isinstance(output, list) else str(output)
        finally:
            image_stream.close()

    async def _download_ai_result(self, url: str, job_id: str) -> bytes:
        """
        Downloads the processed image result.
        """
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