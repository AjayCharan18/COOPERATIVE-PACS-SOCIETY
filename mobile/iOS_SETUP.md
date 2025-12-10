# iOS Setup Guide - DCCB Loan Management

## ✅ TUNNEL MODE ACTIVATED - iOS Optimized!

### Current Status:
🟢 **Expo running in TUNNEL mode**
- URL: `exp://mwwevae-anonymous-8081.exp.direct`
- This URL works from ANY network (not just local WiFi)
- Perfect for iOS devices!

---

## How to Connect on iPhone/iPad

### Method 1: Use Expo Go App (RECOMMENDED for iOS)

**Step-by-Step:**

1. **Download Expo Go**
   - Open App Store on your iPhone
   - Search for "Expo Go"
   - Install the app (it's free)

2. **Open Expo Go**
   - Launch the Expo Go app
   - You'll see a screen with "Projects" and "Profile"

3. **Scan QR Code**
   - Tap "Scan QR Code" button in Expo Go app
   - Point camera at the QR code in your terminal
   - The QR code is the large square shown above the text:
     `› Metro waiting on exp://mwwevae-anonymous-8081.exp.direct`

4. **Wait for App to Load**
   - You'll see "Building JavaScript bundle"
   - First load takes 30-60 seconds
   - App will open automatically when ready

### Method 2: Manual URL Entry (if QR scan fails)

1. **Open Expo Go app**
2. **Tap "Enter URL manually"** (at the bottom)
3. **Type:** `exp://mwwevae-anonymous-8081.exp.direct`
4. **Tap "Connect"**

### Method 3: iPhone Camera App

⚠️ **Note:** iPhone Camera app may show "No useful data found" because it doesn't recognize `exp://` URLs

**If this happens:**
- Use Method 1 (Expo Go app) instead
- Camera app works better after the app is installed as a standalone build

---

## Why Tunnel Mode?

### Local Network Mode (exp://192.168.0.106:8081):
- ❌ Only works on same WiFi
- ❌ iPhone Camera may not recognize it
- ❌ Firewall issues

### Tunnel Mode (exp://mwwevae-anonymous-8081.exp.direct):
- ✅ Works from ANY network
- ✅ Expo Go app recognizes it perfectly
- ✅ No firewall issues
- ✅ Better iOS compatibility

---

## Expected Behavior

### After Scanning:

1. **Expo Go Opens:**
   ```
   Opening project...
   Building JavaScript bundle...
   [===>    ] 45%
   ```

2. **App Loads:**
   - You see a green screen
   - "DCCB Loan Management" title
   - "App Loaded Successfully! 🎉"
   - A counter button

3. **Success!** If you see this, everything is working!

---

## Troubleshooting iOS Scanning

### Issue: "No useful data found" when scanning with Camera app

**Solution:**
- Don't use Camera app for Expo URLs
- Open Expo Go app instead
- Use "Scan QR Code" button inside Expo Go

### Issue: QR code won't scan in Expo Go

**Solution:**
```
Manual URL entry in Expo Go:
exp://mwwevae-anonymous-8081.exp.direct
```

### Issue: "Something went wrong" in Expo Go

**Solution:**
1. Close Expo Go completely (swipe up)
2. Reopen Expo Go
3. Scan QR code again
4. Or try manual URL entry

### Issue: App loads but shows error screen

**Check terminal output for errors:**
- Look in the PowerShell terminal where Expo is running
- Errors will appear after "Opening on [Device Name]"
- Share the error message if you see one

---

## Switch Between Local and Tunnel Mode

### Current Mode: TUNNEL ✅
```powershell
cd "D:\DCCB LOAN MANAGEMENT\mobile"
npx expo start --tunnel
```

### Switch to Local Network Mode:
```powershell
cd "D:\DCCB LOAN MANAGEMENT\mobile"
npx expo start
# URL will be: exp://192.168.0.106:8081
```

### Switch to Localhost Only:
```powershell
cd "D:\DCCB LOAN MANAGEMENT\mobile"
npx expo start --localhost
# Only works on PC, not on phone
```

---

## iOS Permissions

When you run the app, it may ask for permissions:

### Camera Permission:
```
"This app uses the camera to scan documents and capture loan-related photos."
```
- Tap "Allow" to enable document scanning

### Photos Permission:
```
"This app needs access to your photo library to upload loan documents."
```
- Tap "Allow" to upload documents

### Location Permission:
```
"This app uses your location to provide branch information and services."
```
- Tap "Allow While Using App" for branch finder

---

## Full App vs Test App

### Currently Running: Simple Test App ✅
- Green success screen
- Counter button
- Minimal features
- Just to verify Expo works

### To Restore Full App:
```powershell
cd "D:\DCCB LOAN MANAGEMENT\mobile"
Copy-Item App.full.js App.js -Force
npx expo start --tunnel
```

Then scan QR code again - you'll see:
- Login screen
- Email & password fields
- Register link
- Full navigation

---

## Test Credentials

Once full app is restored:

```
Email: farmer1@test.com
Password: test123
```

---

## iOS Specific Features

### iOS 15.1+ Required:
- App configured for iOS 15.1 minimum
- Works on iPhone 6s and newer
- iPad support enabled

### Native iOS Components:
- ✅ Safe area support (notch, home indicator)
- ✅ iOS-style navigation
- ✅ Native alerts and modals
- ✅ iOS haptic feedback

### Dark Mode:
- Currently set to light mode only
- Can be changed in app.json:
  ```json
  "userInterfaceStyle": "automatic"
  ```

---

## Performance on iOS

### First Load:
- 30-60 seconds to build bundle
- Download size: ~2-3 MB
- Caches locally after first load

### Subsequent Loads:
- 5-10 seconds
- Uses cached bundle
- Only downloads updates

### Hot Reload:
- Make code changes on PC
- Press `r` in terminal
- App reloads on iPhone instantly!

---

## Building Standalone iOS App

### Requirements:
- Mac computer with Xcode
- Apple Developer account ($99/year)
- Or use Expo EAS Build (easier)

### Using Expo EAS Build:
```powershell
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Build for TestFlight
eas build --platform ios --profile production
```

### Result:
- IPA file for App Store
- Can distribute via TestFlight
- No Mac required!

---

## Quick Reference

### Scan QR Code:
1. Open Expo Go on iPhone
2. Tap "Scan QR Code"
3. Scan the QR in terminal
4. Wait for app to load

### Manual Connection:
```
URL: exp://mwwevae-anonymous-8081.exp.direct
Enter in Expo Go app
```

### Reload App:
- Shake iPhone
- Tap "Reload"
- Or press `r` in terminal

### Dev Menu:
- Shake iPhone
- Or press `m` in terminal
- Shows debug options

### Close App:
- Swipe up (like any iOS app)
- Doesn't stop Expo server

---

## Common iOS Issues & Solutions

### App Crashes Immediately:
**Check terminal for:**
- "Unable to resolve module" → Missing dependency
- "Invariant Violation" → Navigation error
- "Network error" → Backend not accessible

### White Screen:
```powershell
# Clear cache and restart
npx expo start --tunnel --clear
```

### Slow Performance:
- First load is always slow (building bundle)
- Enable "Fast Refresh" in dev menu
- Build production version for best performance

### Can't Connect:
1. Check Expo Go is latest version
2. Try manual URL entry
3. Restart Expo server
4. Reinstall Expo Go if needed

---

## Current Configuration

### Tunnel URL:
```
exp://mwwevae-anonymous-8081.exp.direct
```

### Backend API:
```
http://192.168.0.106:8001/api/v1
```

### Bundle Identifier:
```
com.dccb.loanmobile
```

### iOS Deployment Target:
```
15.1
```

---

## Success Checklist

- [ ] Expo Go installed on iPhone
- [ ] QR code scanned in Expo Go app (not Camera app)
- [ ] App loaded with green success screen
- [ ] Counter button works
- [ ] No error screens

**If all checked:** Everything is working! Ready to restore full app.

---

## Next Steps

1. **Test simple app** (currently running)
2. **Verify counter works** (click button)
3. **Restore full app** (Copy-Item command above)
4. **Login with test credentials**
5. **Test all features**

---

**Current Status: 🟢 TUNNEL MODE ACTIVE - SCAN QR CODE IN EXPO GO APP NOW!**

The URL `exp://mwwevae-anonymous-8081.exp.direct` is a public URL that works from anywhere!
