@echo off
REM Quick OpenAI Connection Test for Windows
echo.
echo ========================================
echo OpenAI Connection Test (Windows)
echo ========================================
echo.

echo 1. Testing DNS resolution...
nslookup api.openai.com
if %errorlevel% neq 0 (
    echo [ERROR] DNS lookup failed
    echo Check your internet connection or DNS settings
    pause
    exit /b 1
)
echo [OK] DNS resolution successful
echo.

echo 2. Testing HTTPS connection...
curl -I https://api.openai.com/v1/models
if %errorlevel% neq 0 (
    echo [ERROR] Cannot reach api.openai.com
    echo Possible causes:
    echo - VPN blocking connection
    echo - Firewall blocking port 443
    echo - No internet connection
    pause
    exit /b 1
)
echo [OK] HTTPS connection successful
echo.

echo 3. Running Node diagnostic script...
node scripts\test-openai-connection.js
if %errorlevel% neq 0 (
    echo [ERROR] Node diagnostic failed
    echo Check the errors above
    pause
    exit /b 1
)

echo.
echo ========================================
echo All tests passed!
echo ========================================
echo.
echo You can now restart your dev server:
echo   1. Press Ctrl+C to stop current server
echo   2. Run: npm run dev
echo.
pause
