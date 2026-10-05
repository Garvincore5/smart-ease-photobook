@echo off
if exist "%~dp0SmartEasePhotobookStudio.exe" (
    start "" "%~dp0SmartEasePhotobookStudio.exe"
) else (
    start "" "%~dp0SmartEaseStudio.exe"
)
