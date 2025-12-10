# DCCB Loan Management System - Production Quickstart

## ⚡ Quick Deploy (Docker - Recommended)

### Prerequisites
- Docker & Docker Compose installed
- Domain name configured (optional for local testing)

### 1. Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env and set production values
# CRITICAL: Change SECRET_KEY, DATABASE_URL, passwords!
```

### 2. Start Services
```bash
# Build and start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend
```

### 3. Initialize Database
```bash
# Run migrations
docker-compose exec backend alembic upgrade head

# Seed initial data
docker-compose exec backend python scripts/seed_data.py
```

### 4. Access Application
- Frontend: http://localhost
- Backend API: http://localhost/api/v1
- API Docs: http://localhost/docs (development only)

## 🖥️ Traditional Server Deploy (Ubuntu/Debian)

### 1. Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3.11
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

### 2. Setup Application
```bash
# Clone repository
git clone <your-repo-url>
cd DCCB-LOAN-MANAGEMENT

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
nano .env  # Edit with production values
```

### 3. Setup Database
```bash
# Create PostgreSQL database
sudo -u postgres psql
CREATE DATABASE dccb_production;
CREATE USER dccb_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE dccb_production TO dccb_user;
\q

# Run migrations
alembic upgrade head

# Seed data
python scripts/seed_data.py
```

### 4. Build Frontend
```bash
cd frontend
npm install
npm run build
cd ..
```

### 5. Configure Nginx
```bash
# Copy nginx config
sudo cp nginx/nginx.conf /etc/nginx/nginx.conf

# Create SSL directory (use Let's Encrypt or self-signed)
sudo mkdir -p /etc/nginx/ssl

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 6. Create Systemd Service
```bash
sudo nano /etc/systemd/system/dccb-backend.service
```

Paste:
```ini
[Unit]
Description=DCCB Loan Management Backend
After=network.target postgresql.service redis.service

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=/path/to/DCCB-LOAN-MANAGEMENT
Environment="PATH=/path/to/DCCB-LOAN-MANAGEMENT/venv/bin"
ExecStart=/path/to/DCCB-LOAN-MANAGEMENT/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable dccb-backend
sudo systemctl start dccb-backend

# Check status
sudo systemctl status dccb-backend
```

### 7. Setup Celery Workers
```bash
# Celery worker service
sudo nano /etc/systemd/system/dccb-celery.service
```

Paste:
```ini
[Unit]
Description=DCCB Celery Worker
After=network.target redis.service

[Service]
Type=forking
User=www-data
Group=www-data
WorkingDirectory=/path/to/DCCB-LOAN-MANAGEMENT
Environment="PATH=/path/to/DCCB-LOAN-MANAGEMENT/venv/bin"
ExecStart=/path/to/DCCB-LOAN-MANAGEMENT/venv/bin/celery -A app.core.celery_app worker -l info -E
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable dccb-celery
sudo systemctl start dccb-celery
```

## 🔒 SSL/TLS Setup (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
sudo certbot renew --dry-run
```

## 🧪 Testing Deployment

### Health Check
```bash
curl http://localhost/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "environment": "production",
  "timestamp": "2024-01-01T12:00:00",
  "services": {
    "api": "operational",
    "database": "connected"
  }
}
```

### API Test
```bash
# Register a user
curl -X POST http://localhost/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","full_name":"Test User","role":"farmer"}'

# Login
curl -X POST http://localhost/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

## 📊 Monitoring

### View Logs
```bash
# Docker
docker-compose logs -f backend
docker-compose logs -f celery_worker

# Traditional
sudo journalctl -u dccb-backend -f
sudo journalctl -u dccb-celery -f
tail -f logs/app.log
```

### Check Services
```bash
# Docker
docker-compose ps

# Traditional
sudo systemctl status dccb-backend
sudo systemctl status dccb-celery
sudo systemctl status nginx
sudo systemctl status postgresql
sudo systemctl status redis
```

## 🔄 Updates and Maintenance

### Update Application (Docker)
```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Run migrations
docker-compose exec backend alembic upgrade head
```

### Update Application (Traditional)
```bash
# Pull latest changes
git pull

# Activate venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Rebuild frontend
cd frontend && npm run build && cd ..

# Restart services
sudo systemctl restart dccb-backend
sudo systemctl restart dccb-celery
sudo systemctl restart nginx
```

### Database Backup
```bash
# Docker
docker-compose exec db pg_dump -U postgres dccb_production > backup_$(date +%Y%m%d).sql

# Traditional
pg_dump -U dccb_user dccb_production > backup_$(date +%Y%m%d).sql
```

## 🆘 Troubleshooting

### Backend not starting
```bash
# Check logs
docker-compose logs backend
# OR
sudo journalctl -u dccb-backend -n 50

# Common issues:
# - Database connection: Check DATABASE_URL in .env
# - Port conflict: Check if port 8000 is in use
# - Permissions: Check file ownership
```

### Database connection errors
```bash
# Test connection
docker-compose exec backend python -c "from app.db.session import engine; print('Connected!')"

# Check PostgreSQL
docker-compose exec db psql -U postgres -c "\l"
```

### Frontend not loading
```bash
# Check Nginx logs
docker-compose logs nginx
# OR
sudo tail -f /var/log/nginx/error.log

# Rebuild frontend
cd frontend && npm run build
```

## 📞 Support
For issues, check DEPLOYMENT.md for detailed documentation.
