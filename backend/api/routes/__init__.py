"""Route package for grouping PixelForge FastAPI routers.

Package: api.routes

This file intentionally avoids importing submodules by default.
Keeping package initializers lightweight prevents hidden side effects such as
loading environment settings, creating semaphores, initializing provider clients,
or touching cloud/database dependencies during simple imports.
"""

__all__: list[str] = []