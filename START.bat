@echo off
title FlowMind AI v3 - Dashboard
color 0B
echo.
echo  ========================================================
echo   FlowMind AI v3.0 - Starting...
echo  ========================================================
echo.
cd /d "%~dp0frontend"
echo  URL: http://localhost:5173
echo  Press Ctrl+C to stop
echo.
call npx vite --host
