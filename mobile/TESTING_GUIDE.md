# Mobile App Testing Guide - iOS & Android

## Current Status: SIMPLE TEST APP RUNNING

### What's Running Now:
✅ **Simple Test App** - Minimal version to verify Expo works
- Located in: `App.js` (temporary)
- Full app backed up to: `App.full.js`

---

## Step 1: Test Simple App First

### Scan QR Code Now:
The terminal shows a QR code at: `exp://192.168.0.106:8081`

**What You Should See After Scanning:**
1. Expo Go opens
2. "Building JavaScript bundle" progress bar
3. A green screen with:
   - ✅ "DCCB Loan Management"
   - Status: "App Loaded Successfully! 🎉"
   - Backend URL shown
   - A counter button you can click

**If This Works:**
- ✅ Expo is configured correctly
- ✅ Network connection is good
- ✅ Ready to restore full app

**If This Doesn't Work:**
- Check you're on same WiFi as PC (192.168.0.106)
- Try manual URL in Expo Go: `exp://192.168.0.106:8081`
- Check terminal for error messages

---

## Step 2: Restore Full App (After Simple Test Works)

### To Restore Full App with Navigation:
```powershell
cd "D:\DCCB LOAN MANAGEMENT\mobile"
Copy-Item App.full.js App.js -Force
npx expo start --clear
```

Then scan QR code again - you'll see the full login screen.

---

## Troubleshooting Guide

### Issue: "No useful data found" when scanning

**Cause:** Package version mismatches or configuration errors

**Solutions Applied:**
1. ✅ Removed web support from platforms
2. ✅ Fixed entry point to use Expo's `registerRootComponent`
3. ✅ Updated Metro config for Expo
4. ✅ Fixed Babel preset to use `babel-preset-expo`
5. ✅ Set iOS deployment target to 15.1+
6. ✅ Created simple test app to verify basics work

### Issue: Package version warnings

**Current Warnings:**
```
react@18.2.0 - expected version: 19.1.0
react-native@0.72.6 - expected version: 0.81.5
```

**To Fix (Optional - do after confirming app works):**
```powershell
cd "D:\DCCB LOAN MANAGEMENT\mobile"
npx expo install --fix
```

⚠️ **Warning:** This will upgrade React and React Native to newer versions. Test thoroughly after upgrade.

### Issue: App crashes after loading

**Check Terminal Logs:**
Look for errors like:
- "Unable to resolve module" - missing dependency
- "ReferenceError" - code error
- "Network request failed" - backend not accessible

**Common Fixes:**
```powershell
# Clear all caches
npx expo start --clear

# Reinstall dependencies
rm -rf node_modules
npm install

# Reset Metro bundler
npx react-native start --reset-cache
```

---

## Network Troubleshooting

### Verify PC and Phone on Same Network:

**Check PC IP:**
```powershell
ipconfig | findstr "IPv4"
# Should show: 192.168.0.106
```

**Check from Phone:**
1. Open phone browser
2. Navigate to: `http://192.168.0.106:8001/docs`
3. Should see API documentation
4. If not accessible, devices aren't on same network

### Firewall Issues:

```powershell
# Allow Node.js through Windows Firewall
# Windows Security → Firewall → Allow an app
# Find Node.js → Check both Private and Public
```

### Alternative Connection Methods:

**Method 1: Tunnel Mode (if local network fails)**
```powershell
cd mobile
npx expo start --tunnel
```
- Uses ngrok to create public URL
- Works across different networks
- Slower but more reliable

**Method 2: USB Connection (Android only)**
```powershell
# Enable USB debugging on Android
# Connect via USB
adb reverse tcp:8081 tcp:8081
npx expo start
# Then press 'a' in terminal
```

---

## Platform-Specific Notes

### iOS (iPhone/iPad):

**Requirements:**
- iOS 15.1 or higher
- Expo Go from App Store
- Camera app for QR scanning

**Scanning:**
1. Open native Camera app
2. Point at QR code
3. Tap "Open in Expo Go" notification
4. App loads

**Permissions:**
- Camera (for document scanning)
- Photos (for uploading documents)
- Location (for finding branches)

### Android:

**Requirements:**
- Android 5.0+ (API 21+)
- Expo Go from Play Store
- Expo Go's built-in scanner

**Scanning:**
1. Open Expo Go app
2. Tap "Scan QR Code"
3. Scan the QR in terminal
4. App loads

**Permissions:**
- Camera
- Storage (read/write)
- Location (fine and coarse)
- Internet & Network state

---

## File Structure Reference

### Current Configuration:

```
mobile/
├── App.js              # Currently: Simple test app
├── App.full.js         # Backup: Full app with navigation
├── App.test.js         # Simple test app source
├── index.js            # Entry point (uses registerRootComponent)
├── app.json            # Expo configuration
├── babel.config.js     # Babel preset: expo
├── metro.config.js     # Metro config: expo
├── package.json        # Dependencies
└── src/
    ├── navigation/     # Navigation stack
    ├── screens/        # All app screens
    ├── components/     # Reusable components
    ├── context/        # Auth context
    ├── services/       # API services
    └── utils/          # Utilities
```

### Key Configuration Files:

**app.json:**
```json
{
  "expo": {
    "platforms": ["ios", "android"],  // No web!
    "ios": { "deploymentTarget": "15.1" },
    "android": { "package": "com.dccb.loanmobile" }
  }
}
```

**index.js:**
```javascript
import { registerRootComponent } from 'expo';
import App from './App';
registerRootComponent(App);
```

**babel.config.js:**
```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};
```

---

## Commands Reference

### Start Development Server:
```powershell
# Normal start
cd mobile
npx expo start

# Clear cache
npx expo start --clear

# Tunnel mode (different networks)
npx expo start --tunnel

# Localhost only
npx expo start --localhost
```

### Manage Apps:
```powershell
# Switch to simple test app
Copy-Item App.test.js App.js -Force
npx expo start --clear

# Switch to full app
Copy-Item App.full.js App.js -Force
npx expo start --clear
```

### Fix Package Issues:
```powershell
# Update packages to match Expo SDK
npx expo install --fix

# Clean install
rm -rf node_modules package-lock.json
npm install

# Check for issues
npm audit
```

### Terminal Shortcuts (when Expo is running):
- `r` - Reload app
- `m` - Toggle dev menu
- `c` - Clear Metro bundler cache
- `a` - Open on Android (if adb connected)
- `i` - Open on iOS simulator (Mac only)
- `?` - Show all commands

---

## Success Checklist

### ✅ Simple Test App Should Show:
- [x] Green screen with title
- [x] "App Loaded Successfully" message
- [x] Backend URL displayed
- [x] Counter button works
- [x] No error screens

### ✅ Full App Should Show:
- [x] Login screen appears
- [x] Register link works
- [x] Can type in email/password fields
- [x] Login button responds
- [x] After login: Dashboard appears
- [x] Bottom navigation works
- [x] Can view loans, payments, profile

---

## Next Steps After Successful Load

### 1. Test Simple App First
- Scan QR code
- Verify green screen loads
- Click counter button
- Confirm no errors

### 2. Restore Full App
```powershell
cd "D:\DCCB LOAN MANAGEMENT\mobile"
Copy-Item App.full.js App.js -Force
npx expo start --clear
```

### 3. Test Full App Features
- Login with: farmer1@test.com / test123
- Navigate all screens
- Test offline mode (airplane mode)
- Test push notifications

### 4. Optional: Update Packages
```powershell
# Only if everything works!
npx expo install --fix
npm audit fix
```

---

## Error Codes & Solutions

### Error: "Unable to resolve module"
**Solution:**
```powershell
npm install [missing-package]
npx expo start --clear
```

### Error: "Network request failed"
**Solution:**
- Check backend is running: `http://192.168.0.106:8001/docs`
- Verify devices on same WiFi
- Try tunnel mode: `npx expo start --tunnel`

### Error: "Something went wrong"
**Solution:**
```powershell
# Nuclear option - full reset
rm -rf node_modules package-lock.json
npm install
npx expo start --clear
```

### Error: "Invariant Violation"
**Solution:**
- Usually navigation or context error
- Check App.js code
- Verify all imports exist
- Clear cache and restart

---

## Current Status Summary

**What's Working:**
✅ Expo server running on port 8081
✅ QR code displayed
✅ Simple test app ready
✅ Configuration files fixed
✅ iOS & Android support configured
✅ Backend APIs tested (100% passing)

**What to Test:**
⏳ Scan QR code with simple app
⏳ Verify app loads on device
⏳ Restore full app
⏳ Test all features

**Known Issues:**
⚠️ Package version warnings (non-blocking)
⚠️ Full app may have navigation complexity

---

## Support Resources

### Test Credentials:
```
Email: farmer1@test.com
Password: test123
Role: farmer
```

### Backend API:
```
URL: http://192.168.0.106:8001
Docs: http://192.168.0.106:8001/docs
Status: Running (port 8001, PID 8372)
```

### Expo Server:
```
URL: exp://192.168.0.106:8081
Platform: iOS & Android
Mode: LAN (local network)
```

---

**Current Action: Scan the QR code with the simple test app. If you see the green success screen, we know Expo is working and can restore the full app!**
