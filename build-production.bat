@echo off
REM ========================================
REM DCCB Loan Management - Production Build
REM ========================================

echo.
echo ========================================
echo  DCCB Loan Management System
echo  Production Build Script
echo ========================================
echo.

REM Check if running in correct directory
if not exist "app\main.py" (
    echo ERROR: Please run this script from the root directory
    pause
    exit /b 1
)

echo Step 1: Creating production environment file...
if not exist ".env.production" (
    copy .env.example .env.production
    echo [!] IMPORTANT: Edit .env.production with production values before deployment!
    echo [!] Change SECRET_KEY, DATABASE_URL, and all sensitive credentials
) else (
    echo .env.production already exists
)

echo.
echo Step 2: Installing Python dependencies...
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
) else (
    echo [!] Virtual environment not found. Creating one...
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
)

echo.
echo Step 3: Building Frontend...
cd frontend
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
)

REM Create production env file for frontend
echo Creating frontend production config...
(
echo VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
echo VITE_APP_NAME=DCCB Loan Management
) > .env.production

echo Building frontend for production...
call npm run build

if exist "dist" (
    echo [SUCCESS] Frontend build complete! Files are in frontend/dist
) else (
    echo [ERROR] Frontend build failed!
)

cd ..

echo.
echo Step 4: Preparing Mobile App build...
cd mobile

if not exist "node_modules" (
    echo Installing mobile dependencies...
    call npm install
)

echo.
echo ========================================
echo Mobile App Build Options:
echo ========================================
echo.
echo Option 1: Build with Expo (EAS Build - Recommended)
echo   - Requires Expo account (free)
echo   - Builds in cloud
echo   - Command: npx eas-cli build -p android
echo.
echo Option 2: Build locally
echo   - Requires Android Studio
echo   - Takes longer
echo   - See DEPLOYMENT_COMPLETE_GUIDE.md for instructions
echo.

set /p BUILD_MOBILE="Do you want to build mobile app now? (y/n): "
if /i "%BUILD_MOBILE%"=="y" (
    echo.
    echo Installing EAS CLI...
    call npm install -g eas-cli
    
    echo.
    echo [!] You'll need to login to Expo
    echo.
    call eas login
    
    echo.
    echo Configuring EAS Build...
    call eas build:configure
    
    echo.
    echo Building APK for Android...
    echo This will take 10-20 minutes...
    call eas build -p android --profile preview
    
    echo.
    echo [SUCCESS] Mobile app build started!
    echo You'll receive a download link when build completes.
) else (
    echo Skipping mobile build. You can build later using:
    echo   cd mobile
    echo   npx eas-cli build -p android
)

cd ..

echo.
echo ========================================
echo  Build Summary
echo ========================================
echo.
echo [*] Backend: Ready (Python dependencies installed)
echo [*] Frontend: Built in frontend/dist folder
echo [*] Mobile: %BUILD_MOBILE%
echo.
echo ========================================
echo  Next Steps
echo ========================================
echo.
echo 1. Edit .env.production with your production values
echo 2. Deploy backend to your server
echo 3. Deploy frontend dist folder to web server
echo 4. Download and test mobile APK
echo.
echo See DEPLOYMENT_COMPLETE_GUIDE.md for detailed instructions
echo.
pause
