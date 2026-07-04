from fastapi import FastAPI

from api.routes import ai_tools, feedback, system, health


def register_routers(app: FastAPI) -> None:
    app.include_router(health.router)
    app.include_router(ai_tools.router)
    app.include_router(feedback.router)
    app.include_router(system.router)