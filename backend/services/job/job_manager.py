import logging
from fastapi import HTTPException, status

from limiter.usage_service import UsageService
from services.job.queue_service import QueueService
from services.azure.storage import StorageService
from services.ai.features.upscale import ai_upscaler
from services.ai.features.bg_remover import bg_remover
from services.ai.features.color_restorer import color_restorer

from core.config import settings

logger = logging.getLogger(__name__)


class JobManager:
    """
    Central service responsible for managing AI processing jobs.

    Responsibilities:
    - Validate Turnstile verification before job creation.
    - Check and enforce daily usage limits.
    - Generate safe filenames and upload URLs.
    - Reserve and release queue slots.
    - Handle AI feature execution lifecycle.
    - Cleanup failed jobs and refund usage limits when needed.

    Supported features:
    - upscale
    - rembg (background removal)
    - colorrestore
    """

    @classmethod
    async def check_register_and_reserve(
        cls,
        job_id: str,
        client_ip: str,
        feature: str
    ) -> None:
        """
        Register a job into the queue and reserve processing capacity.

        Flow:
        1. Reserve queue slot.
        2. Validate feature usage limit.
        3. Refund queue slot if limit validation fails.
        4. Increment daily usage counter.

        Args:
            job_id:
                Unique identifier for the job.

            client_ip:
                Client IP address.

            feature:
                AI feature being processed.

        Raises:
            HTTPException:
                When daily usage limit is exceeded.
        """
        await QueueService.reserve_slot(job_id)

        limit = settings.FEATURE_LIMITS.get(
            feature,
            settings.UPSCALE_DAILY_USAGE_LIMIT
        )

        is_allowed = await UsageService.check_daily_limit(
            client_ip,
            limit_24h=limit,
            feature=feature
        )

        if not is_allowed:
            await QueueService.release_slot(job_id)

            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="LIMIT_REACHED"
            )

        await UsageService.increment_daily_limit(
            client_ip,
            feature=feature
        )

    @classmethod
    async def _handle_job_failure(
        cls,
        job_id: str,
        safe_filename: str,
        client_ip: str,
        feature: str
    ) -> None:
        """
        Handle failed jobs.

        Actions:
        - Mark job as failed in storage.
        - Refund user usage quota.

        Args:
            job_id:
                Failed job identifier.

            safe_filename:
                Stored uploaded filename.

            client_ip:
                Client identifier for usage tracking.

            feature:
                Failed AI feature.
        """
        logger.warning(
            "Job %s failed for feature %s. Initializing cleanup and client limit refund.",
            job_id,
            feature
        )

        await StorageService.mark_job_failed(job_id)

        await UsageService.decrement_daily_limit(
            client_ip,
            feature=feature
        )

    @classmethod
    async def _process_feature(
        cls,
        job_id: str,
        safe_filename: str,
        client_ip: str,
        feature: str,
        task_runner
    ) -> None:
        """
        Execute an AI processing task with shared lifecycle handling.

        Handles:
        - File size validation.
        - AI task execution.
        - Uploaded file cleanup.
        - Failure handling.
        - Queue slot release.

        Args:
            job_id:
                Current job identifier.

            safe_filename:
                Uploaded file stored name.

            client_ip:
                Client identifier for usage tracking.

            feature:
                AI feature name.

            task_runner:
                Async callable that performs the AI operation.
        """
        try:
            blob_size = await StorageService.get_blob_size(
                settings.UPLOAD_CONTAINER,
                safe_filename
            )

            if blob_size > settings.MAX_FILE_SIZE_BYTES:
                logger.warning(
                    "Oversized upload detected: Job %s (%s bytes). Aborting.",
                    job_id,
                    blob_size
                )

                await cls._handle_job_failure(
                    job_id,
                    safe_filename,
                    client_ip,
                    feature
                )

                return

            success = await task_runner()

            await StorageService.delete_azure_blob(
                settings.UPLOAD_CONTAINER,
                safe_filename
            )

            if not success:
                await cls._handle_job_failure(
                    job_id,
                    safe_filename,
                    client_ip,
                    feature
                )

        except Exception as e:
            logger.error(
                "%s task critical failure job=%s: %s",
                feature.capitalize(),
                job_id,
                e
            )

            await cls._handle_job_failure(
                job_id,
                safe_filename,
                client_ip,
                feature
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
        client_ip: str
    ) -> None:
        """
        Execute image upscaling process.

        Args:
            job_id:
                Current job identifier.

            safe_filename:
                Uploaded image filename.

            model_type:
                Selected AI upscaling model.

            scale:
                Upscaling multiplier.

            client_ip:
                Client identifier.
        """
        async def _run():
            return await ai_upscaler.run_upscale(
                safe_filename=safe_filename,
                job_id=job_id,
                model_type=model_type,
                scale=scale
            )

        await cls._process_feature(
            job_id,
            safe_filename,
            client_ip,
            "upscale",
            _run
        )

    @classmethod
    async def process_rembg(
        cls,
        job_id: str,
        safe_filename: str,
        client_ip: str
    ) -> None:
        """
        Execute background removal process.

        Args:
            job_id:
                Current job identifier.

            safe_filename:
                Uploaded image filename.

            client_ip:
                Client identifier.
        """
        async def _run():
            return await bg_remover.run_removal(
                safe_filename=safe_filename,
                job_id=job_id
            )

        await cls._process_feature(
            job_id,
            safe_filename,
            client_ip,
            "rembg",
            _run
        )

    @classmethod
    async def process_colorrestore(
        cls,
        job_id: str,
        safe_filename: str,
        client_ip: str
    ) -> None:
        """
        Execute black-and-white image color restoration process.

        Args:
            job_id:
                Current job identifier.

            safe_filename:
                Uploaded image filename.

            client_ip:
                Client identifier.
        """
        async def _run():
            return await color_restorer.run_restore(
                safe_filename=safe_filename,
                job_id=job_id
            )

        await cls._process_feature(
            job_id,
            safe_filename,
            client_ip,
            "colorrestore",
            _run
        )