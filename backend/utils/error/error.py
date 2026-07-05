"""Custom exception classes used by PixelForge.

These exceptions provide named failure types for upstream AI provider errors and
configuration problems. Higher layers can catch these specific classes instead
of relying on generic ``Exception`` messages.
"""


class MissingEnvironmentVariableError(Exception):
    """Raised when a required environment variable is missing."""


class ReplicateError(Exception):
    """Base class for Replicate provider failures."""


class ReplicateRateLimitError(ReplicateError):
    """Raised when the Replicate API rate limit is exceeded."""


class ReplicateTimeoutError(ReplicateError):
    """Raised when a Replicate request times out."""


class ReplicateUnknownError(ReplicateError):
    """Raised for unexpected Replicate provider failures."""
