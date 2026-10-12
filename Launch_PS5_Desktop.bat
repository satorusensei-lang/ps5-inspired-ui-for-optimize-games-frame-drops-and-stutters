@echo off
title PlayStation 5 Desktop Application
cd /d "%~dp0"

echo ========================================================
echo        PLAYSTATION 5 DESKTOP CONSOLE LAUNCHER
echo ========================================================
echo.

if not exist "dist\index.html" (
    echo Building latest production assets...
    call npm.cmd run build
)

echo Launching PlayStation 5 Desktop App...
call npx.cmd electron .
