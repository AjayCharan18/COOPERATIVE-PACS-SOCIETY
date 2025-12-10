# 🚀 MOBILE APP QUICK START

**5-Minute Setup Guide for DCCB Loan Management Mobile App**

---

## ⚡ Prerequisites

- Node.js installed (v16+)
- Android Studio (for Android) OR Xcode (for iOS - Mac only)
- Backend running on port 8001

---

## 📦 Installation (2 minutes)

```bash
# 1. Navigate to mobile directory
cd "d:\DCCB LOAN MANAGEMENT\mobile"

# 2. Install dependencies
npm install
```

---

## ⚙️ Configuration (1 minute)

### Step 1: Find Your Computer's IP Address

**Windows:**
```powershell
ipconfig
# Look for: IPv4 Address (e.g., 192.168.1.100)
```

**Mac/Linux:**
```bash
ifconfig
# Look for: inet (e.g., 192.168.1.100)
```

### Step 2: Update API URL

Open: `src/services/ApiService.js`

Change line 6:
```javascript
// From:
const API_BASE_URL = 'http://localhost:8001/api/v1';

// To (use YOUR IP):
const API_BASE_URL = 'http://192.168.1.100:8001/api/v1';
```

---

## 🏃 Running (2 minutes)

### Start Backend First

```bash
# In project root directory
cd "d:\DCCB LOAN MANAGEMENT"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

Verify backend: Open http://localhost:8001/docs

### Run Mobile App

**Android:**
```bash
# Terminal 1: Start Metro bundler
cd "d:\DCCB LOAN MANAGEMENT\mobile"
npm start

# Terminal 2: Run on Android (in new terminal)
npm run android
```

**iOS (Mac only):**
```bash
# Terminal 1: Metro bundler
npm start

# Terminal 2: Run on iOS
npm run ios
```

---

## 🔑 Test Login

**Farmer Account:**
```
Email: farmer1@test.com
Password: test123
```

**Admin Account:**
```
Email: adiajay12367@gmail.com
Password: Ajay12367@
```

---

## 📱 Test Features

After login, you can:

1. ✅ View dashboard with loan stats
2. ✅ See recent loans
3. ✅ Apply for new loan
4. ✅ View loan details and EMI schedule
5. ✅ Check payment history
6. ✅ View/edit profile

---

## 🐛 Quick Troubleshooting

### "Cannot connect to server"
```bash
# Check backend is running
curl http://localhost:8001/api/v1/auth/me

# Restart backend if needed
```

### "Metro bundler not starting"
```bash
# Clear cache and restart
npm start -- --reset-cache
```

### "Build failed"
```bash
# Android: Clean build
cd android
./gradlew clean
cd ..
npm run android

# iOS: Reinstall pods
cd ios
pod install
cd ..
npm run ios
```

### "Device not detected"
```bash
# Android: Check device
adb devices

# Should show your device
# If not, reconnect USB and enable USB debugging
```

---

## 📂 Project Structure

```
mobile/
├── App.js                          # Root component
├── src/
│   ├── navigation/                 # Navigation setup
│   ├── screens/                    # All screens
│   │   ├── auth/                   # Login, Register
│   │   └── main/                   # Dashboard, Loans, etc.
│   ├── services/                   # API, Offline, Notifications
│   ├── context/                    # Auth context
│   └── utils/                      # Formatters
├── package.json                    # Dependencies
└── README.md                       # Full documentation
```

---

## 🔥 Key Features

### 🌐 Offline Mode
- Works without internet
- Caches data automatically
- Syncs when online

### 🔔 Push Notifications
- Firebase integration ready
- Background/foreground support

### 📷 Document Upload
- Camera, gallery, file picker
- Multiple files supported

### 💰 EMI Calculator
- Real-time calculation
- Loan type validation

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| **README.md** | Complete feature guide |
| **SETUP_GUIDE.md** | Detailed installation |
| **MOBILE_DEVELOPMENT_COMPLETE.md** | Technical details |
| **MOBILE_SUMMARY.md** | Completion overview |
| **QUICK_START.md** | This file |

---

## ⚠️ Common Mistakes

❌ **Using `localhost` instead of IP address**
- Mobile devices can't access `localhost`
- Always use computer's IP: `192.168.x.x`

❌ **Backend not running**
- Must run backend BEFORE mobile app
- Check: http://localhost:8001/docs

❌ **Wrong port**
- Backend: port 8001 (NOT 8000)
- Frontend: port 5173
- Mobile: connects to 8001

❌ **Firewall blocking**
- Allow port 8001 in firewall
- Disable antivirus temporarily for testing

---

## ✅ Success Checklist

- [ ] Node.js installed
- [ ] Dependencies installed (`npm install`)
- [ ] API URL configured with your IP
- [ ] Backend running on port 8001
- [ ] Mobile device/emulator connected
- [ ] App builds and runs
- [ ] Can login successfully
- [ ] Dashboard shows data

---

## 🎯 What's Next?

### For Testing
1. Test all features manually
2. Try offline mode (Airplane mode)
3. Test on multiple devices
4. Verify all API calls

### For Production
1. Configure Firebase (push notifications)
2. Update to production API URL
3. Build release APK/IPA
4. Submit to app stores

---

## 📞 Need Help?

1. Check **SETUP_GUIDE.md** for detailed instructions
2. Check **README.md** for feature documentation
3. Review error messages carefully
4. Restart backend and mobile app

---

## 🎉 You're Ready!

If you can:
- ✅ See the login screen
- ✅ Login successfully
- ✅ View the dashboard

**Congratulations! Your mobile app is working!** 🎊

Now explore all features and test thoroughly.

---

**Version 2.0.0 | December 2025**  
**Built with React Native**
