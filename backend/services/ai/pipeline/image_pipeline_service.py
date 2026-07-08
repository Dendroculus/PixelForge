"""Shared template pipeline for PixelForge AI image services.

``ImagePipelineService`` implements the common lifecycle used by AI tools:

    1. Download uploaded bytes from Azure.
    2. Validate uploaded byte size and image resolution.
    3. Preprocess input through a feature hook.
    4. Execute the remote AI model with concurrency control.
    5. Download the model output.
    6. Postprocess output through a feature hook.
    7. Compress/shrink generated output until it fits the configured result cap.
    8. Save the final result to Azure.

The base implementation is intentionally conservative:

    - Upload byte size is capped by ``settings.MAX_FILE_SIZE_BYTES``.
    - Upload resolution is capped by ``settings.MAX_PIXELS``.
    - Normal AI inputs are downscaled to ``settings.OPTIMIZATION_TARGET_PIXELS``
      before being sent to the remote provider.
    - Generated results are forced under ``settings.MAX_RESULT_FILE_SIZE_BYTES``.

Feature services should override only the hooks they need. Upscaling overrides
input preprocessing because 2x/4x scale factors require scale-aware sizing.
Object removal overrides model execution because it needs both source and mask
streams.
"""

import asyncio
from dataclasses import dataclass
import io
import logging
import time
import urllib.parse

import aiohttp
from fastapi import HTTPException, status
from PIL import Image

from core.config import settings
from core.model_registry import ModelRegistry
from provider.ai_provider import BaseAIProvider, ReplicateProvider
from services.azure.storage import StorageService
from services.azure.storage_utils import get_result_filename
from utils.error import codes
from utils.error.error import (
    ReplicateRateLimitError,
    ReplicateTimeoutError,
    ReplicateUnknownError,
)
from utils.error.responses import get_default_message
from utils.image.image_utils import (
    fit_image_bytes_under_size,
    smart_downscale,
    validate_image_bytes_resolution,
)

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class PipelineResult:
    """User-safe result returned by a feature pipeline run.

    ``JobManager`` uses this object to decide whether a job succeeded and, when
    it failed, which safe code/message should be written to the public failure
    marker. Messages must be safe for frontend display and must not include
    secrets, stack traces, provider internals, or raw exception details.

    Attributes:
        success:
            Whether the pipeline completed and saved a result.
        code:
            Stable frontend-friendly failure code, or ``None`` on success.
        message:
            Safe user-facing explanation, or ``None`` on success.
    """

    success: bool
    code: str | None = None
    message: str | None = None

    def __bool__(self) -> bool:
        """Allow legacy truthiness checks to treat success as truthy."""
        return self.success

    @classmethod
    def ok(cls) -> "PipelineResult":
        """Return a successful pipeline result."""
        return cls(success=True)

    @classmethod
    def failed(cls, code: str, message: str) -> "PipelineResult":
        """Return a failed pipeline result with a safe public reason."""
        return cls(success=False, code=code, message=message)


class ImagePipelineService:
    """Template-method service for shared image AI pipelines."""

    def __init__(
        self,
        model_type: str,
        provider: BaseAIProvider = None,
        max_concurrent_remote_jobs: int = settings.MAX_CONCURRENT_JOBS,
        max_file_size_bytes: int = settings.MAX_FILE_SIZE_BYTES,
        max_result_file_size_bytes: int = settings.MAX_RESULT_FILE_SIZE_BYTES,
    ):
        """Initialize the shared image pipeline.

        Args:
            model_type:
                Internal model key registered in ``ModelRegistry``.
            provider:
                Optional AI provider implementation. Defaults to Replicate.
            max_concurrent_remote_jobs:
                Maximum concurrent remote model calls for this service instance.
            max_file_size_bytes:
                Maximum uploaded input payload size in bytes.
            max_result_file_size_bytes:
                Maximum generated output payload size in bytes after final
                compression/shrinking.
        """
        self.model_type = model_type
        self.provider = provider or ReplicateProvider()
        self._remote_semaphore = asyncio.Semaphore(max_concurrent_remote_jobs)
        self.max_file_size_bytes = max_file_size_bytes
        self.max_result_file_size_bytes = max_result_file_size_bytes

    async def run(self, safe_filename: str, job_id: str, **kwargs) -> PipelineResult:
        """Execute the full image processing pipeline.

        Args:
            safe_filename:
                Sanitized uploaded image filename in Azure.
            job_id:
                Current job identifier.
            **kwargs:
                Feature-specific values forwarded to preprocessing, model
                execution, and postprocessing hooks.

        Returns:
            PipelineResult:
                Successful result when the processed image is saved, otherwise
                a failed result containing a user-safe code and message for the
                frontend failure modal.
        """
        started_at = time.perf_counter()

        try:
            t0 = time.perf_counter()
            raw_bytes = await StorageService.get_upload_bytes(safe_filename)
            t1 = time.perf_counter()

            self.validate_input_size(raw_bytes)
            self.validate_input_resolution(raw_bytes)

            p0 = time.perf_counter()
            prepared_stream = await self.preprocess_input(
                raw_bytes,
                job_id=job_id,
                **kwargs,
            )
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
            postprocessed_result = await self.postprocess_output(
                raw_result,
                job_id=job_id,
                **kwargs,
            )
            final_result = await self.enforce_output_size(postprocessed_result)
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
                "remote_wait=%.3fs result_size=%.2fMB",
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
                len(final_result) / 1024 / 1024,
            )
            return PipelineResult.ok()

        except Exception as e:
            failure = self._failure_from_exception(e)
            logger.error(
                "%s error (Job #%s): %s",
                self.model_type,
                job_id,
                e,
                exc_info=True,
            )
            return failure

    def _failure_from_exception(self, exc: Exception) -> PipelineResult:
        """Convert an exception into a safe pipeline failure result.

        Request-time exceptions are normalized by global FastAPI handlers. This
        method performs the equivalent conversion for background AI jobs so
        ``JobManager`` can persist a safe failure marker for result polling.

        Args:
            exc:
                Exception raised during pipeline execution.

        Returns:
            PipelineResult:
                Failed result with a stable code and safe user-facing message.
        """
        if isinstance(exc, ReplicateRateLimitError):
            return PipelineResult.failed(
                codes.PROVIDER_RATE_LIMITED,
                get_default_message(codes.PROVIDER_RATE_LIMITED),
            )

        if isinstance(exc, ReplicateTimeoutError):
            return PipelineResult.failed(
                codes.PROVIDER_TIMEOUT,
                get_default_message(codes.PROVIDER_TIMEOUT),
            )

        if isinstance(exc, ReplicateUnknownError):
            return PipelineResult.failed(
                codes.PROVIDER_FAILED,
                get_default_message(codes.PROVIDER_FAILED),
            )

        if isinstance(exc, HTTPException):
            detail = exc.detail

            if isinstance(detail, dict):
                code = str(detail.get("code") or codes.VALIDATION_ERROR)
                message = str(detail.get("message") or get_default_message(code))
                return PipelineResult.failed(code, message)

            detail_text = str(detail or "")
            detail_lower = detail_text.lower()

            if exc.status_code == status.HTTP_413_REQUEST_ENTITY_TOO_LARGE:
                return PipelineResult.failed(
                    codes.IMAGE_TOO_LARGE,
                    detail_text or get_default_message(codes.IMAGE_TOO_LARGE),
                )

            if exc.status_code == status.HTTP_415_UNSUPPORTED_MEDIA_TYPE:
                return PipelineResult.failed(
                    codes.UNSUPPORTED_FORMAT,
                    detail_text or get_default_message(codes.UNSUPPORTED_FORMAT),
                )

            if exc.status_code in {
                status.HTTP_400_BAD_REQUEST,
                status.HTTP_422_UNPROCESSABLE_ENTITY,
            }:
                if "unsupported format" in detail_lower:
                    return PipelineResult.failed(
                        codes.UNSUPPORTED_FORMAT,
                        detail_text or get_default_message(codes.UNSUPPORTED_FORMAT),
                    )

                return PipelineResult.failed(
                    codes.INVALID_IMAGE,
                    detail_text or get_default_message(codes.INVALID_IMAGE),
                )

        error_text = str(exc).lower()

        if "payload exceeds maximum size" in error_text:
            return PipelineResult.failed(
                codes.UPLOAD_TOO_LARGE,
                f"The uploaded image exceeds the {settings.MAX_FILE_SIZE_MB}MB limit.",
            )

        if "already contains color" in error_text:
            return PipelineResult.failed(
                codes.INVALID_COLOR_INPUT,
                get_default_message(codes.INVALID_COLOR_INPUT),
            )

        if (
            "output exceeds maximum size" in error_text
            or ("generated image" in error_text and "too large" in error_text)
            or "cannot fit" in error_text
            or ("too large" in error_text and "output" in error_text)
        ):
            return PipelineResult.failed(
                codes.OUTPUT_TOO_LARGE,
                get_default_message(codes.OUTPUT_TOO_LARGE),
            )

        return PipelineResult.failed(
            codes.PROCESSING_FAILED,
            get_default_message(codes.PROCESSING_FAILED),
        )

    def validate_input_size(self, raw_bytes: bytes) -> None:
        """Reject uploaded payloads larger than the configured upload limit.

        Args:
            raw_bytes:
                Raw uploaded bytes downloaded from Azure.

        Raises:
            ValueError:
                Raised when the upload exceeds ``max_file_size_bytes``.
        """
        if len(raw_bytes) > self.max_file_size_bytes:
            raise ValueError("Payload exceeds maximum size.")

    def validate_input_resolution(self, raw_bytes: bytes) -> None:
        """Reject uploaded images that exceed the configured resolution limit.

        Args:
            raw_bytes:
                Raw uploaded image bytes.

        Raises:
            fastapi.HTTPException:
                Raised by ``validate_image_bytes_resolution`` when the image is
                invalid, unsupported, or above ``settings.MAX_PIXELS``.
        """
        width, height, pixels = validate_image_bytes_resolution(raw_bytes)

        logger.info(
            "%s input resolution accepted: %sx%s (%s px).",
            self.model_type,
            width,
            height,
            f"{pixels:,}",
        )

    def validate_output_size(self, result_bytes: bytes) -> None:
        """Reject generated outputs larger than the configured result limit.

        This is a final guard after ``enforce_output_size``. In normal cases the
        result should already fit before this method runs.

        Args:
            result_bytes:
                Final generated result bytes.

        Raises:
            ValueError:
                Raised when the final result still exceeds
                ``max_result_file_size_bytes``.
        """
        if len(result_bytes) > self.max_result_file_size_bytes:
            raise ValueError("Output exceeds maximum size.")

    async def enforce_output_size(self, result_bytes: bytes) -> bytes:
        """Compress and shrink generated output until it fits the result cap.

        Args:
            result_bytes:
                Postprocessed AI output bytes.

        Returns:
            bytes:
                Output bytes that fit inside ``max_result_file_size_bytes``.

        Raises:
            ValueError:
                Raised by the image utility if the image cannot fit even after
                shrinking down to ``settings.MIN_OUTPUT_DIMENSION``.
        """
        if len(result_bytes) <= self.max_result_file_size_bytes:
            return result_bytes

        logger.warning(
            "%s result exceeds cap before final save: %.2fMB > %.2fMB. Downgrading.",
            self.model_type,
            len(result_bytes) / 1024 / 1024,
            self.max_result_file_size_bytes / 1024 / 1024,
        )

        return await asyncio.to_thread(
            fit_image_bytes_under_size,
            result_bytes,
            self.max_result_file_size_bytes,
            min_dimension=settings.MIN_OUTPUT_DIMENSION,
            shrink_step=settings.OUTPUT_SHRINK_STEP,
        )

    async def preprocess_input(self, raw_bytes: bytes, **kwargs) -> io.BytesIO:
        """Prepare uploaded image bytes for provider input.

        The shared default behavior validates image structure and downscales
        large images to ``settings.OPTIMIZATION_TARGET_PIXELS`` before sending
        them to the AI provider. Feature services may override this when they
        need special behavior, such as scale-aware upscaling.

        Args:
            raw_bytes:
                Raw uploaded image bytes.
            **kwargs:
                Feature-specific arguments. The base implementation ignores
                them, but subclasses may use them.

        Returns:
            io.BytesIO:
                Prepared image stream positioned at byte 0.
        """
        return await asyncio.to_thread(self._preprocess_input_sync, raw_bytes)

    def _preprocess_input_sync(self, raw_bytes: bytes) -> io.BytesIO:
        """Synchronously normalize and downscale input image bytes.

        Args:
            raw_bytes:
                Raw uploaded image bytes.

        Returns:
            io.BytesIO:
                Encoded image stream suitable for the remote AI provider.
        """
        with io.BytesIO(raw_bytes) as input_stream:
            with Image.open(input_stream) as img:
                img.load()
                save_format = img.format or "JPEG"

                img = smart_downscale(img, settings.OPTIMIZATION_TARGET_PIXELS)

                if img.mode in ("RGBA", "P") and save_format.upper() != "PNG":
                    img = img.convert("RGB")

                output_stream = io.BytesIO()
                save_kwargs = {"format": save_format}

                if save_format.upper() in ("JPEG", "JPG"):
                    save_kwargs.update({"quality": 95, "optimize": True})

                if save_format.upper() == "PNG":
                    save_kwargs.update({"optimize": True, "compress_level": 9})

                img.save(output_stream, **save_kwargs)
                output_stream.seek(0)

                return output_stream

    async def postprocess_output(self, result_bytes: bytes, **kwargs) -> bytes:
        """Prepare provider output bytes for result storage.

        Args:
            result_bytes:
                Raw output bytes downloaded from the remote AI provider.
            **kwargs:
                Feature-specific arguments. The base implementation ignores
                them, but subclasses may use them.

        Returns:
            bytes:
                Output bytes to pass into final size enforcement.
        """
        return result_bytes

    def build_model_params(self, **kwargs) -> dict:
        """Build provider parameters for the configured model type.

        Args:
            **kwargs:
                Feature-specific parameters used by subclasses.

        Returns:
            dict:
                Provider-specific model input parameters.
        """
        return ModelRegistry.get_params(self.model_type)

    async def _process_with_ai(self, image_stream: io.BytesIO, **kwargs) -> str:
        """Run the configured AI model through the provider.

        Args:
            image_stream:
                Prepared image stream.
            **kwargs:
                Feature-specific values forwarded to ``build_model_params``.

        Returns:
            str:
                HTTPS output URL returned by the AI provider.
        """
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
