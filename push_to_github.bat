@echo off
title Push Quick Note App to GitHub
color 0A
echo ========================================================
echo        PUSHING QUICK NOTE APP TO GITHUB
echo ========================================================
echo.
cd /d "%~dp0"

echo Remote Repository:
git remote -v
echo.
echo Pushing branch 'main' to GitHub...
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo   SUCCESS! Project pushed successfully to GitHub!
    echo   Visit: https://github.com/lavach02-arch/quick-note-app
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo   NOTE: If you see 'Repository not found',
    echo   Please create the repository first on GitHub:
    echo   1. Open: https://github.com/new
    echo   2. Repository name: quick-note-app
    echo   3. Click 'Create repository'
    echo   4. Run this script again!
    echo ========================================================
)
echo.
pause
