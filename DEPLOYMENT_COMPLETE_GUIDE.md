# 🚀 DCCB Loan Management System - Complete Deployment Guide

**Last Updated:** December 10, 2025  
**Version:** 2.0.0

---

## 📋 Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Backend Deployment](#backend-deployment)
3. [Frontend Deployment](#frontend-deployment)
4. [Mobile App Deployment](#mobile-app-deployment)
5. [Production Server Setup](#production-server-setup)
6. [Post-Deployment Testing](#post-deployment-testing)

---

## 🎯 Pre-Deployment Checklist

### ✅ What You Need
- [ ] Production server (VPS/Cloud - Ubuntu 20.04+ recommended)
- [ ] Domain name (e.g., dccbloan.com)
- [ ] SSL certificate (Let's Encrypt free or commercial)
- [ ] PostgreSQL database (Supabase/AWS RDS/Local)
- [ ] Email for Google Play Store developer account
- [ ] Email for Apple Developer account (for iOS)

### 🔐 Security Preparations
- [ ] Generate new `SECRET_KEY` for production
- [ ] Change all default passwords
- [ ] Configure production database credentials
- [ ] Set up CORS for your domain only
- [ ] Enable HTTPS/SSL

---

## 🖥️ Backend Deployment

### Option 1: Docker Deployment (Recommended)

#### Step 1: Prepare Production Environment
```bash
# SSH into your production server
ssh user@your-server-ip

# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt install docker-compose -y

# Clone your repository
git clone <your-repo-url>
cd DCCB-LOAN-MANAGEMENT
```

#### Step 2: Configure Environment Variables
```bash
# Create production .env file
cp .env.example .env.production

# Edit with production values
nano .env.production
```

**Production .env.production:**
```env
# -------------------------
# APPLICATION SETTINGS
# -------------------------
ENVIRONMENT=production
APP_NAME=DCCB Loan Automation AI System
DEBUG=False

# -------------------------
# DATABASE CONFIGURATION
# -------------------------
# Use your Supabase or production database
DATABASE_URL=postgresql+asyncpg://username:password@your-db-host:5432/dccb_production

# -------------------------
# SECURITY (CRITICAL - GENERATE NEW!)
# -------------------------
# Generate: python -c "from secrets import token_urlsafe; print(token_urlsafe(32))"
SECRET_KEY=YOUR_NEW_PRODUCTION_SECRET_KEY_HERE
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# -------------------------
# AI / GEMINI CONFIG
# -------------------------
GEMINI_API_KEY=AIzaSyDYv5Wrh4Fd2nBHbriJIaw7ftgPmyY5jKo

# -------------------------
# REDIS CONFIG
# -------------------------
REDIS_URL=redis://redis:6379/0

# -------------------------
# CORS - YOUR DOMAIN ONLY!
# -------------------------
BACKEND_CORS_ORIGINS=["https://yourdomain.com","https://www.yourdomain.com","https://api.yourdomain.com"]

# -------------------------
# OCR / TESSERACT
# -------------------------
TESSERACT_PATH=/usr/bin/tesseract

# -------------------------
# NOTIFICATIONS (Optional)
# -------------------------
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890
```

#### Step 3: Deploy with Docker Compose
```bash
# Build and start services
docker-compose -f docker-compose.yml --env-file .env.production up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend

# Run database migrations
docker-compose exec backend alembic upgrade head

# Seed initial data (branches, loan types)
docker-compose exec backend python scripts/seed_data.py

# Create admin user
docker-compose exec backend python scripts/create_admin.py
```

#### Step 4: Configure Nginx Reverse Proxy
```bash
# Install Nginx
sudo apt install nginx -y

# Create configuration
sudo nano /etc/nginx/sites-available/dccb-loan
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers (if needed)
        add_header Access-Control-Allow-Origin "https://yourdomain.com" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:8000/health;
    }

    # File size limit for uploads
    client_max_body_size 50M;
}
```

```bash
# Enable site and restart Nginx
sudo ln -s /etc/nginx/sites-available/dccb-loan /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Install SSL certificate (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d api.yourdomain.com
```

### Option 2: Traditional Server Deployment

#### Step 1: Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3.11
sudo apt install software-properties-common -y
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update
sudo apt install python3.11 python3.11-venv python3-pip -y

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Redis
sudo apt install redis-server -y

# Install Tesseract OCR
sudo apt install tesseract-ocr tesseract-ocr-eng -y

# Install Nginx
sudo apt install nginx -y
```

#### Step 2: Setup Application
```bash
# Create app directory
sudo mkdir -p /opt/dccb-loan
sudo chown $USER:$USER /opt/dccb-loan
cd /opt/dccb-loan

# Clone repository
git clone <your-repo-url> .

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env.production
nano .env.production
```

#### Step 3: Setup Database
```bash
# Create PostgreSQL database
sudo -u postgres psql
```

```sql
CREATE DATABASE dccb_production;
CREATE USER dccb_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE dccb_production TO dccb_user;
\q
```

```bash
# Update .env.production with database URL
# DATABASE_URL=postgresql+asyncpg://dccb_user:your_secure_password@localhost:5432/dccb_production

# Run migrations
source venv/bin/activate
alembic upgrade head

# Seed data
python scripts/seed_data.py
```

#### Step 4: Create Systemd Service
```bash
sudo nano /etc/systemd/system/dccb-backend.service
```

```ini
[Unit]
Description=DCCB Loan Management Backend
After=network.target postgresql.service redis.service

[Service]
Type=exec
User=www-data
Group=www-data
WorkingDirectory=/opt/dccb-loan
Environment="PATH=/opt/dccb-loan/venv/bin"
EnvironmentFile=/opt/dccb-loan/.env.production
ExecStart=/opt/dccb-loan/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Set permissions
sudo chown -R www-data:www-data /opt/dccb-loan

# Start service
sudo systemctl daemon-reload
sudo systemctl enable dccb-backend
sudo systemctl start dccb-backend

# Check status
sudo systemctl status dccb-backend
```

---

## 🌐 Frontend Deployment

### Step 1: Build Frontend for Production
```bash
# On your local machine or CI/CD
cd frontend

# Install dependencies
npm install

# Create production environment file
nano .env.production
```

**.env.production:**
```env
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
VITE_APP_NAME=DCCB Loan Management
```

```bash
# Build for production
npm run build

# This creates a 'dist' folder with optimized files
```

### Step 2: Deploy to Server

#### Option A: Deploy with Nginx (Simple)
```bash
# Copy build files to server
scp -r dist/* user@your-server:/var/www/dccb-loan/

# On server, configure Nginx
sudo nano /etc/nginx/sites-available/dccb-loan-frontend
```

**Nginx Frontend Configuration:**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/dccb-loan;
    index index.html;

    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # React Router - serve index.html for all routes
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

```bash
# Enable and restart Nginx
sudo ln -s /etc/nginx/sites-available/dccb-loan-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Install SSL
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

#### Option B: Deploy with Docker
```dockerfile
# Create Dockerfile in frontend directory
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
# Build and run
docker build -t dccb-frontend .
docker run -d -p 80:80 dccb-frontend
```

---

## 📱 Mobile App Deployment

### Android APK/AAB Build

#### Step 1: Update API Configuration
```bash
cd mobile

# Update API base URL for production
nano src/services/apiService.js
```

**src/services/apiService.js:**
```javascript
const API_BASE_URL = __DEV__ 
  ? 'http://192.168.0.106:8001/api/v1'  // Development
  : 'https://api.yourdomain.com/api/v1'; // Production
```

#### Step 2: Update app.json
```bash
nano app.json
```

**app.json updates:**
```json
{
  "expo": {
    "name": "DCCB Loan Management",
    "slug": "dccb-loan-mobile",
    "version": "2.0.0",
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
      "useNextNotificationsApi": true
    }
  }
}
```

#### Step 3: Build APK using EAS Build

**Install EAS CLI:**
```bash
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS
eas build:configure
```

**Build APK (for testing/distribution):**
```bash
# Build APK for Android
eas build -p android --profile preview

# Or build AAB for Google Play Store
eas build -p android --profile production
```

This will:
1. Upload your code to Expo servers
2. Build the APK/AAB in the cloud
3. Provide download link when complete (usually 10-20 minutes)

#### Step 4: Local Build (Alternative - No Expo Account Needed)

**Install Android Studio and SDK:**
```bash
# Download Android Studio from https://developer.android.com/studio

# Set environment variables (add to ~/.bashrc or ~/.zshrc)
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

**Generate Android project:**
```bash
# Install expo prebuild
npm install -g @expo/prebuild

# Generate native Android code
npx expo prebuild --platform android

# Navigate to Android folder
cd android

# Build APK
./gradlew assembleRelease

# APK will be at: android/app/build/outputs/apk/release/app-release.apk
```

#### Step 5: Sign APK for Release

**Generate keystore:**
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore dccb-release.keystore -alias dccb-key -keyalg RSA -keysize 2048 -validity 10000

# You'll be asked for:
# - Keystore password (remember this!)
# - Key password
# - Your name, organization, etc.
```

**Create gradle.properties:**
```bash
# android/gradle.properties
MYAPP_RELEASE_STORE_FILE=dccb-release.keystore
MYAPP_RELEASE_KEY_ALIAS=dccb-key
MYAPP_RELEASE_STORE_PASSWORD=your_keystore_password
MYAPP_RELEASE_KEY_PASSWORD=your_key_password
```

**Update build.gradle:**
```gradle
// android/app/build.gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file(MYAPP_RELEASE_STORE_FILE)
            storePassword MYAPP_RELEASE_STORE_PASSWORD
            keyAlias MYAPP_RELEASE_KEY_ALIAS
            keyPassword MYAPP_RELEASE_KEY_PASSWORD
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            ...
        }
    }
}
```

**Build signed APK:**
```bash
cd android
./gradlew assembleRelease

# Signed APK: android/app/build/outputs/apk/release/app-release.apk
```

#### Step 6: Publish to Google Play Store

1. **Create Google Play Developer Account**
   - Go to https://play.google.com/console
   - Pay $25 one-time registration fee
   - Complete account setup

2. **Create App in Console**
   - Click "Create app"
   - Fill in app details
   - Upload screenshots, descriptions, icons

3. **Upload APK/AAB**
   - Go to "Release" → "Production"
   - Upload your signed AAB file
   - Fill in release notes
   - Submit for review

4. **Review Process**
   - Google reviews typically take 1-3 days
   - You'll receive email when approved
   - App goes live on Play Store

### iOS Build (Optional)

**Requirements:**
- Apple Developer Account ($99/year)
- Mac computer with Xcode

**Build with EAS:**
```bash
eas build -p ios --profile production
```

**Publish to App Store:**
1. Create app in App Store Connect
2. Upload build using EAS Submit or Xcode
3. Submit for review
4. Wait for Apple approval (typically 1-2 days)

---

## 🏗️ Production Server Setup (Complete)

### Server Specifications (Minimum)
- **CPU:** 2 cores
- **RAM:** 4GB
- **Storage:** 50GB SSD
- **OS:** Ubuntu 20.04 LTS or newer
- **Network:** Static IP or domain

### Complete Server Setup Script

```bash
#!/bin/bash
# DCCB Loan Management - Complete Server Setup

# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git vim ufw fail2ban

# Configure firewall
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose -y

# Install PostgreSQL (if not using Docker)
sudo apt install postgresql postgresql-contrib -y

# Install Redis (if not using Docker)
sudo apt install redis-server -y

# Install Nginx
sudo apt install nginx -y

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx -y

# Install monitoring tools
sudo apt install htop iotop nethogs -y

# Configure automatic security updates
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure --priority=low unattended-upgrades

# Create app directory
sudo mkdir -p /opt/dccb-loan
sudo chown $USER:$USER /opt/dccb-loan

echo "Server setup complete! Now clone your repository to /opt/dccb-loan"
```

### Security Hardening

```bash
# Disable root login
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no

# Change SSH port (optional)
# Set: Port 2222

# Restart SSH
sudo systemctl restart sshd

# Configure fail2ban
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local
# Enable SSH jail and set bantime

sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 🧪 Post-Deployment Testing

### Backend API Testing
```bash
# Health check
curl https://api.yourdomain.com/health

# API docs (should be disabled in production)
curl https://api.yourdomain.com/docs

# Test login
curl -X POST https://api.yourdomain.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Frontend Testing
- [ ] Visit https://yourdomain.com
- [ ] Test login functionality
- [ ] Check all pages load correctly
- [ ] Verify API calls work
- [ ] Test on mobile browser

### Mobile App Testing
- [ ] Install APK on Android device
- [ ] Test login
- [ ] Check all screens navigate correctly
- [ ] Test camera/document upload
- [ ] Verify API connectivity

---

## 📊 Monitoring & Maintenance

### Setup Monitoring
```bash
# Install PM2 for process monitoring (if not using Docker)
npm install -g pm2

# Start backend with PM2
pm2 start "uvicorn app.main:app --host 0.0.0.0 --port 8000" --name dccb-backend

# Setup PM2 to start on boot
pm2 startup
pm2 save
```

### Log Management
```bash
# View backend logs
docker-compose logs -f backend

# Or if using systemd
sudo journalctl -u dccb-backend -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Backup Strategy
```bash
# Database backup script
#!/bin/bash
# /opt/dccb-loan/backup.sh

BACKUP_DIR="/opt/dccb-loan/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup database
docker-compose exec -T db pg_dump -U postgres dccb_production > "$BACKUP_DIR/db_$DATE.sql"

# Backup uploads
tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" /opt/dccb-loan/uploads

# Keep only last 30 days
find $BACKUP_DIR -type f -mtime +30 -delete

# Add to crontab
# 0 2 * * * /opt/dccb-loan/backup.sh
```

---

## 🎉 Deployment Complete!

### Access Your Application

- **Frontend:** https://yourdomain.com
- **Backend API:** https://api.yourdomain.com/api/v1
- **Admin Dashboard:** https://yourdomain.com/admin
- **Mobile App:** Download APK or from Play Store

### Default Admin Credentials
- **Username:** admin
- **Password:** admin123
- ⚠️ **Change immediately after first login!**

### Support & Documentation
- API Documentation: See `API_REFERENCE.md`
- User Guide: See `COMPLETE_DOCUMENTATION.md`
- Troubleshooting: See `DEPLOYMENT.md`

---

## 🆘 Troubleshooting

### Backend not starting
```bash
# Check logs
docker-compose logs backend

# Restart services
docker-compose restart backend

# Check database connection
docker-compose exec backend python -c "from app.db.session import engine; print(engine.url)"
```

### Frontend showing API errors
- Check `VITE_API_BASE_URL` in `.env.production`
- Verify CORS settings in backend `.env`
- Check Nginx proxy configuration
- Test API directly with curl

### Mobile app can't connect
- Update API_BASE_URL in `src/services/apiService.js`
- Rebuild APK after changes
- Check backend CORS allows mobile requests
- Test API from mobile browser first

### SSL certificate issues
```bash
# Renew certificates
sudo certbot renew

# Test auto-renewal
sudo certbot renew --dry-run
```

---

**Deployment Date:** _________________  
**Deployed By:** _________________  
**Server IP:** _________________  
**Domain:** _________________

