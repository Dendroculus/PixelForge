@echo off

start cmd /k "cd /d frontend && npm run dev"

start cmd /k "cd /d backend && venv\Scripts\activate && python run.py"