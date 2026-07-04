import os
import uuid

from fastapi import HTTPException, status

from core.config import settings
from limiter.usage_service import UsageService
from services.azure.storage import StorageService
from services.security.turnstile_service import verify_turnstile
from domain.ai_features import FeatureType


class JobInitializer:
    """
    Service responsible for initializing AI jobs before processing starts.

    Responsibilities:
    - Verify Turnstile token.
    - Check daily usage limit.
    - Generate job ID.
    - Generate safe upload filename.
    - Generate direct Azure upload URL.
    """

    @staticmethod
    def is_manual_bypass_allowed() -> bool:
        env = settings.ENVIRONMENT.lower()

        allow_bypass = os.getenv("ALLOW_TURNSTILE_TEST_BYPASS", "false").lower() in {
            "1",
            "true",
            "yes",
            "on",
        }

        return env in {"local", "dev", "development"} and allow_bypass

    @staticmethod
    def _get_safe_extension(filename: str) -> str:
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "jpg"

        if ext not in {"jpg", "jpeg", "png", "webp"}:
            return "jpg"

        return ext

    @classmethod
    async def initialize_job(
        cls,
        cf_turnstile_response: str,
        filename: str,
        feature: FeatureType,
        limit_24h: int,
        client_ip: str,
    ) -> dict:
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
        ext = cls._get_safe_extension(filename)
        safe_filename = f"{job_id}.{ext}"

        return {
            "job_id": job_id,
            "safe_filename": safe_filename,
            "upload_url": StorageService.generate_upload_sas(safe_filename),
        }