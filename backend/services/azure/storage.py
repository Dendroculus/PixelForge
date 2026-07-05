"""Azure Blob Storage service for PixelForge.

This module centralizes asynchronous Azure Blob Storage operations:

    - generating upload and result SAS URLs
    - saving and retrieving upload/result blobs
    - deleting temporary files
    - writing and checking job failure markers
    - cleaning expired result blobs

All public methods sanitize blob names with ``os.path.basename`` before using
them in Azure calls. This keeps blob operations constrained to expected names.
"""

import io
import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone

from azure.storage.blob import BlobSasPermissions, generate_blob_sas
from azure.storage.blob.aio import BlobServiceClient
from fastapi import HTTPException, status

from core.config import settings
from services.azure.storage_utils import get_marker_filename, parse_azure_credentials

logger = logging.getLogger(__name__)


def _ensure_azure_configured() -> None:
    """Ensure Azure connection settings exist before storage operations.

    Raises:
        HTTPException:
            Raised when Azure storage is not configured.
    """
    if not settings.AZURE_CONNECTION_STRING:
        logger.error("Attempted to use StorageService without AZURE_CONNECTION_STRING.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Cloud storage is not configured.",
        )


class StorageService:
    """Async service class for Azure Blob Storage operations."""

    @classmethod
    @asynccontextmanager
    async def _get_blob_client(cls, container_name: str, blob_name: str):
        """Yield an async Azure blob client for a specific blob."""
        _ensure_azure_configured()
        async with BlobServiceClient.from_connection_string(
            settings.AZURE_CONNECTION_STRING
        ) as client:
            yield client.get_blob_client(container=container_name, blob=blob_name)

    @classmethod
    @asynccontextmanager
    async def _get_container_client(cls, container_name: str):
        """Yield an async Azure container client."""
        _ensure_azure_configured()
        async with BlobServiceClient.from_connection_string(
            settings.AZURE_CONNECTION_STRING
        ) as client:
            yield client.get_container_client(container_name)

    @classmethod
    def generate_upload_sas(cls, safe_filename: str) -> str:
        """Generate a write-only SAS URL for direct client upload.

        Args:
            safe_filename:
                Sanitized upload filename.

        Raises:
            HTTPException:
                Raised when Azure credentials are invalid or SAS generation
                fails.

        Returns:
            str:
                Full Azure Blob SAS URL for uploading.
        """
        _ensure_azure_configured()
        secure_name = os.path.basename(safe_filename)
        account_name, account_key = parse_azure_credentials(settings.AZURE_CONNECTION_STRING)

        if not account_name or not account_key:
            logger.error("Failed to parse Azure Connection String for upload SAS.")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Storage configuration error.",
            )

        try:
            sas_token = generate_blob_sas(
                account_name=account_name,
                container_name=settings.UPLOAD_CONTAINER,
                blob_name=secure_name,
                account_key=account_key,
                permission=BlobSasPermissions(write=True, create=True),
                expiry=datetime.now(timezone.utc)
                + timedelta(minutes=settings.SAS_EXPIRATION_MINUTES),
            )
            return (
                f"https://{account_name}.blob.core.windows.net/"
                f"{settings.UPLOAD_CONTAINER}/{secure_name}?{sas_token}"
            )
        except Exception as e:
            logger.error("Upload SAS token generation failed for %s: %s", secure_name, e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate secure upload URL.",
            ) from e

    @classmethod
    async def save_upload(cls, image_stream: io.BytesIO, safe_filename: str) -> str:
        """Save a byte stream to the upload container.

        Args:
            image_stream:
                In-memory image stream.
            safe_filename:
                Sanitized upload filename.

        Returns:
            str:
                Stored blob name.
        """
        secure_name = os.path.basename(safe_filename)
        file_data = image_stream.getvalue()
        try:
            async with cls._get_blob_client(settings.UPLOAD_CONTAINER, secure_name) as blob_client:
                await blob_client.upload_blob(file_data, overwrite=True)
                return secure_name
        except Exception as e:
            logger.error("Azure upload failed for %s: %s", secure_name, e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save file to cloud storage.",
            ) from e

    @classmethod
    async def get_upload_bytes(cls, safe_filename: str) -> bytes:
        """Download an uploaded blob into memory.

        Args:
            safe_filename:
                Sanitized upload filename.

        Returns:
            bytes:
                Uploaded file bytes.
        """
        secure_name = os.path.basename(safe_filename)
        try:
            async with cls._get_blob_client(settings.UPLOAD_CONTAINER, secure_name) as blob_client:
                stream = await blob_client.download_blob()
                return await stream.readall()
        except Exception as e:
            logger.error("Azure download failed for %s: %s", secure_name, e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve file from cloud storage.",
            ) from e

    @classmethod
    async def save_result(cls, image_bytes: bytes, result_filename: str) -> str:
        """Save processed AI result bytes to the result container.

        Args:
            image_bytes:
                Final processed image bytes.
            result_filename:
                Sanitized result filename.

        Returns:
            str:
                Azure blob URL without SAS token.
        """
        secure_name = os.path.basename(result_filename)
        try:
            async with cls._get_blob_client(settings.RESULT_CONTAINER, secure_name) as blob_client:
                await blob_client.upload_blob(image_bytes, overwrite=True)
                return blob_client.url
        except Exception as e:
            logger.error("Azure result upload failed for %s: %s", secure_name, e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save processed result to cloud storage.",
            ) from e

    @classmethod
    async def check_result_exists(cls, result_filename: str) -> bool:
        """Check whether a processed result blob exists."""
        secure_name = os.path.basename(result_filename)
        try:
            async with cls._get_blob_client(settings.RESULT_CONTAINER, secure_name) as blob_client:
                return await blob_client.exists()
        except Exception as e:
            logger.error("Azure existence check failed for %s: %s", secure_name, e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to check result status.",
            ) from e

    @classmethod
    def get_result_url(cls, result_filename: str) -> str:
        """Generate a read-only SAS URL for a processed result.

        Args:
            result_filename:
                Sanitized result filename.

        Returns:
            str:
                Full Azure Blob SAS URL for downloading the result.
        """
        _ensure_azure_configured()
        secure_name = os.path.basename(result_filename)
        account_name, account_key = parse_azure_credentials(settings.AZURE_CONNECTION_STRING)

        if not account_name or not account_key:
            logger.error("Failed to parse Azure Connection String for SAS generation.")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Storage configuration error.",
            )

        try:
            sas_token = generate_blob_sas(
                account_name=account_name,
                container_name=settings.RESULT_CONTAINER,
                blob_name=secure_name,
                account_key=account_key,
                permission=BlobSasPermissions(read=True),
                expiry=datetime.now(timezone.utc)
                + timedelta(minutes=settings.SAS_EXPIRATION_MINUTES),
            )
            return (
                f"https://{account_name}.blob.core.windows.net/"
                f"{settings.RESULT_CONTAINER}/{secure_name}?{sas_token}"
            )
        except Exception as e:
            logger.error("SAS token generation failed for %s: %s", secure_name, e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate secure access URL.",
            ) from e

    @classmethod
    async def delete_azure_blob(cls, container_name: str, blob_name: str) -> bool:
        """Delete a blob from Azure Storage.

        Returns:
            bool:
                ``True`` if deletion succeeded, otherwise ``False``.
        """
        secure_name = os.path.basename(blob_name)
        try:
            async with cls._get_blob_client(container_name, secure_name) as blob_client:
                await blob_client.delete_blob()
                logger.info("🗑️ Instant Cleanup: %s/%s removed.", container_name, secure_name)
                return True
        except Exception as e:
            logger.warning("⚠️ Delete skipped for %s/%s: %s", container_name, secure_name, e)
            return False

    @classmethod
    async def cleanup_expired_results(cls, expiration_minutes: int) -> int:
        """Delete result blobs older than the expiration window.

        Args:
            expiration_minutes:
                Maximum blob age before deletion.

        Returns:
            int:
                Number of deleted blobs.
        """
        deleted_count = 0
        cutoff_time = datetime.now(timezone.utc) - timedelta(minutes=expiration_minutes)
        try:
            async with cls._get_container_client(settings.RESULT_CONTAINER) as container:
                async for blob in container.list_blobs():
                    if blob.creation_time and blob.creation_time < cutoff_time:
                        await container.delete_blob(blob.name)
                        deleted_count += 1
                        logger.info("🧹 Cloud Janitor: Deleted expired result -> %s", blob.name)
        except Exception as e:
            logger.error("⚠️ Cloud Janitor failed to clean Azure: %s", e)
        return deleted_count

    @classmethod
    async def mark_job_failed(cls, job_id: str) -> None:
        """Create a zero-byte failure marker for a job."""
        secure_job_id = os.path.basename(job_id)
        marker_filename = get_marker_filename(secure_job_id)
        try:
            async with cls._get_blob_client(settings.RESULT_CONTAINER, marker_filename) as blob_client:
                await blob_client.upload_blob(b"", overwrite=True)
        except Exception as e:
            logger.error("Failed to write failure marker for job %s to Azure: %s", secure_job_id, e)

    @classmethod
    async def check_job_failed(cls, job_id: str) -> bool:
        """Check whether a job has a failure marker."""
        secure_job_id = os.path.basename(job_id)
        marker_filename = get_marker_filename(secure_job_id)
        try:
            async with cls._get_blob_client(settings.RESULT_CONTAINER, marker_filename) as blob_client:
                return await blob_client.exists()
        except Exception as e:
            logger.error("Failed to check failure marker for job %s in Azure: %s", secure_job_id, e)
            return False

    @classmethod
    async def get_blob_size(cls, container_name: str, blob_name: str) -> int:
        """Return blob size in bytes.

        Returns:
            int:
                Blob size, or ``0`` if the size cannot be retrieved.
        """
        secure_name = os.path.basename(blob_name)
        try:
            async with cls._get_blob_client(container_name, secure_name) as blob_client:
                props = await blob_client.get_blob_properties()
                return props.size
        except Exception as e:
            logger.warning("Failed to retrieve size for blob %s: %s", secure_name, e)
            return 0
