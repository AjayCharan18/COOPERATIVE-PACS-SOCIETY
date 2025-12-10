#!/bin/bash
# ========================================
# COOPERATIVE PACS - Production Build
# ========================================

set -e  # Exit on error

echo ""
echo "========================================"
echo " COOPERATIVE PACS - Loan Management"
echo " Production Build Script"
echo "========================================"
echo ""

# Check if running in correct directory
if [ ! -f "app/main.py" ]; then
    echo "ERROR: Please run this script from the root directory"
    exit 1
fi

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Creating production environment file...${NC}"
if [ ! -f ".env.production" ]; then
    cp .env.example .env.production
    echo -e "${RED}[!] IMPORTANT: Edit .env.production with production values before deployment!${NC}"
    echo -e "${RED}[!] Change SECRET_KEY, DATABASE_URL, and all sensitive credentials${NC}"
else
    echo ".env.production already exists"
fi

echo ""
echo -e "${YELLOW}Step 2: Installing Python dependencies...${NC}"
if [ -d "venv" ]; then
    source venv/bin/activate
    pip install -r requirements.txt
else
    echo "Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
fi

echo ""
echo -e "${YELLOW}Step 3: Building Frontend...${NC}"
cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Create production env file for frontend
echo "Creating frontend production config..."
cat > .env.production << EOF
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
VITE_APP_NAME=COOPERATIVE PACS
EOF

echo "Building frontend for production..."
npm run build

if [ -d "dist" ]; then
    echo -e "${GREEN}[SUCCESS] Frontend build complete! Files are in frontend/dist${NC}"
else
    echo -e "${RED}[ERROR] Frontend build failed!${NC}"
    exit 1
fi

cd ..

echo ""
echo -e "${YELLOW}Step 4: Preparing Mobile App build...${NC}"
cd mobile

if [ ! -d "node_modules" ]; then
    echo "Installing mobile dependencies..."
    npm install
fi

echo ""
echo "========================================"
echo "Mobile App Build Options:"
echo "========================================"
echo ""
echo "Option 1: Build with Expo (EAS Build - Recommended)"
echo "  - Requires Expo account (free)"
echo "  - Builds in cloud"
echo "  - Command: npx eas-cli build -p android"
echo ""
echo "Option 2: Build locally"
echo "  - Requires Android Studio"
echo "  - Takes longer"
echo "  - See DEPLOYMENT_COMPLETE_GUIDE.md for instructions"
echo ""

read -p "Do you want to build mobile app now? (y/n): " BUILD_MOBILE
if [ "$BUILD_MOBILE" = "y" ] || [ "$BUILD_MOBILE" = "Y" ]; then
    echo ""
    echo "Installing EAS CLI..."
    npm install -g eas-cli
    
    echo ""
    echo "[!] You'll need to login to Expo"
    echo ""
    eas login
    
    echo ""
    echo "Configuring EAS Build..."
    eas build:configure
    
    echo ""
    echo "Building APK for Android..."
    echo "This will take 10-20 minutes..."
    eas build -p android --profile preview
    
    echo ""
    echo -e "${GREEN}[SUCCESS] Mobile app build started!${NC}"
    echo "You'll receive a download link when build completes."
else
    echo "Skipping mobile build. You can build later using:"
    echo "  cd mobile"
    echo "  npx eas-cli build -p android"
fi

cd ..

echo ""
echo "========================================"
echo " Build Summary"
echo "========================================"
echo ""
echo -e "${GREEN}[*] Backend: Ready (Python dependencies installed)${NC}"
echo -e "${GREEN}[*] Frontend: Built in frontend/dist folder${NC}"
if [ "$BUILD_MOBILE" = "y" ] || [ "$BUILD_MOBILE" = "Y" ]; then
    echo -e "${GREEN}[*] Mobile: Build started${NC}"
else
    echo -e "${YELLOW}[*] Mobile: Skipped${NC}"
fi
echo ""
echo "========================================"
echo " Next Steps"
echo "========================================"
echo ""
echo "1. Edit .env.production with your production values"
echo "2. Deploy backend to your server"
echo "3. Deploy frontend dist folder to web server"
echo "4. Download and test mobile APK"
echo ""
echo "See DEPLOYMENT_COMPLETE_GUIDE.md for detailed instructions"
echo ""
