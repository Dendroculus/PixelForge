@echo off
setlocal

set "ROOT=%~dp0"

if not exist "%ROOT%frontend\package.json" (
  echo [ERROR] frontend/package.json not found.
  echo Make sure start_app.bat is placed in the project root folder.
  pause
  exit /b 1
)

if not exist "%ROOT%backend\" (
  echo [ERROR] backend directory not found.
  echo Make sure start_app.bat is placed in the project root folder.
  pause
  exit /b 1
)

start "PixelForge React Frontend" cmd /k "cd /d ""%ROOT%frontend"" && npm run dev"
start "PixelForge FastAPI Backend" cmd /k "cd /d ""%ROOT%backend"" && uvicorn main:app --reload"

endlocal