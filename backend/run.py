"""
This file is created to simplify the command to run the backend server to reduce time of typing and to avoid mistakes. It simply imports the main app from main.py and runs it using uvicorn.
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
    )