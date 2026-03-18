@echo off
chcp 65001 >nul
REM Batch file to run both frontend and backend

echo Starting Backend and Frontend...
echo.

REM Start Backend in a new window
cd /d "%~dp0backend"
start cmd /k "npm run dev"

REM Wait a moment before starting frontend
timeout /t 2 /nobreak

REM Start Frontend in a new window
cd /d "%~dp0frontend"
start cmd /k "npm run dev"

echo.
echo Backend and Frontend are starting...
echo Backend will run on http://localhost:3000 (or your configured port)
echo Frontend will run on http://localhost:5173 (or your configured port)
pause
