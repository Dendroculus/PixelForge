import logging
from fastapi import APIRouter, UploadFile, File, Depends, BackgroundTasks, HTTPException, status, Security
from fastapi.security.api_key import APIKeyHeader

from core.security import validate_and_sanitize_upload
from services.storage import StorageService
from services.esrgan import ai_upscaler
from api.dependencies import valid_model_type
from core.config import PIXELFORGE_SECRET_KEY

logger = logging.getLogger(__name__)

router = APIRouter(tags=["upscale"])

""" These are the Security Setup for the API. The API key is expected to be sent in the 'X-API-Key' header. The get_api_key function checks the provided API key against the expected value and raises an HTTP 403 error if it doesn't match. This ensures that only authorized clients can access the API endpoints. """
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=True)

async def get_api_key(api_key: str = Security(api_key_header)):
    if api_key != PIXELFORGE_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Could not validate API Key"
        )
    return api_key

failed_jobs = set()

async def process_image_task(job_id: str, safe_filename: str, model_type: str):
    """Background task to process the uploaded image using the AI upscaler."""
    logger.info(f"🚀 Background task started for Job {job_id} [{model_type}]")
    try:
        success = await ai_upscaler.run_upscale(safe_filename=safe_filename, job_id=job_id)
        if not success:
            logger.error(f"❌ Background task failed for Job {job_id}")
            failed_jobs.add(job_id)
    except Exception as e:
        logger.error(f"❌ Exception in background task for Job {job_id}: {str(e)}")
        failed_jobs.add(job_id) 

@router.post(
    "/upscale", 
    status_code=status.HTTP_202_ACCEPTED,
    summary="Upload an image for upscaling",
    response_description="Returns the job ID for tracking the upscale process",
    dependencies=[Depends(get_api_key)]  
)

async def upload_image(
    background_tasks: BackgroundTasks, 
    file: UploadFile = File(...),
    model_type: str = Depends(valid_model_type),
):
    try:
        job_id, safe_filename = validate_and_sanitize_upload(file)
        await StorageService.save_upload(file, safe_filename)
    except ValueError as ve:
        logger.warning(f"Validation error on upload: {str(ve)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"Upload handling failed: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to process upload")
    
    background_tasks.add_task(process_image_task, job_id, safe_filename, model_type)
    
    return {"message": "Upload successful, processing started", "job_id": job_id}

@router.get(
    "/result/{job_id}",
    summary="Check upscaling result",
    response_description="Returns the status of the job and the URL if ready",
    dependencies=[Depends(get_api_key)]
)
async def get_result(
    job_id: str,
):
    if not job_id or not job_id.isalnum():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid job ID")

    if job_id in failed_jobs:
        return {"status": "failed", "message": "AI processing failed or ran out of memory."}

    result_filename = f"{job_id}.png"
    
    try:
        exists = await StorageService.check_result_exists(result_filename)
        
        if exists:
            failed_jobs.discard(job_id)
            url = StorageService.get_result_url(result_filename)
            return {"status": "ready", "url": url}
        
        return {"status": "processing"}
    except Exception as e:
        logger.error(f"Error checking result for job {job_id}: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error retrieving job status")