"""Application router registration helpers.

The application factory calls this module once during startup to attach the
central API router to the FastAPI app. Individual route modules are composed in
``api.routes.router`` so this file stays focused on app-level registration.
"""

from fastapi import FastAPI

from api.routes.router import router


def register_routers(app: FastAPI) -> None:
    """Register all API routers on the FastAPI application.

    Args:
        app:
            FastAPI application instance being configured.
    """
    app.include_router(router)
