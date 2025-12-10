# DCCB Loan Management Mobile App

React Native mobile application for farmers to manage loans, make payments, and track EMI schedules.

## 📱 Features

### ✅ Core Features
- **Authentication**: Login/Register with JWT token-based auth
- **Dashboard**: View loan statistics, recent loans, quick actions
- **Loan Management**: 
  - View all loans (filter by status)
  - Apply for new loans with document upload
  - View loan details and EMI schedule
- **Payments**: View payment history
- **Profile Management**: User profile, app settings, cache management

### 🚀 Advanced Features
- **Offline Mode**: Work without internet, sync when online
  - Cached data for offline viewing
  - Request queuing for offline mutations
  - Automatic sync when connection restored
- **Push Notifications**: Firebase Cloud Messaging integration
  - Loan approval notifications
  - EMI due date reminders
  - Payment confirmations
- **Document Upload**: Camera, gallery, and file picker support
- **Real-time Updates**: Auto-refresh with pull-to-refresh

## 🛠️ Technology Stack

- **React Native** 0.72.6
- **React Navigation** 6.x (Stack + Bottom Tabs)
- **AsyncStorage** for offline data
- **Axios** for API calls
- **Firebase** (Cloud Messaging for push notifications)
- **React Native Vector Icons** (Material Icons)
- **React Native Image Picker** for photo uploads
- **React Native Document Picker** for file uploads

## 📋 Prerequisites

Before you begin, ensure you have:

1. **Node.js** (v16 or higher)
2. **npm** or **yarn**
3. **React Native development environment**:
   - For Android: Android Studio + Android SDK
   - For iOS: Xcode (Mac only)
4. **Backend API** running on `http://localhost:8001`

## 🚀 Installation

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Configure API Base URL

Edit `src/services/ApiService.js` and update the API URL:

```javascript
const API_BASE_URL = 'http://YOUR_IP:8001/api/v1';  // Replace YOUR_IP with your computer's IP
```

**Important**: Use your computer's local IP address (e.g., `http://192.168.1.100:8001`) instead of `localhost` for testing on physical devices.

### 3. Firebase Setup (Optional - for Push Notifications)

#### Android:
1. Create a Firebase project at https://console.firebase.google.com
2. Add an Android app to your Firebase project
3. Download `google-services.json` and place it in `android/app/`
4. Follow Firebase setup instructions for React Native

#### iOS:
1. Add an iOS app to your Firebase project
2. Download `GoogleService-Info.plist` and add it to your Xcode project
3. Follow Firebase setup instructions for React Native

### 4. Android Setup

```bash
# Link assets (for custom fonts/icons if any)
npx react-native link

# Install Pods (iOS only)
cd ios && pod install && cd ..
```

## 🏃 Running the App

### Android

```bash
# Start Metro bundler
npm start

# In another terminal, run Android
npm run android

# Or using React Native CLI
npx react-native run-android
```

### iOS (Mac only)

```bash
# Install CocoaPods dependencies
cd ios && pod install && cd ..

# Run iOS
npm run ios

# Or using React Native CLI
npx react-native run-ios
```

## 🧪 Testing

### Test Credentials

Use these credentials to test the app:

**Farmer Account:**
- Email: `farmer1@test.com`
- Password: `test123`

**Admin Account:**
- Email: `adiajay12367@gmail.com`
- Password: `Ajay12367@`

## 📱 App Structure

```
mobile/
├── src/
│   ├── navigation/        # Navigation configuration
│   │   ├── AppNavigator.js       # Main app navigator
│   │   ├── AuthNavigator.js      # Auth screens navigation
│   │   └── MainNavigator.js      # Main app tabs navigation
│   ├── screens/           # Screen components
│   │   ├── auth/
│   │   │   ├── LoginScreen.js
│   │   │   └── RegisterScreen.js
│   │   ├── main/
│   │   │   ├── HomeScreen.js
│   │   │   ├── LoansScreen.js
│   │   │   ├── LoanDetailScreen.js
│   │   │   ├── ApplyLoanScreen.js
│   │   │   ├── PaymentsScreen.js
│   │   │   └── ProfileScreen.js
│   │   └── SplashScreen.js
│   ├── context/           # React Context (Auth)
│   │   └── AuthContext.js
│   ├── services/          # API and services
│   │   ├── ApiService.js         # API client with offline support
│   │   ├── OfflineManager.js     # Offline data caching & sync
│   │   └── NotificationService.js # Push notifications
│   ├── components/        # Reusable components (future)
│   └── utils/             # Utility functions
│       └── formatters.js         # Currency, date formatters
├── android/               # Android native code
├── ios/                   # iOS native code
├── App.js                 # Root component
├── index.js               # Entry point
├── package.json
└── README.md
```

## 🔑 Key Features Explained

### 1. Authentication Flow
- JWT token-based authentication
- Token stored in AsyncStorage for persistence
- Auto-login on app restart if token exists

### 2. Offline Mode
- **Data Caching**: GET requests cached with 24-hour expiry
- **Request Queue**: POST/PUT/DELETE requests queued when offline
- **Auto Sync**: Queued requests processed when connection restored
- **Cache Management**: Clear cache from Profile screen

### 3. Navigation
- **Auth Stack**: Login → Register
- **Main Tabs**: Home | Loans | Payments | Profile
- **Loans Stack**: Loans List → Loan Detail | Apply Loan

### 4. Loan Application
- Select loan type (auto-load interest rate, limits)
- Enter amount and tenure
- Calculate EMI in real-time
- Upload documents (camera/gallery/files)
- Form validation
- Submit application

### 5. Push Notifications
- Device token registration on app start
- Background notification handling
- Foreground notification display
- Local notification support

## 🎨 UI Components

### Screens
1. **Splash Screen**: App loading
2. **Login Screen**: User authentication
3. **Register Screen**: New user registration
4. **Home Screen**: Dashboard with stats and quick actions
5. **Loans Screen**: List all loans with filters
6. **Loan Detail Screen**: Detailed loan info + EMI schedule
7. **Apply Loan Screen**: Loan application form
8. **Payments Screen**: Payment history
9. **Profile Screen**: User profile and settings

### UI Features
- Material Design icons
- Pull-to-refresh on lists
- Loading states
- Empty states
- Form validation
- Error handling with alerts

## 🔧 Configuration

### API Endpoints Used

```javascript
// Auth
POST /api/v1/auth/login
POST /api/v1/auth/register
GET  /api/v1/auth/me

// Dashboard
GET  /api/v1/dashboard/stats

// Loans
GET  /api/v1/loans/my-loans
GET  /api/v1/loans/:id
GET  /api/v1/loans/:id/emi-schedule
POST /api/v1/loans/apply
GET  /api/v1/loans/types

// Payments
GET  /api/v1/payments/my-payments
POST /api/v1/payments/create

// Notifications
POST /api/v1/notifications/register-device
```

## 📝 Development Notes

### Offline Storage Keys
- `authToken`: JWT authentication token
- `user`: User profile data
- `cache_*`: Cached API responses
- `offline_queue`: Pending requests
- `deviceId`: Device identifier
- `fcmToken`: Firebase Cloud Messaging token

### Network Detection
- Uses `@react-native-community/netinfo`
- Monitors connection state changes
- Auto-processes queue when online

### Data Caching Strategy
- Cache GET requests automatically
- 24-hour cache expiry
- Return cached data when offline
- Clear cache from Profile screen

## 🐛 Troubleshooting

### Common Issues

**1. Cannot connect to backend**
- Ensure backend is running on port 8001
- Use computer's IP address instead of `localhost` for physical devices
- Check firewall settings

**2. Push notifications not working**
- Verify Firebase configuration
- Check `google-services.json` (Android) or `GoogleService-Info.plist` (iOS)
- Request notification permissions

**3. Build errors**
- Clear cache: `npm start -- --reset-cache`
- Clean Android: `cd android && ./gradlew clean && cd ..`
- Clean iOS: `cd ios && pod install && cd ..`

**4. Metro bundler issues**
- Kill existing Metro: `npx react-native start -- --reset-cache`
- Delete `node_modules` and reinstall

## 📦 Building for Production

### Android APK

```bash
cd android
./gradlew assembleRelease

# APK location: android/app/build/outputs/apk/release/app-release.apk
```

### Android Bundle (for Play Store)

```bash
cd android
./gradlew bundleRelease

# Bundle location: android/app/build/outputs/bundle/release/app-release.aab
```

### iOS (Mac only)

1. Open `ios/DCCBLoanMobile.xcworkspace` in Xcode
2. Select target device or Generic iOS Device
3. Product → Archive
4. Distribute to App Store or TestFlight

## 🔐 Security Considerations

- JWT tokens stored securely in AsyncStorage
- HTTPS required for production
- Sensitive data not logged
- Token refresh on expiry
- Secure API communication

## 🚀 Future Enhancements

- [ ] Biometric authentication (Face ID / Fingerprint)
- [ ] Dark mode support
- [ ] Multi-language support
- [ ] In-app payment gateway integration
- [ ] Chat support
- [ ] Document preview
- [ ] EMI payment from mobile
- [ ] Loan calculator
- [ ] Transaction receipts

## 📄 License

Copyright © 2025 COOPERATIVE PACS Loan Management System

## 👥 Support

For issues or questions, contact the development team.

## 🔗 Related Documentation

- [Backend API Documentation](../API_REFERENCE.md)
- [Visual Architecture](../VISUAL_ARCHITECTURE.md)
- [Project Overview](../PROJECT_COMPLETE_OVERVIEW.md)
