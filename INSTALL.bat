@echo off
title FlowMind AI v3 - Installer
color 0A
echo.
echo  ========================================================
echo   FlowMind AI v3.0 - Auto Installer
echo  ========================================================
echo.
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js is not installed!
    echo  Download: https://nodejs.org/ (LTS 18+)
    pause
    exit /b 1
)
echo  [1/2] Node.js found:
node --version
echo.
cd /d "%~dp0frontend"
echo  [2/2] Installing dependencies...
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo  [ERROR] npm install failed!
    pause
    exit /b 1
)
echo.
echo  Installation complete! Double-click START.bat to launch.
echo.
pause
