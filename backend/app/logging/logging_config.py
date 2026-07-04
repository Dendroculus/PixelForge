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
    return getattr(
        logging,
        settings.LOG_LEVEL.upper(),
        logging.INFO,
    )


def _create_console_handler(log_level: int) -> logging.Handler:
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    console_handler.setFormatter(build_log_formatter())

    return console_handler


def _create_file_handler(log_level: int) -> logging.Handler:
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
    for logger_name, level in NOISY_LOGGERS.items():
        logging.getLogger(logger_name).setLevel(level)


def configure_logging() -> None:
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