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
from core.config import AZURE_CONNECTION_STRING

logger = logging.getLogger(__name__)

class StorageService:
    """
    Service class for managing Azure Blob Storage operations securely and asynchronously.
    """

    @staticmethod
    async def save_upload(image_stream: io.BytesIO, safe_filename: str) -> str:
        """
        Uploads the sanitized image stream directly to the private Azure 'uploads' container.
        
        Args:
            image_stream (io.BytesIO): The sanitized and re-encoded image memory stream.
            safe_filename (str): The sanitized, randomized UUID filename.
            
        Returns:
            str: The filename used for storage.
            
        Raises:
            HTTPException: If cloud storage fails or is not configured.
        """
        if not AZURE_CONNECTION_STRING:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail="Cloud storage is not configured."
            )
        
        file_data = image_stream.getvalue()
            
        try:
            async with BlobServiceClient.from_connection_string(AZURE_CONNECTION_STRING) as client:
                blob_client = client.get_blob_client(container="uploads", blob=safe_filename)
                await blob_client.upload_blob(file_data, overwrite=True)
                return safe_filename
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail="Failed to save file to cloud storage."
            )

    @staticmethod
    async def get_upload_bytes(safe_filename: str) -> bytes:
        """
        Downloads the raw image from the private uploads container for the AI to process.
        
        Args:
            safe_filename (str): The filename to retrieve.
            
        Returns:
            bytes: The raw image file data.
        """
        async with BlobServiceClient.from_connection_string(AZURE_CONNECTION_STRING) as client:
            blob_client = client.get_blob_client(container="uploads", blob=safe_filename)
            stream = await blob_client.download_blob()
            return await stream.readall()

    @staticmethod
    async def save_result(image_bytes: bytes, result_filename: str) -> str:
        """
        Uploads the AI-processed bytes to the public Azure 'results' container.
        
        Args:
            image_bytes (bytes): The final upscaled image data.
            result_filename (str): The filename for the result (e.g., job_id.png).
            
        Returns:
            str: The public URL of the uploaded blob.
        """
        async with BlobServiceClient.from_connection_string(AZURE_CONNECTION_STRING) as client:
            blob_client = client.get_blob_client(container="results", blob=result_filename)
            await blob_client.upload_blob(image_bytes, overwrite=True)
            return blob_client.url

    @staticmethod
    async def check_result_exists(result_filename: str) -> bool:
        """
        Checks if the AI has successfully finished uploading the result to Azure.
        
        Args:
            result_filename (str): The exact filename of the result.
            
        Returns:
            bool: True if the file exists in the container, False otherwise.
        """
        async with BlobServiceClient.from_connection_string(AZURE_CONNECTION_STRING) as client:
            blob_client = client.get_blob_client(container="results", blob=result_filename)
            return await blob_client.exists()

    @staticmethod
    def get_result_url(result_filename: str) -> str:
        """
        Generates the public Azure URL for the frontend without making a network request.
        
        Args:
            result_filename (str): The name of the result file.
            
        Returns:
            str: The full HTTPS URL to access the public image.
        """
        if not AZURE_CONNECTION_STRING:
            return ""
            
        parts = {k: v for k, v in (item.split("=", 1) for item in AZURE_CONNECTION_STRING.split(";") if "=" in item)}
        account_name = parts.get("AccountName")
        
        return f"https://{account_name}.blob.core.windows.net/results/{result_filename}"