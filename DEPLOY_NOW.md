# 🚀 Quick Deployment Steps - DCCB Loan Management

## ⚡ Fastest Way to Deploy (30 minutes)

### 1️⃣ Prepare Production Files (5 mins)

**Windows:**
```bash
# Run the build script
build-production.bat
```

**Linux/Mac:**
```bash
# Make script executable
chmod +x build-production.sh

# Run the build script
./build-production.sh
```

This will:
- ✅ Create `.env.production` file
- ✅ Install all dependencies
- ✅ Build frontend (creates `frontend/dist`)
- ✅ Configure mobile app for build

### 2️⃣ Configure Production Settings (10 mins)

**Edit `.env.production`:**
```env
# Change these CRITICAL values:
DATABASE_URL=postgresql+asyncpg://your-user:your-password@your-host:5432/dccb_production
SECRET_KEY=GENERATE_NEW_KEY_HERE  # Use: python -c "from secrets import token_urlsafe; print(token_urlsafe(32))"
BACKEND_CORS_ORIGINS=["https://yourdomain.com"]

# Keep your existing Gemini API key
GEMINI_API_KEY=AIzaSyDYv5Wrh4Fd2nBHbriJIaw7ftgPmyY5jKo
```

**Edit `frontend/.env.production`:**
```env
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
```

**Edit `mobile/src/services/apiService.js`:**
```javascript
const API_BASE_URL = __DEV__ 
  ? 'http://192.168.0.106:8001/api/v1'
  : 'https://api.yourdomain.com/api/v1';  // Change this to your production domain
```

### 3️⃣ Deploy Backend (5 mins)

**Option A: Using Docker (Easiest)**
```bash
# On your server
git clone <your-repo-url>
cd DCCB-LOAN-MANAGEMENT

# Copy your .env.production to .env
cp .env.production .env

# Start services
docker-compose up -d

# Run migrations
docker-compose exec backend alembic upgrade head

# Seed data
docker-compose exec backend python scripts/seed_data.py
```

**Option B: Traditional Server**
```bash
# Upload files to server
scp -r * user@your-server:/opt/dccb-loan/

# SSH to server and run
cd /opt/dccb-loan
source venv/bin/activate
alembic upgrade head
python scripts/seed_data.py

# Start with systemd (see DEPLOYMENT_COMPLETE_GUIDE.md)
sudo systemctl start dccb-backend
```

### 4️⃣ Deploy Frontend (5 mins)

```bash
# Upload built files to server
scp -r frontend/dist/* user@your-server:/var/www/dccb-loan/

# Configure Nginx (on server)
sudo nano /etc/nginx/sites-available/dccb-loan
# Copy config from DEPLOYMENT_COMPLETE_GUIDE.md

sudo ln -s /etc/nginx/sites-available/dccb-loan /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Install SSL
sudo certbot --nginx -d yourdomain.com
```

### 5️⃣ Build Mobile APK (5 mins setup + 15 mins build)

**Method 1: EAS Build (Recommended - No Android Studio needed)**
```bash
cd mobile

# Install EAS CLI
npm install -g eas-cli

# Login to Expo (create free account at expo.dev)
eas login

# Configure build
eas build:configure

# Build APK
eas build -p android --profile preview

# Wait 10-20 minutes, you'll get download link
```

**Method 2: Local Build (Requires Android Studio)**
```bash
cd mobile

# Generate Android project
npx expo prebuild --platform android

# Build APK
cd android
./gradlew assembleRelease

# APK: android/app/build/outputs/apk/release/app-release.apk
```

---

## 📦 What You Get After Deployment

1. **Backend API:** `https://api.yourdomain.com/api/v1`
2. **Frontend Web App:** `https://yourdomain.com`
3. **Mobile APK:** Download from EAS build or local build folder

---

## ✅ Testing Checklist

- [ ] Backend health check: `curl https://api.yourdomain.com/health`
- [ ] Frontend loads at `https://yourdomain.com`
- [ ] Can login with admin/admin123
- [ ] Mobile app connects to production API
- [ ] Can create loans from mobile app
- [ ] Documents upload successfully

---

## 🆘 Quick Troubleshooting

**Backend won't start:**
```bash
# Check logs
docker-compose logs backend
# or
sudo journalctl -u dccb-backend -f
```

**Frontend shows API errors:**
- Check `VITE_API_BASE_URL` in `frontend/.env.production`
- Verify CORS in backend `.env.production`
- Test API: `curl https://api.yourdomain.com/api/v1/health`

**Mobile app won't connect:**
- Update `API_BASE_URL` in `mobile/src/services/apiService.js`
- Rebuild APK after changes
- Check firewall allows port 443

**Database errors:**
```bash
# Check database connection
docker-compose exec backend python -c "from app.db.session import engine; print(engine.url)"

# Run migrations again
docker-compose exec backend alembic upgrade head
```

---

## 📞 Need Help?

1. See full guide: `DEPLOYMENT_COMPLETE_GUIDE.md`
2. Check troubleshooting section in guide
3. Review production checklist: `PRODUCTION_CHECKLIST.md`

---

## 🎉 Default Credentials

**Admin Account:**
- Username: `admin`
- Password: `admin123`
- ⚠️ **Change immediately after first login!**

**Test Farmer:**
- Username: `farmer1`
- Password: `password123`

---

**Deployment Date:** ____________
**Domain:** ____________
**Server IP:** ____________
