"""
Storage Service Module

This module handles all asynchronous storage operations interfacing with Azure Blob Storage.
It provides methods for uploading user images to a private container, retrieving them 
for AI processing, saving the finalized upscaled images to a public container, generating 
public URLs for the frontend, and securely shredding files.
"""

import io
import os
import logging
from contextlib import asynccontextmanager
from fastapi import HTTPException, status
from azure.storage.blob.aio import BlobServiceClient
from datetime import timedelta, timezone, datetime
from azure.storage.blob import generate_blob_sas, BlobSasPermissions
from core.config import AZURE_CONNECTION_STRING, ContainerNames as CN, LimitConfig as LC
from helper.utils import get_marker_filename, parse_azure_credentials

logger = logging.getLogger(__name__)

def _ensure_azure_configured():
    """Helper to ensure Azure connection string exists before operations."""
    if not AZURE_CONNECTION_STRING:
        logger.error("Attempted to use StorageService without AZURE_CONNECTION_STRING.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Cloud storage is not configured."
        )

class StorageService:
    """
    Service class for managing Azure Blob Storage operations securely and asynchronously.
    """
    UPLOAD_CONTAINER = CN.UPLOAD_CONTAINER
    RESULT_CONTAINER = CN.RESULT_CONTAINER

    @classmethod
    @asynccontextmanager
    async def _get_blob_client(cls, container_name: str, blob_name: str):
        """
        Securely provisions an async blob client and ensures connection cleanup.
        """
        _ensure_azure_configured()
        async with BlobServiceClient.from_connection_string(AZURE_CONNECTION_STRING) as client:
            yield client.get_blob_client(container=container_name, blob=blob_name)

    @classmethod
    async def save_upload(cls, image_stream: io.BytesIO, safe_filename: str) -> str:
        secure_name = os.path.basename(safe_filename)
        file_data = image_stream.getvalue()
            
        try:
            async with cls._get_blob_client(cls.UPLOAD_CONTAINER, secure_name) as blob_client:
                await blob_client.upload_blob(file_data, overwrite=True)
                return secure_name
        except Exception as e:
            logger.error(f"Azure upload failed for {secure_name}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail="Failed to save file to cloud storage."
            )

    @classmethod
    async def get_upload_bytes(cls, safe_filename: str) -> bytes:
        secure_name = os.path.basename(safe_filename)
        
        try:
            async with cls._get_blob_client(cls.UPLOAD_CONTAINER, secure_name) as blob_client:
                stream = await blob_client.download_blob()
                return await stream.readall()
        except Exception as e:
            logger.error(f"Azure download failed for {secure_name}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail="Failed to retrieve file from cloud storage."
            )

    @classmethod
    async def save_result(cls, image_bytes: bytes, result_filename: str) -> str:
        secure_name = os.path.basename(result_filename)
        
        try:
            async with cls._get_blob_client(cls.RESULT_CONTAINER, secure_name) as blob_client:
                await blob_client.upload_blob(image_bytes, overwrite=True)
                return blob_client.url
        except Exception as e:
            logger.error(f"Azure result upload failed for {secure_name}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail="Failed to save processed result to cloud storage."
            )

    @classmethod
    async def check_result_exists(cls, result_filename: str) -> bool:
        secure_name = os.path.basename(result_filename)
        
        try:
            async with cls._get_blob_client(cls.RESULT_CONTAINER, secure_name) as blob_client:
                return await blob_client.exists()
        except Exception as e:
            logger.error(f"Azure existence check failed for {secure_name}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail="Failed to check result status."
            )

    @classmethod
    def get_result_url(cls, result_filename: str) -> str:
        _ensure_azure_configured()
        secure_name = os.path.basename(result_filename)
        account_name, account_key = parse_azure_credentials(AZURE_CONNECTION_STRING)
        
        if not account_name or not account_key:
            logger.error("Failed to parse Azure Connection String for SAS generation.")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail="Storage configuration error."
            )

        try:
            sas_token = generate_blob_sas(
                account_name=account_name,
                container_name=cls.RESULT_CONTAINER,
                blob_name=secure_name,
                account_key=account_key,
                permission=BlobSasPermissions(read=True),
                expiry=datetime.now(timezone.utc) + timedelta(minutes=LC.SAS_EXPIRATION_MINUTES)
            )
            
            return f"https://{account_name}.blob.core.windows.net/{cls.RESULT_CONTAINER}/{secure_name}?{sas_token}"
        except Exception as e:
             logger.error(f"SAS token generation failed for {secure_name}: {e}")
             raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail="Failed to generate secure access URL."
            )

    @classmethod
    async def delete_blob(cls, container_name: str, blob_name: str) -> bool:
        """
        Permanently deletes a blob from a specific container.
        Used for immediate upload cleanup and delayed result cleanup.
        """
        secure_name = os.path.basename(blob_name)
        try:
            async with cls._get_blob_client(container_name, secure_name) as blob_client:
                await blob_client.delete_blob()
                logger.info(f"🗑️ Azure Cleanup: {container_name}/{secure_name} removed.")
                return True
        except Exception as e:
            logger.warning(f"⚠️ Delete skipped for {container_name}/{secure_name}: {e}")
            return False

    @classmethod
    async def mark_job_failed(cls, job_id: str) -> None:
        secure_job_id = os.path.basename(job_id)
        marker_filename = get_marker_filename(secure_job_id)
        
        try:
            async with cls._get_blob_client(cls.RESULT_CONTAINER, marker_filename) as blob_client:
                await blob_client.upload_blob(b"", overwrite=True)
        except Exception as e:
            logger.error(f"Failed to write failure marker for job {secure_job_id} to Azure: {e}")

    @classmethod
    async def check_job_failed(cls, job_id: str) -> bool:
        secure_job_id = os.path.basename(job_id)
        marker_filename = get_marker_filename(secure_job_id)
        
        try:
            async with cls._get_blob_client(cls.RESULT_CONTAINER, marker_filename) as blob_client:
                return await blob_client.exists()
        except Exception as e:
             logger.error(f"Failed to check failure marker for job {secure_job_id} in Azure: {e}")
             return False