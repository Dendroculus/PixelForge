"""Shared template pipeline for PixelForge AI image services.

``ImagePipelineService`` implements the common lifecycle used by AI tools:

    1. Download uploaded bytes from Azure.
    2. Validate input size.
    3. Preprocess input through a feature hook.
    4. Execute the remote AI model with concurrency control.
    5. Download the model output.
    6. Postprocess output through a feature hook.
    7. Validate output size.
    8. Save the final result to Azure.

Feature services override only the hooks they need, keeping storage/provider
concerns centralized and consistent.
"""

import asyncio
import io
import logging
import time
import urllib.parse

import aiohttp

from core.config import settings
from core.model_registry import ModelRegistry
from provider.ai_provider import BaseAIProvider, ReplicateProvider
from services.azure.storage import StorageService
from services.azure.storage_utils import get_result_filename

logger = logging.getLogger(__name__)


class ImagePipelineService:
    """Template-method service for image AI pipelines."""

    def __init__(
        self,
        model_type: str,
        provider: BaseAIProvider = None,
        max_concurrent_remote_jobs: int = settings.MAX_CONCURRENT_JOBS,
        max_file_size_bytes: int = settings.MAX_FILE_SIZE_BYTES,
    ):
        """Initialize the shared image pipeline.

        Args:
            model_type:
                Internal model key registered in ``ModelRegistry``.
            provider:
                Optional AI provider implementation. Defaults to Replicate.
            max_concurrent_remote_jobs:
                Maximum concurrent remote model calls for this service.
            max_file_size_bytes:
                Maximum input/output payload size.
        """
        self.model_type = model_type
        self.provider = provider or ReplicateProvider()
        self._remote_semaphore = asyncio.Semaphore(max_concurrent_remote_jobs)
        self.max_file_size_bytes = max_file_size_bytes

    async def run(self, safe_filename: str, job_id: str, **kwargs) -> bool:
        """Execute the full image processing pipeline.

        Args:
            safe_filename:
                Sanitized uploaded image filename in Azure.
            job_id:
                Current job identifier.
            **kwargs:
                Feature-specific values forwarded to pipeline hooks.

        Returns:
            bool:
                ``True`` if the result was saved successfully, otherwise
                ``False``.
        """
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
                output_url = await self._process_with_ai(
                    prepared_stream,
                    job_id=job_id,
                    **kwargs,
                )
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
                "%s done job=%s total=%.3fs read=%.3fs preprocess=%.3fs "
                "remote=%.3fs download=%.3fs postprocess=%.3fs save=%.3fs "
                "remote_wait=%.3fs",
                self.model_type,
                job_id,
                total,
                (t1 - t0),
                (p1 - p0),
                (r1 - r0),
                (d1 - d0),
                (o1 - o0),
                (s1 - s0),
                remote_wait,
            )
            return True

        except Exception as e:
            logger.error("%s error (Job #%s): %s", self.model_type, job_id, e)
            return False

    def validate_input_size(self, raw_bytes: bytes) -> None:
        """Reject input payloads larger than the configured limit."""
        if len(raw_bytes) > self.max_file_size_bytes:
            raise ValueError("Payload exceeds maximum size.")

    def validate_output_size(self, result_bytes: bytes) -> None:
        """Reject output payloads larger than the configured limit."""
        if len(result_bytes) > self.max_file_size_bytes:
            raise ValueError("Output exceeds maximum size.")

    async def preprocess_input(self, raw_bytes: bytes, **kwargs) -> io.BytesIO:
        """Prepare raw uploaded bytes for provider input.

        Subclasses may override this for validation, resizing, conversion, or
        additional file loading.
        """
        stream = io.BytesIO(raw_bytes)
        stream.seek(0)
        return stream

    async def postprocess_output(self, result_bytes: bytes, **kwargs) -> bytes:
        """Prepare provider output bytes for result storage.

        Subclasses may override this for compression, format conversion, or
        output dimension limits.
        """
        return result_bytes

    def build_model_params(self, **kwargs) -> dict:
        """Build provider parameters for the configured model type."""
        return ModelRegistry.get_params(self.model_type)

    async def _process_with_ai(self, image_stream: io.BytesIO, **kwargs) -> str:
        """Run the configured AI model through the provider."""
        model_id = ModelRegistry.get_replicate_id(self.model_type)
        params = self.build_model_params(**kwargs)
        input_key = ModelRegistry.get_input_key(self.model_type)
        params[input_key] = image_stream

        try:
            return await self.provider.run_model(model_id, params=params)
        finally:
            image_stream.close()

    async def download_result(self, url: str) -> bytes:
        """Download the remote model output from a trusted HTTPS URL.

        Args:
            url:
                HTTPS URL returned by the AI provider.

        Raises:
            ValueError:
                Raised when the URL is not HTTPS or the download fails.

        Returns:
            bytes:
                Downloaded result bytes.
        """
        parsed = urllib.parse.urlparse(url)
        if parsed.scheme != "https":
            raise ValueError("Untrusted output source.")

        timeout = aiohttp.ClientTimeout(total=60)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get(url) as resp:
                if resp.status != 200:
                    raise ValueError(f"Failed to download result: {resp.status}")
                return await resp.read()
