@echo off
title PlayStation 5 Dev Console
cd /d "%~dp0"

echo ========================================================
echo   PLAYSTATION 5 DESKTOP - DEV MODE (LIVE HMR RELOAD)
echo ========================================================
echo.

call npm.cmd run desktop
