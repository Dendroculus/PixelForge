"""
Run PixelForge FastAPI backend locally.
NOTE to self: Please do not use this script in HOSTED production environments.
"""

import uvicorn

MAIN_APP = "main:app"
HOST = "127.0.0.1"
PORT = 8000

if __name__ == "__main__":
    uvicorn.run(
        MAIN_APP,
        host=HOST,
        port=PORT,
        reload=True,
        reload_excludes=[
            "logs/*",
            "*.log",
            "__pycache__/*",
            ".ruff_cache/*",
            ".pytest_cache/*",
        ],
        log_config=None,
        log_level="info",
    )