# 📋 DEPLOYMENT QUICK REFERENCE CARD

## 🎯 **START HERE: Choose Your Deployment Path**

### Path 1: Quick Demo Deploy (Local Network)
**Time:** 10 minutes  
**For:** Testing with team on local network  
**Steps:**
1. `cd mobile && npm start`
2. Scan QR code with Expo Go app
3. Access web at `http://localhost:5173`

### Path 2: Full Production Deploy (Internet Access)
**Time:** 30-60 minutes  
**For:** Public deployment with domain  
**Steps:** See below ⬇️

---

## 🚀 **PRODUCTION DEPLOYMENT (Step-by-Step)**

### ✅ Pre-Deployment (5 mins)
```bash
# 1. Run build script
Windows: build-production.bat
Linux/Mac: ./build-production.sh

# 2. Edit production config
Edit: .env.production
Edit: frontend/.env.production  
Edit: mobile/src/services/apiService.js
```

**Critical Changes in `.env.production`:**
- ✏️ `SECRET_KEY` - Generate new: `python -c "from secrets import token_urlsafe; print(token_urlsafe(32))"`
- ✏️ `DATABASE_URL` - Your production database
- ✏️ `BACKEND_CORS_ORIGINS` - Your domain: `["https://yourdomain.com"]`

### 🖥️ Backend Deploy (10 mins)

**Docker (Easiest):**
```bash
# On server
docker-compose --env-file .env.production up -d
docker-compose exec backend alembic upgrade head
docker-compose exec backend python scripts/seed_data.py
```

**Traditional:**
```bash
# On server
source venv/bin/activate
alembic upgrade head
sudo systemctl start dccb-backend
```

### 🌐 Frontend Deploy (10 mins)
```bash
# 1. Build done by script (frontend/dist folder)

# 2. Upload to server
scp -r frontend/dist/* user@server:/var/www/dccb-loan/

# 3. Configure Nginx (copy from DEPLOYMENT_COMPLETE_GUIDE.md)
sudo nano /etc/nginx/sites-available/dccb-loan
sudo systemctl restart nginx

# 4. Install SSL
sudo certbot --nginx -d yourdomain.com
```

### 📱 Mobile App Build (15 mins)

**EAS Build (No Android Studio needed):**
```bash
cd mobile
npm install -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview
# Wait 10-20 mins, download APK from link
```

**Local Build (Requires Android Studio):**
```bash
cd mobile
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/app-release.apk
```

---

## 📝 **IMPORTANT FILES TO EDIT**

| File | What to Change | Example |
|------|---------------|---------|
| `.env.production` | `SECRET_KEY` | `GKAUQiSuMPq-Bh8zmNYVt...` |
| `.env.production` | `DATABASE_URL` | `postgresql+asyncpg://user:pass@host:5432/db` |
| `.env.production` | `BACKEND_CORS_ORIGINS` | `["https://yourdomain.com"]` |
| `frontend/.env.production` | `VITE_API_BASE_URL` | `https://api.yourdomain.com/api/v1` |
| `mobile/src/services/apiService.js` | Line 9 production URL | `https://api.yourdomain.com/api/v1` |

---

## 🧪 **POST-DEPLOYMENT TESTS**

### Backend Test
```bash
# Health check
curl https://api.yourdomain.com/health

# Login test
curl -X POST https://api.yourdomain.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Frontend Test
- ✅ Visit https://yourdomain.com
- ✅ Login with admin/admin123
- ✅ Create test loan
- ✅ Check all pages load

### Mobile Test
- ✅ Install APK on phone
- ✅ Login successful
- ✅ Can view loans
- ✅ Camera/upload works

---

## 🔑 **DEFAULT CREDENTIALS**

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Staff | `staff1` | `password123` |
| Farmer | `farmer1` | `password123` |

⚠️ **CHANGE ADMIN PASSWORD IMMEDIATELY AFTER FIRST LOGIN!**

---

## 🆘 **QUICK TROUBLESHOOTING**

### Backend Not Starting
```bash
# Docker
docker-compose logs backend
docker-compose restart backend

# Traditional
sudo systemctl status dccb-backend
sudo journalctl -u dccb-backend -f
```

### Frontend API Errors
1. Check `VITE_API_BASE_URL` in `frontend/.env.production`
2. Check CORS in backend `.env.production`
3. Test API: `curl https://api.yourdomain.com/health`

### Mobile Can't Connect
1. Update API_BASE_URL in `mobile/src/services/apiService.js`
2. Rebuild APK
3. Check backend CORS allows requests

### Database Errors
```bash
# Retry migrations
docker-compose exec backend alembic upgrade head

# Check connection
docker-compose exec backend python -c "from app.db.session import engine; print(engine.url)"
```

---

## 📦 **SERVER REQUIREMENTS**

**Minimum:**
- CPU: 2 cores
- RAM: 4GB
- Storage: 50GB SSD
- OS: Ubuntu 20.04+

**Recommended:**
- CPU: 4 cores
- RAM: 8GB
- Storage: 100GB SSD

---

## 🌍 **PRODUCTION URLs**

After deployment, your app will be at:
- **Frontend:** https://yourdomain.com
- **Backend API:** https://api.yourdomain.com/api/v1
- **Admin Dashboard:** https://yourdomain.com/admin
- **API Docs:** https://api.yourdomain.com/docs (disable in production!)

---

## 📚 **DOCUMENTATION**

| Guide | Purpose |
|-------|---------|
| `DEPLOY_NOW.md` | Quick 30-min deployment |
| `DEPLOYMENT_COMPLETE_GUIDE.md` | Full detailed instructions |
| `PRODUCTION_CHECKLIST.md` | Pre-deployment checklist |
| `QUICKSTART.md` | Development setup |

---

## 🎉 **YOU'RE READY TO DEPLOY!**

1. ✅ Run `build-production.bat` (Windows) or `./build-production.sh` (Linux)
2. ✅ Edit `.env.production` with production values
3. ✅ Deploy backend with Docker
4. ✅ Upload frontend dist folder
5. ✅ Build mobile APK with EAS
6. ✅ Test everything
7. ✅ Change admin password
8. ✅ Go live! 🚀

**Need help?** See `DEPLOYMENT_COMPLETE_GUIDE.md` for detailed instructions.

---

**Last Updated:** December 10, 2025  
**Version:** 2.0.0
