@echo off
setlocal
title Smart Ease - Chrome Desktop Launcher

cd /d "%~dp0"

echo Starting Smart Ease Local Server on port 8765...
start /b "" py "%~dp0server.py" 8765

timeout /t 1 /nobreak >nul

set CHROME_BIN=
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    set "CHROME_BIN=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
) else if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    set "CHROME_BIN=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
) else if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    set "CHROME_BIN=%LocalAppData%\Google\Chrome\Application\chrome.exe"
)

if defined CHROME_BIN (
    echo Launching Google Chrome...
    start "" "%CHROME_BIN%" --app="http://127.0.0.1:8765/index.html"
) else (
    echo Launching default browser at http://127.0.0.1:8765/index.html...
    start "" "http://127.0.0.1:8765/index.html"
)

endlocal
