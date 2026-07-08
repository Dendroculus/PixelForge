"""AI job initialization service.

``JobInitializer`` prepares jobs before processing begins. It validates bot
protection, checks usage availability, generates safe filenames, and creates
short-lived Azure upload URLs for direct client-to-cloud uploads.
"""

import uuid

from fastapi import HTTPException, status

from core.config import settings
from domain.ai_features import FeatureType
from limiter.usage_service import UsageService
from services.azure.storage import StorageService
from services.security.turnstile_service import verify_turnstile
from utils.error import codes
from utils.error.responses import build_error_payload


class JobInitializer:
    """Service responsible for preparing AI jobs before processing starts."""

    @staticmethod
    def is_manual_bypass_allowed() -> bool:
        """Return whether local Turnstile bypass is allowed."""
        env = settings.ENVIRONMENT.lower()

        return env in {"local", "dev", "development"} and settings.ALLOW_TURNSTILE_TEST_BYPASS

    @staticmethod
    def _get_safe_extension(filename: str) -> str:
        """Return a supported safe extension from a client filename.

        Unsupported or missing extensions fall back to ``jpg``.
        """
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
        """Initialize an AI job and return upload metadata.

        Args:
            cf_turnstile_response:
                Cloudflare Turnstile token from the client.
            filename:
                Original client-side filename.
            feature:
                AI feature being initialized.
            limit_24h:
                Usage limit for the feature.
            client_ip:
                Client identifier used for usage tracking.

        Raises:
            HTTPException:
                Raised with HTTP 429 and a structured ``RATE_LIMITED`` payload
                when the client has reached the feature usage limit.

        Returns:
            dict:
                Job ID, safe upload filename, and upload SAS URL. Object
                removal jobs also include mask upload metadata.
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
                detail=build_error_payload(
                    codes.RATE_LIMITED,
                    "Usage limit reached for this feature.",
                ),
            )

        job_id = uuid.uuid4().hex
        ext = cls._get_safe_extension(filename)
        safe_filename = f"{job_id}.{ext}"

        response = {
            "job_id": job_id,
            "safe_filename": safe_filename,
            "upload_url": StorageService.generate_upload_sas(safe_filename),
        }

        if feature == "objectremove":
            mask_filename = f"{job_id}-mask.png"
            response["mask_filename"] = mask_filename
            response["mask_upload_url"] = StorageService.generate_upload_sas(mask_filename)

        return response
