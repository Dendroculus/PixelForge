from fastapi import FastAPI

from api.routes.router import router

def register_routers(app: FastAPI) -> None:
    app.include_router(router)