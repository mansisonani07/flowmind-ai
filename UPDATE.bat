@echo off
title FlowMind AI - Update
color 0E
echo.
echo  ========================================================
echo   FlowMind AI - Updating dependencies...
echo  ========================================================
echo.

cd /d "%~dp0frontend"
echo  Updating npm packages...
call npm update --legacy-peer-deps

echo.
echo  Update complete! Run START.bat to restart.
echo.
pause
