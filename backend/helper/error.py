"""
Custom exceptions for handling errors related to the Replicate API. This module defines specific error classes to represent different failure scenarios when interacting with the Replicate API, such as rate limits, timeouts, and unknown errors. These exceptions can be used to provide more informative error handling in the application. These errors are made to avoid generic error messages and to provide more context about the nature of the failure when interacting with the Replicate API.
"""

class ReplicateError(Exception):
    """Base error for replicate failures."""

class ReplicateRateLimitError(ReplicateError):
    """Raised when replicate API rate limit is exceeded."""

class ReplicateTimeoutError(ReplicateError):
    """Raised when replicate request times out."""

class ReplicateUnknownError(ReplicateError):
    """Raised for unexpected replicate failures."""