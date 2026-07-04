from pydantic import BaseModel, EmailStr, Field

class FeedbackRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, strip_whitespace=True)
    email: EmailStr = Field(..., max_length=254)
    message: str = Field(..., min_length=10, max_length=1000, strip_whitespace=True)
    cf_turnstile_response: str