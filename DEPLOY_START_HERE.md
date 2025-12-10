# 🚀 COOPERATIVE PACS - Deployment Guide (START HERE!)

**Date:** December 10, 2025  
**Status:** Ready to Deploy  
**Your Setup:** Supabase Database + Local Development

---

## 🎯 Choose Your Deployment Type

### Option 1: Quick Local Testing (5 minutes)
**Best for:** Testing with your team on local network  
**What you get:** Backend + Frontend + Mobile app on local network

### Option 2: Production Cloud Deployment (30-60 minutes)
**Best for:** Public deployment with domain and SSL  
**What you get:** Fully deployed system accessible from internet

---

## ⚡ OPTION 1: Quick Local Testing (Recommended First!)

### Step 1: Start Backend Server
```powershell
# Open Terminal 1
cd "D:\DCCB LOAN MANAGEMENT"
& "D:\DCCB LOAN MANAGEMENT\venv\Scripts\Activate.ps1"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

**✅ Backend running at:** `http://YOUR_IP:8001`

### Step 2: Start Frontend
```powershell
# Open Terminal 2
cd "D:\DCCB LOAN MANAGEMENT\frontend"
npm run dev
```

**✅ Frontend running at:** `http://localhost:5173`

### Step 3: Start Mobile App
```powershell
# Open Terminal 3
cd "D:\DCCB LOAN MANAGEMENT\mobile"
npx expo start
```

**✅ Scan QR code with Expo Go app on your phone**

### 🎉 You're Done! Test Everything:
- ✅ Login at `http://localhost:5173`
- ✅ Open mobile app and login
- ✅ Create a test loan
- ✅ Make a payment

---

## 🌐 OPTION 2: Production Cloud Deployment

### Prerequisites Checklist
- [ ] VPS/Cloud Server (DigitalOcean, AWS, Linode, etc.)
- [ ] Domain name (e.g., cooperativepacs.com)
- [ ] Server specs: 4GB RAM, 2 CPU cores minimum
- [ ] SSH access to server

---

### 🔧 Part A: Server Setup (15 mins)

#### 1. Connect to Your Server
```bash
ssh root@your-server-ip
```

#### 2. Install Dependencies
```bash
# Update system
apt update && apt upgrade -y

# Install essentials
apt install -y python3.11 python3.11-venv python3-pip nginx certbot python3-certbot-nginx git redis-server postgresql postgresql-contrib

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Configure firewall
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

#### 3. Upload Your Code
```powershell
# From your Windows machine
scp -r "D:\DCCB LOAN MANAGEMENT" root@your-server-ip:/opt/cooperative-pacs
```

Or clone from Git:
```bash
cd /opt
git clone https://github.com/AjayCharan18/COOPERATIVE-PACS.git cooperative-pacs
cd cooperative-pacs
```

---

### 🖥️ Part B: Backend Deployment (10 mins)

#### 1. Setup Python Environment
```bash
cd /opt/cooperative-pacs
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### 2. Create Production .env
```bash
nano .env.production
```

**Copy and edit this:**
```env
# Database (Your Supabase - already configured!)
DATABASE_URL=postgresql+asyncpg://postgres:Adiajay12367%40@db.bkyabkhczplwcsdgyjop.supabase.co:5432/postgres

# Security - GENERATE NEW SECRET KEY!
SECRET_KEY=YOUR_NEW_SECRET_KEY_HERE
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Environment
ENVIRONMENT=production
APP_NAME=COOPERATIVE PACS - Loan Automation System

# CORS - Your domain
BACKEND_CORS_ORIGINS=["https://cooperativepacs.com","https://www.cooperativepacs.com"]

# AI
GEMINI_API_KEY=AIzaSyDYv5Wrh4Fd2nBHbriJIaw7ftgPmyY5jKo

# Redis
REDIS_URL=redis://localhost:6379/0
```

**Generate new SECRET_KEY:**
```bash
python3 -c "from secrets import token_urlsafe; print(token_urlsafe(32))"
```

#### 3. Run Database Migrations
```bash
source venv/bin/activate
alembic upgrade head
python scripts/seed_data.py
python scripts/create_admin.py
```

#### 4. Create Systemd Service
```bash
nano /etc/systemd/system/cooperative-pacs.service
```

**Paste this:**
```ini
[Unit]
Description=COOPERATIVE PACS Backend
After=network.target redis.service

[Service]
Type=exec
User=www-data
Group=www-data
WorkingDirectory=/opt/cooperative-pacs
Environment="PATH=/opt/cooperative-pacs/venv/bin"
EnvironmentFile=/opt/cooperative-pacs/.env.production
ExecStart=/opt/cooperative-pacs/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### 5. Start Backend
```bash
chown -R www-data:www-data /opt/cooperative-pacs
systemctl daemon-reload
systemctl enable cooperative-pacs
systemctl start cooperative-pacs
systemctl status cooperative-pacs
```

---

### 🌐 Part C: Frontend Deployment (10 mins)

#### 1. Build Frontend
```bash
cd /opt/cooperative-pacs/frontend

# Create production env
cat > .env.production << EOF
VITE_API_BASE_URL=https://api.cooperativepacs.com/api/v1
VITE_APP_NAME=COOPERATIVE PACS
EOF

# Install and build
npm install
npm run build
```

#### 2. Setup Nginx for Frontend
```bash
nano /etc/nginx/sites-available/cooperative-pacs-frontend
```

**Paste this:**
```nginx
server {
    listen 80;
    server_name cooperativepacs.com www.cooperativepacs.com;

    root /opt/cooperative-pacs/frontend/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # React Router support
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### 3. Setup Nginx for Backend API
```bash
nano /etc/nginx/sites-available/cooperative-pacs-api
```

**Paste this:**
```nginx
server {
    listen 80;
    server_name api.cooperativepacs.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    client_max_body_size 50M;
}
```

#### 4. Enable Sites and Install SSL
```bash
# Enable sites
ln -s /etc/nginx/sites-available/cooperative-pacs-frontend /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/cooperative-pacs-api /etc/nginx/sites-enabled/

# Test and restart Nginx
nginx -t
systemctl restart nginx

# Install SSL certificates (FREE!)
certbot --nginx -d cooperativepacs.com -d www.cooperativepacs.com
certbot --nginx -d api.cooperativepacs.com
```

---

### 📱 Part D: Mobile App Build (15 mins)

#### Method 1: EAS Build (Cloud - Easiest)

**On your Windows machine:**
```powershell
cd "D:\DCCB LOAN MANAGEMENT\mobile"

# Update production API URL
# Edit src/services/ApiService.js - line 9:
# Change to: 'https://api.cooperativepacs.com/api/v1'

# Install EAS CLI
npm install -g eas-cli

# Login to Expo (create free account at expo.dev)
eas login

# Configure build
eas build:configure

# Build APK (preview for testing)
eas build -p android --profile preview

# Build AAB (for Play Store)
eas build -p android --profile production
```

**Build takes 10-20 minutes. You'll get download link via email.**

#### Method 2: Local Build (Requires Android Studio)

```powershell
cd "D:\DCCB LOAN MANAGEMENT\mobile"

# Update API URL first (same as above)

# Generate Android project
npx expo prebuild --clean --platform android

# Build APK
cd android
.\gradlew assembleRelease

# APK location: android\app\build\outputs\apk\release\app-release.apk
```

---

## 🧪 Testing Your Deployment

### Backend Test
```bash
curl https://api.cooperativepacs.com/health
curl https://api.cooperativepacs.com/api/v1/auth/login
```

### Frontend Test
- Visit `https://cooperativepacs.com`
- Login with admin/admin123
- Create a test loan

### Mobile Test
- Install APK on Android phone
- Login and test all features

---

## 🔒 Post-Deployment Security

### 1. Change Admin Password
```bash
# Login to frontend and change password immediately
```

### 2. Setup Automated Backups
```bash
nano /opt/cooperative-pacs/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/opt/cooperative-pacs/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database (Supabase - export via dashboard or API)
# Backup uploads
tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" /opt/cooperative-pacs/uploads

# Keep only last 30 days
find $BACKUP_DIR -type f -mtime +30 -delete
```

```bash
chmod +x /opt/cooperative-pacs/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /opt/cooperative-pacs/backup.sh
```

### 3. Setup Monitoring
```bash
# Install monitoring (optional but recommended)
apt install -y htop iotop nethogs

# Check logs
journalctl -u cooperative-pacs -f
tail -f /var/log/nginx/access.log
```

---

## 📊 Deployment Checklist

### Before Going Live
- [ ] SECRET_KEY changed from default
- [ ] Admin password changed
- [ ] Database migrations run
- [ ] CORS configured for production domain
- [ ] SSL certificates installed
- [ ] Backend health check passes
- [ ] Frontend loads correctly
- [ ] Mobile app connects to API
- [ ] Test loan creation works
- [ ] Test payment works
- [ ] Backups configured

---

## 🆘 Troubleshooting

### Backend Won't Start
```bash
# Check logs
journalctl -u cooperative-pacs -n 50
systemctl status cooperative-pacs

# Check if port is available
netstat -tulpn | grep 8000

# Restart
systemctl restart cooperative-pacs
```

### Frontend Shows Errors
```bash
# Check Nginx logs
tail -f /var/log/nginx/error.log

# Test Nginx config
nginx -t

# Restart Nginx
systemctl restart nginx
```

### Mobile App Can't Connect
1. Update `mobile/src/services/ApiService.js` with production URL
2. Rebuild APK
3. Check backend CORS settings include mobile app
4. Test API from mobile browser first

### Database Connection Failed
```bash
# Test database connection
python3 -c "from app.db.session import engine; print(engine.url)"

# Check if migrations ran
alembic current
alembic upgrade head
```

---

## 🎉 You're Live!

After deployment, your system will be accessible at:

- **Frontend:** https://cooperativepacs.com
- **Backend API:** https://api.cooperativepacs.com/api/v1
- **Admin Dashboard:** https://cooperativepacs.com/admin
- **Mobile App:** Distributed via APK or Play Store

---

## 📞 Quick Commands Reference

```bash
# Start/Stop Backend
systemctl start cooperative-pacs
systemctl stop cooperative-pacs
systemctl restart cooperative-pacs

# View Logs
journalctl -u cooperative-pacs -f
tail -f /var/log/nginx/access.log

# Database Operations
source venv/bin/activate
alembic upgrade head
python scripts/create_admin.py

# Nginx
nginx -t
systemctl restart nginx
certbot renew
```

---

## 🚀 Ready to Deploy?

**For Quick Testing (Recommended First):**
```powershell
# Terminal 1: Backend
cd "D:\DCCB LOAN MANAGEMENT"
& venv\Scripts\activate.ps1
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

**For Production (Cloud Server):**
Follow Part A, B, C, D above step-by-step!

---

**Need Help?** See:
- `DEPLOYMENT_COMPLETE_GUIDE.md` - Full details
- `DEPLOY_NOW.md` - Quick reference
- `PRODUCTION_CHECKLIST.md` - Pre-deployment checklist

**Your COOPERATIVE PACS is production-ready! 🎊**
