# MOBILE APP SETUP GUIDE

Complete guide to set up and run the DCCB Loan Management mobile app for testing and development.

## 📱 Quick Start (5 Minutes)

### Prerequisites Check

```bash
# Check Node.js version (should be v16+)
node --version

# Check npm version
npm --version

# Check if Android SDK is installed (for Android development)
# Should output SDK location
echo $ANDROID_HOME  # Mac/Linux
echo %ANDROID_HOME%  # Windows
```

### Step 1: Install Dependencies

```bash
# Navigate to mobile directory
cd "d:\DCCB LOAN MANAGEMENT\mobile"

# Install npm packages
npm install

# For iOS (Mac only)
cd ios
pod install
cd ..
```

### Step 2: Configure Backend URL

**IMPORTANT**: You must update the API URL before running on a physical device.

1. Open `src/services/ApiService.js`
2. Find this line:
   ```javascript
   const API_BASE_URL = 'http://localhost:8001/api/v1';
   ```
3. Replace with your computer's IP address:
   ```javascript
   const API_BASE_URL = 'http://192.168.1.100:8001/api/v1';  // Use YOUR IP
   ```

**How to find your IP:**
- Windows: `ipconfig` (look for IPv4 Address)
- Mac/Linux: `ifconfig` or `ip addr show`

### Step 3: Start Backend Server

Ensure the backend is running on port 8001:

```bash
# In the project root directory
cd "d:\DCCB LOAN MANAGEMENT"

# Start backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

**Verify backend is accessible:**
- Open browser: `http://localhost:8001/docs`
- Should show FastAPI Swagger UI

### Step 4: Run the Mobile App

#### For Android:

```bash
# Terminal 1: Start Metro bundler
cd "d:\DCCB LOAN MANAGEMENT\mobile"
npm start

# Terminal 2: Run on Android
npm run android

# Or with React Native CLI
npx react-native run-android
```

#### For iOS (Mac only):

```bash
# Terminal 1: Start Metro bundler
cd mobile
npm start

# Terminal 2: Run on iOS
npm run ios

# Or with React Native CLI
npx react-native run-ios
```

### Step 5: Test the App

**Login with test account:**
- Email: `farmer1@test.com`
- Password: `test123`

## 🔧 Detailed Setup

### Environment Setup

#### Windows (Android Development)

1. **Install Android Studio**
   - Download from https://developer.android.com/studio
   - Install with default settings
   - Open Android Studio → SDK Manager
   - Install Android SDK Platform 33 (Android 13)

2. **Set Environment Variables**
   ```powershell
   # Add to System Environment Variables
   ANDROID_HOME=C:\Users\YourUsername\AppData\Local\Android\Sdk
   
   # Add to PATH
   %ANDROID_HOME%\platform-tools
   %ANDROID_HOME%\tools
   %ANDROID_HOME%\tools\bin
   ```

3. **Enable Developer Mode on Android Device**
   - Settings → About Phone → Tap "Build Number" 7 times
   - Settings → Developer Options → Enable USB Debugging

#### Mac (iOS Development)

1. **Install Xcode**
   - Download from Mac App Store
   - Install Command Line Tools:
     ```bash
     xcode-select --install
     ```

2. **Install CocoaPods**
   ```bash
   sudo gem install cocoapods
   ```

3. **iOS Simulator Setup**
   - Open Xcode
   - Xcode → Preferences → Components
   - Download iOS Simulator

### React Native CLI Setup

```bash
# Install React Native CLI globally
npm install -g react-native-cli

# Verify installation
react-native --version
```

## 📦 Package Installation Issues

### If `npm install` fails:

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json  # Mac/Linux
rmdir /s node_modules & del package-lock.json  # Windows

# Reinstall
npm install
```

### Common dependency issues:

**1. `@react-native-community/netinfo` not found:**
```bash
npm install @react-native-community/netinfo
```

**2. `@react-native-picker/picker` not found:**
```bash
npm install @react-native-picker/picker
```

**3. Native module linking (React Native < 0.60):**
```bash
npx react-native link
```

## 🔥 Firebase Setup (Push Notifications)

### Android Configuration

1. **Create Firebase Project**
   - Go to https://console.firebase.google.com
   - Click "Add Project"
   - Enter project name: "DCCB Loan Management"
   - Disable Google Analytics (optional)

2. **Add Android App**
   - Click "Add App" → Android icon
   - Package name: `com.dccbloanmobile` (from `android/app/build.gradle`)
   - Download `google-services.json`
   - Place in `android/app/` directory

3. **Update `android/build.gradle`**
   ```gradle
   buildscript {
       dependencies {
           classpath 'com.google.gms:google-services:4.3.15'
       }
   }
   ```

4. **Update `android/app/build.gradle`**
   ```gradle
   apply plugin: 'com.google.gms.google-services'
   ```

### iOS Configuration (Mac only)

1. **Add iOS App to Firebase**
   - Package name: Bundle ID from Xcode project
   - Download `GoogleService-Info.plist`

2. **Add to Xcode**
   - Open `ios/DCCBLoanMobile.xcworkspace`
   - Drag `GoogleService-Info.plist` into project root
   - Ensure "Copy items if needed" is checked

3. **Enable Push Notifications**
   - Xcode → Project → Signing & Capabilities
   - Click "+ Capability"
   - Add "Push Notifications"

## 🐛 Troubleshooting

### Build Errors

**Android: "SDK location not found"**
```bash
# Create local.properties in android/
echo "sdk.dir=C:\\Users\\YourUsername\\AppData\\Local\\Android\\Sdk" > android/local.properties
```

**Android: Gradle build failed**
```bash
cd android
./gradlew clean
cd ..
npm run android
```

**iOS: CocoaPods error**
```bash
cd ios
pod deintegrate
pod install
cd ..
```

### Runtime Errors

**"Network request failed"**
- Check backend is running on port 8001
- Verify API URL in `ApiService.js` uses correct IP
- Check firewall allows connections on port 8001

**"Unable to resolve module"**
```bash
npm start -- --reset-cache
```

**Metro bundler not starting**
```bash
# Kill existing Metro process
npx react-native start -- --reset-cache
```

### Device Connection Issues

**Android device not detected:**
```bash
adb devices  # Should list your device

# If not listed, restart ADB
adb kill-server
adb start-server
```

**iOS simulator not opening:**
```bash
# List available simulators
xcrun simctl list devices

# Boot specific simulator
xcrun simctl boot "iPhone 14"
```

## 🧪 Testing Features

### 1. Test Authentication
- Open app → Login with `farmer1@test.com` / `test123`
- Should redirect to Home screen
- Check AsyncStorage has `authToken` and `user`

### 2. Test Offline Mode
- Login and navigate to Loans screen
- Turn on Airplane mode
- Navigate around app (should show cached data)
- Turn off Airplane mode
- Check if queued requests sync

### 3. Test Push Notifications
- Ensure Firebase is configured
- Check device token is registered in backend
- Send test notification from Firebase Console
- Should receive notification on device

### 4. Test Loan Application
- Navigate to Loans → Apply Loan
- Select loan type
- Enter amount and tenure
- See calculated EMI
- Upload documents (camera/gallery)
- Submit application

## 📱 Building for Release

### Android Release APK

1. **Generate Keystore**
   ```bash
   cd android/app
   keytool -genkeypair -v -storetype PKCS12 -keystore dccb-release-key.keystore -alias dccb-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Configure Signing** (`android/gradle.properties`)
   ```properties
   MYAPP_RELEASE_STORE_FILE=dccb-release-key.keystore
   MYAPP_RELEASE_KEY_ALIAS=dccb-key-alias
   MYAPP_RELEASE_STORE_PASSWORD=your_password
   MYAPP_RELEASE_KEY_PASSWORD=your_password
   ```

3. **Build Release APK**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

4. **APK Location:**
   `android/app/build/outputs/apk/release/app-release.apk`

### iOS Release (Mac only)

1. Open `ios/DCCBLoanMobile.xcworkspace` in Xcode
2. Select "Any iOS Device (arm64)" as target
3. Product → Archive
4. Window → Organizer
5. Distribute App → App Store Connect or Ad Hoc

## 🎯 Performance Optimization

### 1. Enable Hermes (JavaScript Engine)
Already enabled in `android/app/build.gradle`:
```gradle
enableHermes: true
```

### 2. Reduce APK Size
```bash
# Enable ProGuard
android {
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
        }
    }
}
```

### 3. Image Optimization
- Use WebP format for images
- Compress images before including
- Use appropriate image sizes

## 📊 Monitoring and Debugging

### React Native Debugger

1. **Install React Native Debugger**
   ```bash
   # Windows/Mac
   # Download from: https://github.com/jhen0409/react-native-debugger/releases
   ```

2. **Enable Debug Mode**
   - Shake device or press `Cmd+D` (iOS) / `Cmd+M` (Android)
   - Select "Debug"

### Flipper (Meta's Debugging Tool)

1. **Install Flipper**
   - Download from https://fbflipper.com

2. **Connect Device**
   - Open Flipper
   - Run app with `npm run android` or `npm run ios`
   - Device should auto-connect

### Logging

```javascript
// Console logs
console.log('Debug:', data);
console.error('Error:', error);

// React Native Log Box
LogBox.ignoreAllLogs();  // Disable in production

// Custom logger
import { logger } from './utils/logger';
logger.info('User logged in', { userId: user.id });
```

## 🔐 Security Checklist

- [ ] API URL uses HTTPS in production
- [ ] JWT tokens stored securely
- [ ] Sensitive data not logged
- [ ] ProGuard/R8 enabled for Android release
- [ ] Code obfuscation enabled
- [ ] Network security config for Android
- [ ] App Transport Security for iOS

## 📚 Additional Resources

- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [React Navigation](https://reactnavigation.org/docs/getting-started)
- [Firebase Cloud Messaging](https://rnfirebase.io/messaging/usage)
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)

## 💡 Pro Tips

1. **Use React Native Debugger** for better debugging experience
2. **Enable Fast Refresh** for instant code updates
3. **Use Flipper** for network inspection and AsyncStorage viewing
4. **Keep dependencies updated** but test thoroughly
5. **Use TypeScript** for better type safety (future enhancement)
6. **Write tests** using Jest and React Native Testing Library

## 🎉 Success Checklist

- [ ] Backend running on port 8001
- [ ] Mobile dependencies installed
- [ ] API URL configured correctly
- [ ] Android/iOS emulator or device connected
- [ ] App builds without errors
- [ ] Can login with test credentials
- [ ] Dashboard loads with data
- [ ] Can navigate between screens
- [ ] Offline mode works
- [ ] Push notifications configured (optional)

---

**Need help?** Check the main README.md or contact the development team.
