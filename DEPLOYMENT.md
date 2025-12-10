# DCCB Loan Management System - Deployment Guide

## Production Deployment Checklist

### 1. Pre-Deployment Setup

#### Database Setup
```bash
# Create production database
createdb -U postgres dccb_production

# Run migrations
alembic upgrade head

# Seed initial data (branches, loan types)
python scripts/seed_data.py
```

#### Environment Configuration
```bash
# Copy environment template
cp .env.example .env.production

# Edit with production values
nano .env.production
```

**Critical Settings to Update:**
- `ENVIRONMENT=production`
- `DATABASE_URL` - Production PostgreSQL connection
- `SECRET_KEY` - Generate new: `python -c "from secrets import token_urlsafe; print(token_urlsafe(32))"`
- `BACKEND_CORS_ORIGINS` - Your production domain(s)
- `ACCESS_TOKEN_EXPIRE_MINUTES=1440` (24 hours)

### 2. Security Hardening

#### Update config.py to use environment variables
```python
import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    # ... other settings
    
    class Config:
        env_file = ".env"
```

#### SSL/TLS Setup
- Enable HTTPS on web server (Nginx/Apache)
- Use Let's Encrypt for free SSL certificates
- Force HTTPS redirect in Nginx config

#### Security Headers
```python
# Add to main.py
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=["yourdomain.com", "*.yourdomain.com"]
)
```

### 3. Server Deployment

#### Option A: Docker Deployment (Recommended)

**Create Dockerfile:**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Run migrations and start server
CMD alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**Create docker-compose.yml:**
```yaml
version: '3.8'

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: dccb_production
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql+asyncpg://postgres:${DB_PASSWORD}@db:5432/dccb_production
      REDIS_URL: redis://redis:6379/0
    depends_on:
      - db
      - redis
    volumes:
      - ./uploads:/app/uploads

  celery:
    build: .
    command: celery -A app.core.celery_app worker -l info
    environment:
      DATABASE_URL: postgresql+asyncpg://postgres:${DB_PASSWORD}@db:5432/dccb_production
      REDIS_URL: redis://redis:6379/0
    depends_on:
      - db
      - redis

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./frontend/dist:/usr/share/nginx/html
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    depends_on:
      - backend

volumes:
  postgres_data:
  redis_data:
```

**Deploy:**
```bash
docker-compose up -d
```

#### Option B: Traditional Server Deployment

**Install Dependencies:**
```bash
# Install Python
sudo apt-get install python3.11 python3.11-venv

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Install Redis
sudo apt-get install redis-server

# Install Tesseract OCR
sudo apt-get install tesseract-ocr
```

**Setup Systemd Service:**
```ini
# /etc/systemd/system/dccb-backend.service
[Unit]
Description=DCCB Loan Management Backend
After=network.target postgresql.service redis.service

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=/var/www/dccb-backend
Environment="PATH=/var/www/dccb-backend/venv/bin"
ExecStart=/var/www/dccb-backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable dccb-backend
sudo systemctl start dccb-backend
```

### 4. Frontend Deployment

**Build for Production:**
```bash
cd frontend
npm install
npm run build
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Frontend
    location / {
        root /var/www/dccb-frontend/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # WebSocket support (if needed)
    location /ws {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 5. Database Backup

**Automated Backup Script:**
```bash
#!/bin/bash
# /usr/local/bin/backup-dccb-db.sh

BACKUP_DIR="/var/backups/dccb"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="dccb_production"

mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U postgres $DB_NAME | gzip > $BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: db_backup_$TIMESTAMP.sql.gz"
```

**Setup Cron:**
```bash
# Daily backup at 2 AM
0 2 * * * /usr/local/bin/backup-dccb-db.sh
```

### 6. Monitoring & Logging

**Setup Logging:**
```python
# app/core/logging.py
import logging
from logging.handlers import RotatingFileHandler

def setup_logging():
    logger = logging.getLogger("dccb")
    logger.setLevel(logging.INFO)
    
    handler = RotatingFileHandler(
        "/var/log/dccb/app.log",
        maxBytes=10485760,  # 10MB
        backupCount=10
    )
    
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    
    return logger
```

**Health Check Endpoint:**
```python
# Add to main.py
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": datetime.utcnow()
    }
```

### 7. Performance Optimization

**Database Connection Pooling:**
```python
# In app/db/session.py
engine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=20,
    max_overflow=40,
    pool_pre_ping=True,
    pool_recycle=3600
)
```

**Caching with Redis:**
```python
from redis import Redis
redis_client = Redis.from_url(settings.REDIS_URL)

# Cache frequently accessed data
@app.get("/loan-types")
async def get_loan_types(cache: Redis = Depends(get_redis)):
    cached = cache.get("loan_types")
    if cached:
        return json.loads(cached)
    
    # Fetch from database
    loan_types = await fetch_loan_types()
    cache.setex("loan_types", 3600, json.dumps(loan_types))
    return loan_types
```

### 8. Post-Deployment Testing

**Test Checklist:**
- [ ] Database connectivity
- [ ] User authentication and authorization
- [ ] Loan creation and approval workflow
- [ ] Payment processing
- [ ] Document upload
- [ ] Email/SMS notifications
- [ ] Report generation
- [ ] API rate limiting
- [ ] SSL certificate
- [ ] Backup restoration
- [ ] Load testing

**Load Testing:**
```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Test API endpoint
ab -n 1000 -c 10 https://yourdomain.com/api/v1/loans/
```

### 9. Maintenance

**Regular Tasks:**
- Daily: Check logs for errors
- Weekly: Review performance metrics
- Monthly: Update dependencies
- Quarterly: Security audit
- Annually: SSL certificate renewal

**Update Dependencies:**
```bash
pip list --outdated
pip install --upgrade package-name
pip freeze > requirements.txt
```

### 10. Rollback Plan

**Quick Rollback:**
```bash
# Docker
docker-compose down
docker-compose up -d --build previous-version

# Database rollback
psql -U postgres dccb_production < /var/backups/dccb/db_backup_TIMESTAMP.sql.gz
```

## Support & Maintenance

**Log Locations:**
- Application: `/var/log/dccb/app.log`
- Nginx: `/var/log/nginx/access.log`, `/var/log/nginx/error.log`
- PostgreSQL: `/var/log/postgresql/`

**Monitoring Commands:**
```bash
# Check service status
systemctl status dccb-backend

# View logs
journalctl -u dccb-backend -f

# Database connections
psql -U postgres -c "SELECT * FROM pg_stat_activity;"

# Redis info
redis-cli INFO
```

---

**Production URL:** https://yourdomain.com  
**Admin Panel:** https://yourdomain.com/admin  
**API Docs:** https://yourdomain.com/api/docs
