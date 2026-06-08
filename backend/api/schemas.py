from pydantic import BaseModel, EmailStr, Field

class InitRequest(BaseModel):
    cf_turnstile_response: str
    filename: str

class StartUpscaleRequest(BaseModel):
    job_id: str
    safe_filename: str
    scale: int = Field(default=2, ge=1, le=4)

class StartRembgRequest(BaseModel):
    job_id: str
    safe_filename: str

class StartColorRestoreRequest(BaseModel):
    job_id: str
    safe_filename: str

class FeedbackRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, strip_whitespace=True)
    email: EmailStr = Field(..., max_length=254)
    message: str = Field(..., min_length=10, max_length=1000, strip_whitespace=True)
    cf_turnstile_response: str