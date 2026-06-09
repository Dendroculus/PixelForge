import asyncio
import aiohttp
import io
import logging
import urllib.parse
import time
from services.features.storage import StorageService
from core.config import MAX_FILE_SIZE_BYTES, MAX_CONCURENT_JOBS
from utils.storage_utils import get_result_filename
from core.model_registry import ModelRegistry
from services.adapter.ai_provider import BaseAIProvider, ReplicateProvider

logger = logging.getLogger(__name__)


class ImagePipelineService:
    """
    Template-method service for image AI pipelines with safe defaults and extension hooks.
    """

    def __init__(
        self,
        model_type: str,
        provider: BaseAIProvider = None,
        max_concurrent_remote_jobs: int = MAX_CONCURENT_JOBS,
        max_file_size_bytes: int = MAX_FILE_SIZE_BYTES,
    ):
        self.model_type = model_type
        self.provider = provider or ReplicateProvider()
        self._remote_semaphore = asyncio.Semaphore(max_concurrent_remote_jobs)
        self.max_file_size_bytes = max_file_size_bytes

    async def run(self, safe_filename: str, job_id: str, **kwargs) -> bool:
        started_at = time.perf_counter()
        try:
            t0 = time.perf_counter()
            raw_bytes = await StorageService.get_upload_bytes(safe_filename)
            t1 = time.perf_counter()

            self.validate_input_size(raw_bytes)

            p0 = time.perf_counter()
            prepared_stream = await self.preprocess_input(raw_bytes, job_id=job_id, **kwargs)
            p1 = time.perf_counter()

            q0 = time.perf_counter()
            async with self._remote_semaphore:
                remote_wait = time.perf_counter() - q0
                r0 = time.perf_counter()
                output_url = await self._process_with_ai(prepared_stream, job_id=job_id, **kwargs)
                r1 = time.perf_counter()

            d0 = time.perf_counter()
            raw_result = await self.download_result(output_url)
            d1 = time.perf_counter()

            o0 = time.perf_counter()
            final_result = await self.postprocess_output(raw_result, job_id=job_id, **kwargs)
            o1 = time.perf_counter()

            self.validate_output_size(final_result)

            s0 = time.perf_counter()
            result_filename = get_result_filename(job_id)
            await StorageService.save_result(final_result, result_filename)
            s1 = time.perf_counter()

            total = time.perf_counter() - started_at
            logger.info(
                "%s done job=%s total=%.3fs read=%.3fs preprocess=%.3fs remote=%.3fs download=%.3fs postprocess=%.3fs save=%.3fs remote_wait=%.3fs",
                self.model_type, job_id, total, (t1 - t0), (p1 - p0), (r1 - r0), (d1 - d0), (o1 - o0), (s1 - s0), remote_wait
            )
            return True

        except Exception as e:
            logger.error("%s error (Job #%s): %s", self.model_type, job_id, e)
            return False

    def validate_input_size(self, raw_bytes: bytes) -> None:
        if len(raw_bytes) > self.max_file_size_bytes:
            raise ValueError("Payload exceeds maximum size.")

    def validate_output_size(self, result_bytes: bytes) -> None:
        if len(result_bytes) > self.max_file_size_bytes:
            raise ValueError("Output exceeds maximum size.")

    # NOTE: Hook remains async by design.
    # `run()` awaits preprocess_input/postprocess_output for a uniform pipeline contract.
    # Base implementation may be sync-like (no internal await), but subclasses can perform real async I/O.
    async def preprocess_input(self, raw_bytes: bytes, **kwargs) -> io.BytesIO:
        stream = io.BytesIO(raw_bytes)
        stream.seek(0)
        return stream

    async def postprocess_output(self, result_bytes: bytes, **kwargs) -> bytes:
        return result_bytes

    def build_model_params(self, **kwargs) -> dict:
        return ModelRegistry.get_params(self.model_type)

    async def _process_with_ai(self, image_stream: io.BytesIO, **kwargs) -> str:
        model_id = ModelRegistry.get_replicate_id(self.model_type)
        params = self.build_model_params(**kwargs)
        input_key = ModelRegistry.get_input_key(self.model_type)
        params[input_key] = image_stream

        try:
            return await self.provider.run_model(model_id, params=params)
        finally:
            image_stream.close()

    async def download_result(self, url: str) -> bytes:
        parsed = urllib.parse.urlparse(url)
        if parsed.scheme != "https":
            raise ValueError("Untrusted output source.")

        timeout = aiohttp.ClientTimeout(total=60)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get(url) as resp:
                if resp.status != 200:
                    raise ValueError(f"Failed to download result: {resp.status}")
                return await resp.read()