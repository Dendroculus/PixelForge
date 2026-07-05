"""Application logging configuration for PixelForge.

This module centralizes logging setup for console output, optional rotating file
logs, Uvicorn logger integration, and third-party logger noise reduction.

The application factory calls ``configure_logging()`` during startup before the
FastAPI app is created, ensuring every later component uses the same formatter
and log-level policy.
"""

import logging
import sys

from logging.handlers import RotatingFileHandler
from pathlib import Path

from app.logging.logging_formatter import build_log_formatter
from core.config import settings


NOISY_LOGGERS = {
    "azure": logging.WARNING,
    "azure.core.pipeline.policies.http_logging_policy": logging.WARNING,
    "httpx": logging.WARNING,
    "httpcore": logging.WARNING,
    "watchfiles": logging.WARNING,
    "watchfiles.main": logging.WARNING,
}


def _get_log_level() -> int:
    """Resolve the configured logging level.

    Invalid or unsupported values fall back to ``logging.INFO`` so a bad
    environment value does not break application startup.

    Returns:
        int:
            Standard library logging level constant.
    """
    return getattr(
        logging,
        settings.LOG_LEVEL.upper(),
        logging.INFO,
    )


def _create_console_handler(log_level: int) -> logging.Handler:
    """Create the stdout logging handler.

    Args:
        log_level:
            Minimum log level handled by the console handler.

    Returns:
        logging.Handler:
            Configured stream handler using the PixelForge formatter.
    """
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    console_handler.setFormatter(build_log_formatter())

    return console_handler


def _create_file_handler(log_level: int) -> logging.Handler:
    """Create the optional rotating file logging handler.

    The log directory is created automatically when file logging is enabled.

    Args:
        log_level:
            Minimum log level handled by the file handler.

    Returns:
        logging.Handler:
            Configured rotating file handler.
    """
    log_dir = Path(settings.LOG_DIR)
    log_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    log_file = log_dir / settings.LOG_FILE_NAME

    file_handler = RotatingFileHandler(
        log_file,
        maxBytes=settings.LOG_MAX_BYTES,
        backupCount=settings.LOG_BACKUP_COUNT,
        encoding="utf-8",
    )
    file_handler.setLevel(log_level)
    file_handler.setFormatter(build_log_formatter())

    return file_handler


def _configure_uvicorn_loggers(log_level: int) -> None:
    """Route Uvicorn logs through the root logger configuration.

    Args:
        log_level:
            Log level applied to Uvicorn loggers.
    """
    for logger_name in (
        "uvicorn",
        "uvicorn.error",
        "uvicorn.access",
    ):
        uvicorn_logger = logging.getLogger(logger_name)
        uvicorn_logger.handlers.clear()
        uvicorn_logger.propagate = True
        uvicorn_logger.disabled = False
        uvicorn_logger.setLevel(log_level)


def _silence_noisy_loggers() -> None:
    """Reduce verbosity from third-party libraries."""
    for logger_name, level in NOISY_LOGGERS.items():
        logging.getLogger(logger_name).setLevel(level)


def configure_logging() -> None:
    """Configure application-wide logging.

    This function is intentionally idempotent for normal app startup: it clears
    existing root handlers before installing PixelForge handlers. That prevents
    duplicate logs during local reloads or repeated application factory calls.
    """
    log_level = _get_log_level()

    root_logger = logging.getLogger()
    root_logger.handlers.clear()
    root_logger.setLevel(log_level)

    root_logger.addHandler(
        _create_console_handler(log_level)
    )

    if settings.LOG_TO_FILE:
        root_logger.addHandler(
            _create_file_handler(log_level)
        )

    _configure_uvicorn_loggers(log_level)
    _silence_noisy_loggers()
