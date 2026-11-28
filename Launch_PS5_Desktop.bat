@echo off
cd /d "%~dp0"

:: Single-instance lock is safely enforced by Electron app

:: Launch PlayStation 5 native desktop console detached from terminal
if exist "node_modules\electron\dist\electron.exe" (
    start "" "node_modules\electron\dist\electron.exe" .
) else (
    start "" /b npx.cmd electron .
)

:: Exit immediately so NO command prompt panel stays in the taskbar
exit
