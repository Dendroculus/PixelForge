import logging
import os
import uuid

from fastapi import HTTPException, status

from limiter.usage_service import UsageService
from services.queue_service import QueueService
from services.storage import StorageService
from services.ai.upscale import ai_upscaler
from services.ai.bg_remover import bg_remover
from services.ai.color_restorer import color_restorer

from api.dependencies import verify_turnstile
from core.config import LimitConfig as LC, FEATURE_LIMITS, MAX_FILE_SIZE_BYTES

logger = logging.getLogger(__name__)


class JobManager:
    """
    Orchestrates AI processing workflows, usage limits, queue management,
    and storage operations.
    """

    @staticmethod
    def is_manual_bypass_allowed() -> bool:
        """
        Checks whether the Turnstile manual bypass feature is allowed.

        Manual bypass is only enabled when:
        - The application environment is local/development.
        - ALLOW_TURNSTILE_TEST_BYPASS is explicitly enabled.

        This prevents test bypass behavior from being available in production.

        Returns:
            bool: True if manual bypass is allowed, otherwise False.
        """
        env = os.getenv("ENVIRONMENT", "").lower()
        allow_bypass = os.getenv("ALLOW_TURNSTILE_TEST_BYPASS", "false").lower() in {
            "1",
            "true",
            "yes",
            "on",
        }

        return env in {"local", "dev", "development"} and allow_bypass

    @classmethod
    async def initialize_job(
        cls,
        cf_turnstile_response: str,
        filename: str,
        feature: str,
        limit_24h: int,
        client_ip: str,
    ) -> dict:
        """
        Initializes a new AI processing job.

        Handles:
        - Turnstile verification.
        - Daily usage limit validation.
        - Job ID generation.
        - Secure filename creation.
        - Upload URL generation.

        Args:
            cf_turnstile_response:
                Client-provided Turnstile verification response.
            filename:
                Original uploaded filename used to determine extension.
            feature:
                Requested AI feature.
            limit_24h:
                Maximum allowed usage count for the feature.
            client_ip:
                Client IP address used for usage tracking.

        Raises:
            HTTPException:
                429 error when the daily limit has been reached.

        Returns:
            dict:
                Contains job ID, safe filename, and upload URL.
        """
        if not (
            cf_turnstile_response == "manual_test_bypass"
            and cls.is_manual_bypass_allowed()
        ):
            await verify_turnstile(cf_turnstile_response)

        is_allowed = await UsageService.check_daily_limit(
            client_ip,
            limit_24h=limit_24h,
            feature=feature,
        )

        if not is_allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="LIMIT_REACHED",
            )

        job_id = uuid.uuid4().hex

        ext = filename.split(".")[-1].lower() if "." in filename else "jpg"
        ext = ext if ext in {"jpg", "jpeg", "png", "webp"} else "jpg"

        safe_filename = f"{job_id}.{ext}"

        return {
            "job_id": job_id,
            "safe_filename": safe_filename,
            "upload_url": StorageService.generate_upload_sas(safe_filename),
        }

    @classmethod
    async def check_register_and_reserve(
        cls,
        job_id: str,
        client_ip: str,
        feature: str,
    ) -> None:
        """
        Reserves processing resources and registers client usage.

        Workflow:
        - Reserve queue slot.
        - Validate daily usage limit.
        - Increment usage counter.

        If the usage limit is exceeded after reserving a slot,
        the queue slot is released immediately.

        Args:
            job_id:
                Unique identifier used for queue tracking.
            client_ip:
                Client IP address used for usage tracking.
            feature:
                AI feature being processed.

        Raises:
            HTTPException:
                429 error when usage limit is reached.

        Returns:
            None.
        """
        await QueueService.reserve_slot(job_id)

        limit = FEATURE_LIMITS.get(feature, LC.UPSCALE_DAILY_USAGE_LIMIT)

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
    ) -> None:
        """
        Handles failed job cleanup and usage refund.

        Performs:
        - Marking job status as failed.
        - Returning consumed usage credit.

        Args:
            job_id:
                Failed job identifier.
            safe_filename:
                Uploaded file associated with the job.
            client_ip:
                Client IP address used for usage rollback.
            feature:
                AI feature that failed.

        Returns:
            None.
        """
        logger.warning(
            "Job %s failed for feature %s. Initializing cleanup and client limit refund.",
            job_id,
            feature,
        )

        await StorageService.mark_job_failed(job_id)

        await UsageService.decrement_daily_limit(
            client_ip,
            feature=feature,
        )

    @classmethod
    async def _process_feature(
        cls,
        job_id: str,
        safe_filename: str,
        client_ip: str,
        feature: str,
        task_runner,
    ) -> None:
        """
        Executes shared AI processing workflow.

        Handles:
        - File size validation.
        - AI task execution.
        - Temporary upload cleanup.
        - Failure handling.
        - Queue release.

        Args:
            job_id:
                Unique identifier of the processing job.
            safe_filename:
                Secure uploaded filename.
            client_ip:
                Client IP address used for usage tracking.
            feature:
                AI feature being executed.
            task_runner:
                Async callback that executes the AI process.

        Returns:
            None.
        """
        try:
            blob_size = await StorageService.get_blob_size(
                StorageService.UPLOAD_CONTAINER,
                safe_filename,
            )

            if blob_size > MAX_FILE_SIZE_BYTES:
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
                )

                return

            success = await task_runner()

            await StorageService.delete_azure_blob(
                StorageService.UPLOAD_CONTAINER,
                safe_filename,
            )

            if not success:
                await cls._handle_job_failure(
                    job_id,
                    safe_filename,
                    client_ip,
                    feature,
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
        """
        Processes image upscaling.

        Args:
            job_id:
                Unique identifier of the job.
            safe_filename:
                Uploaded image filename.
            model_type:
                Selected AI upscaling model.
            scale:
                Upscaling multiplier.
            client_ip:
                Client IP address used for usage tracking.

        Returns:
            None.
        """

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
        """
        Processes image background removal.

        Args:
            job_id:
                Unique identifier of the job.
            safe_filename:
                Uploaded image filename.
            client_ip:
                Client IP address used for usage tracking.

        Returns:
            None.
        """

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
        """
        Processes image color restoration.

        Args:
            job_id:
                Unique identifier of the job.
            safe_filename:
                Uploaded image filename.
            client_ip:
                Client IP address used for usage tracking.

        Returns:
            None.
        """

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