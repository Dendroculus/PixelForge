@echo off
setlocal EnableExtensions

rem Try to find project root from current terminal folder first
call :find_root "%CD%"

rem Fallback: try from the folder where this bat file exists
if not defined ROOT call :find_root "%~dp0"

if not defined ROOT (
  echo [ERROR] Could not find project root.
  pause
  exit /b 1
)

set "fileName=reset_usage.py"
set "BACKEND=%ROOT%\backend"
set "SCRIPTS=%BACKEND%\scripts"
set "BACKEND_PY=%BACKEND%\venv\Scripts\python.exe"
set "RESET_SCRIPT=%SCRIPTS%\%fileName%"

echo [INFO] Project root: %ROOT%
echo [INFO] Script: %RESET_SCRIPT%

if not exist "%RESET_SCRIPT%" (
  echo [ERROR] backend\scripts\%fileName% not found.
  pause
  exit /b 1
)

if exist "%BACKEND_PY%" (
  cd /d "%BACKEND%"
  "%BACKEND_PY%" "scripts\%fileName%"
) else (
  echo [WARN] backend venv not found. Falling back to system Python.
  cd /d "%BACKEND%"
  py "scripts\%fileName%"
)

pause
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