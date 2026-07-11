"""Run the PixelForge FastAPI backend locally."""

import uvicorn

MAIN_APP = "main:app"
HOST = "127.0.0.1"
PORT = 8000

RELOAD_DIRS = [
    "api",
    "app",
    "core",
    "database",
    "domain",
    "limiter",
    "provider",
    "repository",
    "scripts",
    "services",
    "utils",
]

if __name__ == "__main__":
    uvicorn.run(
        MAIN_APP,
        host=HOST,
        port=PORT,
        reload=True,
        reload_dirs=RELOAD_DIRS,
        reload_excludes=[
            "logs",
            "logs/*",
            "*.log",
            "**/*.log",
            "__pycache__",
            "__pycache__/*",
            "**/__pycache__/*",
            ".ruff_cache",
            ".ruff_cache/*",
            ".pytest_cache",
            ".pytest_cache/*",
        ],
        proxy_headers=False,
        log_config=None,
        log_level="info",
        access_log=False,
    )
