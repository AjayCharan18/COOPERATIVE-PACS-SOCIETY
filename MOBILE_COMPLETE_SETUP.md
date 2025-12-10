# DCCB Loan Management - Mobile App Setup Guide

## ✅ Updated for iOS & Android Support

### Project Overview
- **Platform Support:** iOS & Android (via Expo)
- **Backend URL:** http://192.168.0.106:8001/api/v1
- **Status:** All API endpoints tested and working (100% success rate)

---

## Quick Start

### Option 1: Test with Expo Go (Recommended - No Build Required)

#### On Android Phone:
1. **Install Expo Go** from Google Play Store
2. **Run development server:**
   ```powershell
   cd "D:\DCCB LOAN MANAGEMENT\mobile"
   npx expo start
   ```
3. **Scan QR code** with Expo Go app
4. App loads automatically!

#### On iPhone:
1. **Install Expo Go** from Apple App Store
2. **Run development server:**
   ```powershell
   cd "D:\DCCB LOAN MANAGEMENT\mobile"
   npx expo start
   ```
3. **Scan QR code** with iPhone Camera app
4. Opens in Expo Go automatically!

### Test Credentials
```
Email: farmer1@test.com
Password: test123
```

---

## Available Commands

### Development Server
```powershell
# Start Expo development server (supports both iOS & Android)
npm run expo

# Start with Android device/emulator specifically
npm run expo:android

# Start with iOS simulator (Mac only)
npm run expo:ios

# Original React Native Metro bundler
npm start
```

### Build Commands (for standalone apps)
```powershell
# Build for Android
npm run build:android

# Build for iOS
npm run build:ios
```

---

## Platform-Specific Configuration

### Android Configuration (app.json)
```json
{
  "android": {
    "package": "com.dccb.loanmobile",
    "versionCode": 1,
    "permissions": [
      "CAMERA",
      "READ_EXTERNAL_STORAGE",
      "WRITE_EXTERNAL_STORAGE",
      "ACCESS_FINE_LOCATION",
      "ACCESS_COARSE_LOCATION",
      "INTERNET",
      "ACCESS_NETWORK_STATE"
    ],
    "useNextNotificationsApi": true,
    "adaptiveIcon": {
      "foregroundImage": "./assets/adaptive-icon.png",
      "backgroundColor": "#ffffff"
    }
  }
}
```

**Permissions Explained:**
- `CAMERA` - Document scanning, photo capture for loan applications
- `READ/WRITE_EXTERNAL_STORAGE` - Save/load loan documents
- `ACCESS_FINE/COARSE_LOCATION` - Find nearby branches, location-based services
- `INTERNET` - API communication with backend
- `ACCESS_NETWORK_STATE` - Offline mode detection

### iOS Configuration (app.json)
```json
{
  "ios": {
    "bundleIdentifier": "com.dccb.loanmobile",
    "buildNumber": "1",
    "supportsTablet": true,
    "infoPlist": {
      "NSCameraUsageDescription": "This app uses the camera to scan documents and capture loan-related photos.",
      "NSPhotoLibraryUsageDescription": "This app needs access to your photo library to upload loan documents.",
      "NSLocationWhenInUseUsageDescription": "This app uses your location to provide branch information and services."
    }
  }
}
```

**Info.plist Keys Explained:**
- `NSCameraUsageDescription` - Required for camera access (iOS requirement)
- `NSPhotoLibraryUsageDescription` - Required for photo library access
- `NSLocationWhenInUseUsageDescription` - Required for location services

---

## Network Requirements

### Device Network Configuration
Both Android and iOS devices must be on the **same WiFi network** as the backend server:
- **Backend IP:** 192.168.0.106
- **Backend Port:** 8001
- **API Endpoint:** http://192.168.0.106:8001/api/v1

### Verify Network Connectivity
```powershell
# Check if backend is accessible
curl http://192.168.0.106:8001/api/v1/health

# Or from mobile browser, visit:
# http://192.168.0.106:8001/docs
```

---

## Testing Status

### ✅ API Integration Tests (100% Pass Rate)
All 7 API endpoint tests passing:

| Test | Endpoint | Status |
|------|----------|--------|
| Login | POST /auth/login | ✅ |
| Get User | GET /auth/me | ✅ |
| Dashboard | GET /dashboard/stats | ✅ |
| Loan Types | GET /loans/loan-types | ✅ |
| My Loans | GET /loans/ | ✅ |
| My Payments | GET /payments/ | ✅ |
| Registration | POST /auth/register | ✅ |

**Run API tests:**
```powershell
python mobile\test_api.py
```

---

## Building Standalone Apps

### For Android APK/AAB

#### Using Expo EAS Build (Recommended)
```powershell
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Configure project
eas build:configure

# Build APK for testing
eas build --platform android --profile preview

# Build AAB for Google Play Store
eas build --platform android --profile production
```

#### Using Local Build (requires Android Studio)
```powershell
# Generate Android project
npx expo prebuild --platform android

# Build APK
cd android
./gradlew assembleRelease

# Output: android/app/build/outputs/apk/release/app-release.apk
```

### For iOS IPA

#### Using Expo EAS Build (Requires Apple Developer Account)
```powershell
# Build for TestFlight/App Store
eas build --platform ios --profile production

# Build for development
eas build --platform ios --profile development
```

#### Using Local Build (Requires Mac + Xcode)
```powershell
# Generate iOS project
npx expo prebuild --platform ios

# Open in Xcode
open ios/DCCBLoanMobile.xcworkspace

# Build in Xcode: Product > Archive
```

---

## App Features (Both Platforms)

### ✅ Implemented Features
1. **Authentication**
   - Login/Register with email & password
   - JWT token-based authentication
   - Secure token storage

2. **Loan Management**
   - View all loans
   - Loan details with EMI schedule
   - Apply for new loans
   - Track loan status

3. **Payment Tracking**
   - View payment history
   - Make payments
   - Payment status updates

4. **Offline Mode**
   - Automatic request queueing
   - Data caching
   - Sync when online

5. **Push Notifications**
   - Loan approval notifications
   - Payment reminders
   - General announcements

6. **Profile Management**
   - View/edit profile
   - Update contact information
   - Document uploads

---

## Troubleshooting

### Android Issues

#### "Unable to load script" error
```powershell
# Clear Metro bundler cache
cd mobile
npx react-native start --reset-cache
```

#### "Could not connect to development server"
- Ensure device is on same WiFi (192.168.0.106 network)
- Check firewall settings (allow port 8081)
- Try USB debugging: `adb reverse tcp:8081 tcp:8081`

#### Permission denied errors
- Grant all required permissions in Android Settings
- Reinstall app if permissions not appearing

### iOS Issues

#### "Network request failed"
- iOS requires HTTPS by default
- Add exception in Info.plist (already configured):
  ```xml
  <key>NSAppTransportSecurity</key>
  <dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
  </dict>
  ```

#### "Could not connect to Metro"
- Ensure Mac and iPhone on same network
- Check firewall allows incoming connections
- Try: `npx expo start --tunnel`

### General Issues

#### Expo Go shows "Something went wrong"
```powershell
# Clear Expo cache
npx expo start -c

# Or reinstall dependencies
rm -rf node_modules
npm install
```

#### Package version mismatch warnings
```powershell
# Update packages to match Expo SDK
npx expo install --fix
```

---

## Production Deployment

### Android - Google Play Store

1. **Create release build:**
   ```powershell
   eas build --platform android --profile production
   ```

2. **Prepare store listing:**
   - App name: DCCB Loan Management
   - Package: com.dccb.loanmobile
   - Icon: 512x512px
   - Screenshots: Multiple devices

3. **Upload to Play Console:**
   - Create app in Google Play Console
   - Upload AAB file
   - Fill app details
   - Submit for review

### iOS - Apple App Store

1. **Prerequisites:**
   - Apple Developer account ($99/year)
   - Certificates & Provisioning Profiles

2. **Create release build:**
   ```powershell
   eas build --platform ios --profile production
   ```

3. **Upload to App Store Connect:**
   - Use Transporter app or Xcode
   - Upload IPA file
   - Fill app metadata
   - Submit for review

---

## Assets

### Required Assets (in `mobile/assets/`)
- `icon.png` - 1024x1024px app icon
- `adaptive-icon.png` - 1024x1024px Android adaptive icon
- `splash.png` - 2048x2048px splash screen
- `favicon.png` - 48x48px (for web)

**Generate assets:** Use https://icon.kitchen/ or https://appicon.co/

---

## API Documentation

Full API documentation available at:
- **Swagger UI:** http://192.168.0.106:8001/docs
- **ReDoc:** http://192.168.0.106:8001/redoc

---

## Support

### Test Users
```
Farmer Account:
- Email: farmer1@test.com
- Password: test123

Admin Account:
- Create using: python scripts/create_admin.py
```

### Logs & Debugging
```powershell
# View Metro bundler logs
npm start

# View Expo logs
npx expo start

# Android device logs
adb logcat | grep ReactNative

# iOS simulator logs
xcrun simctl spawn booted log stream --predicate 'processImagePath contains "DCCBLoanMobile"'
```

---

## Next Steps

1. ✅ **API Integration** - Completed (100% tests passing)
2. ✅ **iOS Support** - Configured
3. ✅ **Android Support** - Configured
4. ⏳ **Test on Physical Devices** - In progress
5. ⏳ **UI/UX Polish** - Pending
6. ⏳ **Production Build** - Pending
7. ⏳ **App Store Submission** - Pending

---

## Quick Reference

```powershell
# Start development server (both iOS & Android)
cd mobile && npx expo start

# Run API tests
python mobile\test_api.py

# Fix package versions
npx expo install --fix

# Clear all caches
npx expo start -c

# Build for testing
eas build --platform android --profile preview
eas build --platform ios --profile preview
```

**Status:** ✅ Ready for device testing on both iOS and Android!
