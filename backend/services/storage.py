"""
Storage Service Module

This module handles all asynchronous storage operations interfacing with Azure Blob Storage.
It provides methods for uploading user images to a private container, retrieving them 
for AI processing, saving the finalized upscaled images to a public container, and 
generating public URLs for the frontend.
"""

import io
import logging
from fastapi import HTTPException, status
from azure.storage.blob.aio import BlobServiceClient
from datetime import timedelta, timezone, datetime
from azure.storage.blob import generate_blob_sas, BlobSasPermissions
from core.config import AZURE_CONNECTION_STRING

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

    @staticmethod
    async def save_upload(image_stream: io.BytesIO, safe_filename: str) -> str:
        _ensure_azure_configured()
        
        file_data = image_stream.getvalue()
            
        try:
            async with BlobServiceClient.from_connection_string(AZURE_CONNECTION_STRING) as client:
                blob_client = client.get_blob_client(container="uploads", blob=safe_filename)
                await blob_client.upload_blob(file_data, overwrite=True)
                return safe_filename
        except Exception as e:
            logger.error(f"Azure upload failed for {safe_filename}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail="Failed to save file to cloud storage."
            )

    @staticmethod
    async def get_upload_bytes(safe_filename: str) -> bytes:
        _ensure_azure_configured()
        
        try:
            async with BlobServiceClient.from_connection_string(AZURE_CONNECTION_STRING) as client:
                blob_client = client.get_blob_client(container="uploads", blob=safe_filename)
                stream = await blob_client.download_blob()
                return await stream.readall()
        except Exception as e:
            logger.error(f"Azure download failed for {safe_filename}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail="Failed to retrieve file from cloud storage."
            )

    @staticmethod
    async def save_result(image_bytes: bytes, result_filename: str) -> str:
        _ensure_azure_configured()
        
        try:
            async with BlobServiceClient.from_connection_string(AZURE_CONNECTION_STRING) as client:
                blob_client = client.get_blob_client(container="results", blob=result_filename)
                await blob_client.upload_blob(image_bytes, overwrite=True)
                return blob_client.url
        except Exception as e:
            logger.error(f"Azure result upload failed for {result_filename}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail="Failed to save processed result to cloud storage."
            )

    @staticmethod
    async def check_result_exists(result_filename: str) -> bool:
        _ensure_azure_configured()
        
        try:
            async with BlobServiceClient.from_connection_string(AZURE_CONNECTION_STRING) as client:
                blob_client = client.get_blob_client(container="results", blob=result_filename)
                return await blob_client.exists()
        except Exception as e:
            logger.error(f"Azure existence check failed for {result_filename}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail="Failed to check result status."
            )

    @staticmethod
    def get_result_url(result_filename: str) -> str:
        _ensure_azure_configured()
            
        parts = {k.lower(): v for k, v in (item.split("=", 1) for item in AZURE_CONNECTION_STRING.split(";") if "=" in item)}
        account_name = parts.get("accountname")
        account_key = parts.get("accountkey")
        
        if not account_name or not account_key:
            logger.error("Failed to parse Azure Connection String for SAS generation.")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail="Storage configuration error."
            )

        try:
            sas_token = generate_blob_sas(
                account_name=account_name,
                container_name="results",
                blob_name=result_filename,
                account_key=account_key,
                permission=BlobSasPermissions(read=True),
                expiry=datetime.now(timezone.utc) + timedelta(minutes=10)
            )
            
            return f"https://{account_name}.blob.core.windows.net/results/{result_filename}?{sas_token}"
        except Exception as e:
             logger.error(f"SAS token generation failed for {result_filename}: {e}")
             raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail="Failed to generate secure access URL."
            )

    @staticmethod
    async def mark_job_failed(job_id: str) -> None:
        """
        Uploads a 0-byte marker file to Azure to indicate a failed job.
        
        Args:
            job_id (str): The ID of the failed job.
        """
        _ensure_azure_configured()
        marker_filename = f"failed/{job_id}.txt"
        
        try:
            async with BlobServiceClient.from_connection_string(AZURE_CONNECTION_STRING) as client:
                blob_client = client.get_blob_client(container="results", blob=marker_filename)
                await blob_client.upload_blob(b"", overwrite=True)
        except Exception as e:
            logger.error(f"Failed to write failure marker for job {job_id} to Azure: {e}")

    @staticmethod
    async def check_job_failed(job_id: str) -> bool:
        """
        Checks if a failure marker exists for the given job ID.
        
        Args:
            job_id (str): The ID of the job to check.
            
        Returns:
            bool: True if the failure marker exists, False otherwise.
        """
        _ensure_azure_configured()
        marker_filename = f"failed/{job_id}.txt"
        
        try:
            async with BlobServiceClient.from_connection_string(AZURE_CONNECTION_STRING) as client:
                blob_client = client.get_blob_client(container="results", blob=marker_filename)
                return await blob_client.exists()
        except Exception as e:
             logger.error(f"Failed to check failure marker for job {job_id} in Azure: {e}")
             return False   