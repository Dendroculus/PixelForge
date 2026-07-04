@echo off
setlocal EnableExtensions EnableDelayedExpansion

rem Try to find project root from current terminal folder first
call :find_root "%CD%"

rem Fallback: try from the folder where this bat file exists
if not defined ROOT call :find_root "%~dp0"

if not defined ROOT (
  echo [ERROR] Could not find project root.
  echo Expected a folder containing:
  echo   frontend\package.json
  echo   backend\
  pause
  exit /b 1
)

set "FRONTEND=%ROOT%\frontend"
set "BACKEND=%ROOT%\backend"
set "BACKEND_PY=%BACKEND%\venv\Scripts\python.exe"

echo [INFO] Project root: %ROOT%
echo [INFO] Frontend: %FRONTEND%
echo [INFO] Backend: %BACKEND%

if not exist "%FRONTEND%\package.json" (
  echo [ERROR] frontend/package.json not found.
  pause
  exit /b 1
)

if not exist "%BACKEND%\main.py" (
  echo [ERROR] backend/main.py not found.
  pause
  exit /b 1
)

start "PixelForge React Frontend" cmd /k "cd /d "%FRONTEND%" && npm run dev"

if exist "%BACKEND_PY%" (
  start "PixelForge FastAPI Backend" cmd /k "cd /d "%BACKEND%" && "%BACKEND_PY%" -m uvicorn main:app --reload"
) else (
  echo [WARN] backend venv not found. Falling back to system Python.
  start "PixelForge FastAPI Backend" cmd /k "cd /d "%BACKEND%" && py -m uvicorn main:app --reload"
)

endlocal
exit /b 0


:find_root
set "DIR=%~f1"

:find_loop
if exist "%DIR%\frontend\package.json" if exist "%DIR%\backend\" (
  set "ROOT=%DIR%"
  exit /b 0
)

for %%I in ("%DIR%\..") do set "PARENT=%%~fI"

if /I "%PARENT%"=="%DIR%" (
  exit /b 1
)

set "DIR=%PARENT%"
goto find_loop