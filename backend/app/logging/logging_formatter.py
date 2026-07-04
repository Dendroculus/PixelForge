import logging

LOGGER_DISPLAY_NAMES = {
    "app.factory": "app",
    "app.request": "request",
    "uvicorn": "server",
    "uvicorn.error": "server",
    "uvicorn.access": "request",
    "database.db_pool": "database",
    "limiter.usage_service": "usage",
    "services.maintenance.janitor_service": "janitor",
    "services.azure.storage": "azure-storage",
    "services.ai.pipeline.image_pipeline_service": "ai-pipeline",
    "services.job.job_initializer": "job-init",
    "services.job.job_dispatcher": "job-dispatch",
    "services.job.job_manager": "job-manager",
    "services.job.queue_service": "queue",
    "api.routes.ai_tools": "ai-routes",
    "api.routes.feedback": "feedback",
    "api.routes.health": "health",
    "api.routes.system": "system",
}


class PixelForgeFormatter(logging.Formatter):
    """
    Pretty formatter for PixelForge logs.

    Converts internal logger names like:
        uvicorn.error

    Into readable component names like:
        server
    """

    def format(self, record: logging.LogRecord) -> str:
        record.component = self._get_component_name(record.name)
        return super().format(record)

    @staticmethod
    def _get_component_name(logger_name: str) -> str:
        if logger_name in LOGGER_DISPLAY_NAMES:
            return LOGGER_DISPLAY_NAMES[logger_name]

        if logger_name.startswith("services."):
            return logger_name.removeprefix("services.")

        if logger_name.startswith("api.routes."):
            return logger_name.removeprefix("api.routes.")

        if logger_name.startswith("app."):
            return logger_name.removeprefix("app.")

        if logger_name.startswith("database."):
            return logger_name.removeprefix("database.")

        if logger_name.startswith("limiter."):
            return logger_name.removeprefix("limiter.")

        return logger_name


def build_log_formatter() -> PixelForgeFormatter:
    return PixelForgeFormatter(
        fmt=(
            "%(asctime)s | %(levelname)-8s | "
            "%(component)-22s | %(message)s"
        ),
        datefmt="%Y-%m-%d %H:%M:%S",
    )