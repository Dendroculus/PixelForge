"""Central AI job lifecycle manager.

``JobManager`` coordinates queue reservation, usage counters, storage cleanup,
JSON failure markers, quota refunds, and feature-specific execution. Route handlers
and dispatch helpers should call this service instead of directly invoking AI
feature services.
"""

import logging

from fastapi import HTTPException, status

from core.config import settings
from limiter.usage_service import UsageService
from services.ai.features.bg_remover import bg_remover
from services.ai.features.color_restorer import color_restorer
from services.ai.features.object_remover import object_remover
from services.ai.features.upscale import ai_upscaler
from services.azure.storage import StorageService
from services.job.queue_service import QueueService

logger = logging.getLogger(__name__)


class JobManager:
    """Service responsible for managing AI processing jobs."""

    @classmethod
    async def check_register_and_reserve(
        cls,
        job_id: str,
        client_ip: str,
        feature: str,
    ) -> None:
        """Reserve a queue slot and usage quota for a job.

        Flow:
            1. Reserve queue capacity.
            2. Check feature usage limit.
            3. Release queue capacity if limit fails.
            4. Increment usage after successful reservation.

        Args:
            job_id:
                Unique job identifier.
            client_ip:
                Client identifier used for usage tracking.
            feature:
                AI feature being processed.

        Raises:
            HTTPException:
                Raised when quota is exceeded or queue reservation fails.
        """
        await QueueService.reserve_slot(job_id)

        limit = settings.FEATURE_LIMITS[feature]

        is_allowed = await UsageService.check_daily_limit(
            client_ip,
            limit_24h=limit,
            feature=feature,
        )

        if not is_allowed:
            await QueueService.release_slot(job_id)

            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="LIMIT_REACHED",
            )

        await UsageService.increment_daily_limit(
            client_ip,
            feature=feature,
        )

    @classmethod
    async def _handle_job_failure(
        cls,
        job_id: str,
        safe_filename: str,
        client_ip: str,
        feature: str,
        code: str = "PROCESSING_FAILED",
        message: str | None = None,
    ) -> None:
        """Mark a job as failed, clean upload leftovers, and refund quota.

        Args:
            job_id:
                Failed job identifier.
            safe_filename:
                Uploaded filename associated with the job.
            client_ip:
                Client identifier used for usage tracking.
            feature:
                Failed feature name.
            code:
                Stable frontend-friendly failure code.
            message:
                Safe user-facing explanation for the failure marker.
        """
        safe_message = (
            message
            or "AI processing failed. Please try again with a smaller image."
        )

        logger.warning(
            "Job %s failed for feature %s with code %s. Cleaning up and refunding usage.",
            job_id,
            feature,
            code,
        )

        await StorageService.mark_job_failed(job_id, code=code, message=safe_message)

        await StorageService.delete_azure_blob(
            settings.UPLOAD_CONTAINER,
            safe_filename,
        )

        await UsageService.decrement_daily_limit(
            client_ip,
            feature=feature,
        )

    @classmethod
    def _normalize_task_result(cls, result) -> tuple[bool, str, str]:
        """Normalize feature task results into success and safe failure reason.

        Args:
            result:
                Value returned by a feature service. Current AI pipeline
                services return a ``PipelineResult`` object, but this method
                also supports legacy booleans and dictionaries.

        Returns:
            tuple[bool, str, str]:
                Success flag, failure code, and failure message. Code/message
                are only meaningful when success is ``False``.
        """
        default_code = "PROCESSING_FAILED"
        default_message = "AI processing failed. Please try again with a smaller image."

        if hasattr(result, "success"):
            return (
                bool(result.success),
                str(getattr(result, "code", None) or default_code),
                str(getattr(result, "message", None) or default_message),
            )

        if isinstance(result, dict):
            return (
                bool(result.get("success")),
                str(result.get("code") or default_code),
                str(result.get("message") or default_message),
            )

        return bool(result), default_code, default_message

    @classmethod
    async def _process_feature(
        cls,
        job_id: str,
        safe_filename: str,
        client_ip: str,
        feature: str,
        task_runner,
    ) -> None:
        """Execute a feature task with shared lifecycle handling.

        Args:
            job_id:
                Current job identifier.
            safe_filename:
                Uploaded file stored name.
            client_ip:
                Client identifier used for usage tracking.
            feature:
                Feature name being executed.
            task_runner:
                Async callable that performs the feature-specific AI work.
        """
        try:
            blob_size = await StorageService.get_blob_size(
                settings.UPLOAD_CONTAINER,
                safe_filename,
            )

            if blob_size > settings.MAX_FILE_SIZE_BYTES:
                logger.warning(
                    "Oversized upload detected: Job %s (%s bytes). Aborting.",
                    job_id,
                    blob_size,
                )

                await cls._handle_job_failure(
                    job_id,
                    safe_filename,
                    client_ip,
                    feature,
                    code="UPLOAD_TOO_LARGE",
                    message=f"The uploaded image exceeds the {settings.MAX_FILE_SIZE_MB}MB limit.",
                )

                return

            task_result = await task_runner()
            success, failure_code, failure_message = cls._normalize_task_result(task_result)

            if success:
                await StorageService.delete_azure_blob(
                    settings.UPLOAD_CONTAINER,
                    safe_filename,
                )
            else:
                await cls._handle_job_failure(
                    job_id,
                    safe_filename,
                    client_ip,
                    feature,
                    code=failure_code,
                    message=failure_message,
                )

        except Exception as e:
            logger.error(
                "%s task critical failure job=%s: %s",
                feature.capitalize(),
                job_id,
                e,
            )

            await cls._handle_job_failure(
                job_id,
                safe_filename,
                client_ip,
                feature,
                code="PROCESSING_FAILED",
                message="AI processing failed. Please try again with a smaller image.",
            )

        finally:
            await QueueService.release_slot(job_id)

    @classmethod
    async def process_upscale(
        cls,
        job_id: str,
        safe_filename: str,
        model_type: str,
        scale: int,
        client_ip: str,
    ) -> None:
        """Execute an image upscaling job."""
        async def _run():
            return await ai_upscaler.run_upscale(
                safe_filename=safe_filename,
                job_id=job_id,
                model_type=model_type,
                scale=scale,
            )

        await cls._process_feature(
            job_id,
            safe_filename,
            client_ip,
            "upscale",
            _run,
        )

    @classmethod
    async def process_rembg(
        cls,
        job_id: str,
        safe_filename: str,
        client_ip: str,
    ) -> None:
        """Execute a background-removal job."""
        async def _run():
            return await bg_remover.run_removal(
                safe_filename=safe_filename,
                job_id=job_id,
            )

        await cls._process_feature(
            job_id,
            safe_filename,
            client_ip,
            "rembg",
            _run,
        )

    @classmethod
    async def process_colorrestore(
        cls,
        job_id: str,
        safe_filename: str,
        client_ip: str,
    ) -> None:
        """Execute a color-restoration job."""
        async def _run():
            return await color_restorer.run_restore(
                safe_filename=safe_filename,
                job_id=job_id,
            )

        await cls._process_feature(
            job_id,
            safe_filename,
            client_ip,
            "colorrestore",
            _run,
        )

    @classmethod
    async def process_object_remove(
        cls,
        job_id: str,
        safe_filename: str,
        mask_filename: str,
        client_ip: str,
    ) -> None:
        """Execute an object-removal job and clean up its mask upload."""
        async def _run():
            return await object_remover.run_object_remove(
                safe_filename=safe_filename,
                mask_filename=mask_filename,
                job_id=job_id,
            )

        await cls._process_feature(
            job_id,
            safe_filename,
            client_ip,
            "objectremove",
            _run,
        )

        await StorageService.delete_azure_blob(
            settings.UPLOAD_CONTAINER,
            mask_filename,
        )
