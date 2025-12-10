# 🏦 DCCB Loan Management System - Complete Project Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Technology Stack](#technology-stack)
4. [Installation & Setup](#installation--setup)
5. [API Documentation](#api-documentation)
6. [Database Schema](#database-schema)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Maintenance](#maintenance)

---

## 🎯 Project Overview

**DCCB Loan Management System** is a comprehensive, production-ready loan management platform designed for District Central Cooperative Banks (DCCB) to manage agricultural loans efficiently.

### Key Highlights
- ✅ **100% Complete** - All core features implemented
- 🔒 **Secure** - JWT authentication with role-based access control
- 📊 **Analytics** - Comprehensive dashboard and reporting
- 🤖 **Automated** - Background tasks for interest calculation and reminders
- 📱 **API-First** - RESTful API with auto-generated documentation
- 🧪 **Tested** - Unit tests and integration tests included

---

## ✨ Features

### 1. **User Management**
- Multi-role system (Farmer, Employee, Admin)
- Secure authentication with JWT tokens
- Profile management
- Branch assignment for employees

### 2. **Loan Management**
- **5 Loan Types**:
  - SAO (Short-term Agricultural Operations) - 7% Simple Interest
  - Long-term EMI - 12% EMI for 108 months
  - Rythu Bandhu - 12.5% Simple Interest
  - Rythu Nethany - 12.5% EMI for 120 months
  - Amul Loan - 12% EMI for 10 months

- **Interest Calculation Methods**:
  - Simple Interest
  - Compound Interest
  - Prorata Daily Interest
  - EMI (Equated Monthly Installment)

- **Loan Operations**:
  - Create loan applications
  - Approve/reject loans
  - Automatic EMI calculation
  - EMI schedule generation
  - Loan rescheduling
  - Loan closure

### 3. **EMI & Payment Tracking**
- Automatic EMI schedule generation
- Amortization with principal/interest breakdown
- Payment tracking (currently disabled in API)
- Overdue EMI detection
- Penal interest calculation

### 4. **Overdue Management**
- Daily overdue EMI checks
- Penal interest calculation
- Overdue summary reports
- Automatic defaulted loan marking

### 5. **Document Management**
- Document upload for loans
- Multiple file formats support (PDF, JPG, PNG, DOC)
- Document verification workflow
- Secure file storage

### 6. **Analytics & Reporting**
- **Dashboard Statistics**:
  - Total loans by status
  - Disbursement amounts
  - Outstanding balances
  - Recent loans
  - Monthly trends
  - Farmer statistics
  - Performance metrics

- **Export Capabilities**:
  - Export loans to CSV
  - Export EMI schedules
  - JSON summary reports

### 7. **Branch Management**
- Branch-wise statistics
- Comparative analysis
- Top performing branches
- Monthly disbursement trends

### 8. **Background Tasks**
- Daily interest calculation
- EMI reminders (3 days before due date)
- Overdue loan alerts
- Monthly report generation

---

## 🛠️ Technology Stack

### Backend
- **Framework**: FastAPI 0.104.1
- **Database**: PostgreSQL with AsyncPG
- **ORM**: SQLAlchemy 2.0 (Async)
- **Authentication**: JWT (PyJWT)
- **Password Hashing**: Bcrypt
- **Task Queue**: Celery with Redis
- **Server**: Uvicorn (ASGI)

### Development
- **Language**: Python 3.9+
- **Testing**: Pytest with async support
- **API Documentation**: OpenAPI/Swagger (auto-generated)

### Database Tables
1. `users` - User accounts and profiles
2. `branches` - Bank branches
3. `loans` - Loan records
4. `loan_type_configs` - Loan type configurations
5. `emi_schedules` - EMI payment schedules
6. `loan_ledgers` - Transaction ledger
7. `payments` - Payment records
8. `loan_documents` - Document uploads
9. `notifications` - Notification records
10. `notification_templates` - Notification templates

---

## 🚀 Installation & Setup

### Prerequisites
```bash
# Required software
- Python 3.9 or higher
- PostgreSQL 13 or higher
- Redis (for Celery tasks)
- Git
```

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd "DCCB LOAN MANAGEMENT"
```

### Step 2: Create Virtual Environment
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### Step 3: Install Dependencies
```powershell
pip install -r requirements.txt
```

### Step 4: Configure Environment
Create `.env` file in project root:
```env
# Database
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost/dccb_loan_db

# Security
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256

# Redis (for Celery)
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Application
APP_NAME=DCCB Loan Management System
DEBUG=True
```

### Step 5: Database Setup
```powershell
# Create database
createdb dccb_loan_db

# Run migrations (if using Alembic)
alembic upgrade head

# Or create tables directly
python -c "from app.db.base import Base; from app.db.session import engine; import asyncio; asyncio.run(Base.metadata.create_all(engine))"
```

### Step 6: Seed Initial Data
```powershell
# Run seed script to create loan type configs and sample branch
python scripts/seed_data.py
```

### Step 7: Start Server
```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Step 8: Start Celery Worker (Optional)
```powershell
# In a new terminal
celery -A app.core.celery_app worker --loglevel=info --pool=solo

# Start Celery Beat for scheduled tasks
celery -A app.core.celery_app beat --loglevel=info
```

---

## 📚 API Documentation

### Access Swagger UI
```
http://localhost:8000/docs
```

### Access ReDoc
```
http://localhost:8000/redoc
```

### API Endpoint Categories

#### 1. Authentication (`/api/v1/auth`)
```
POST   /register       - Register new user
POST   /login          - Login and get JWT token
GET    /me             - Get current user profile
PUT    /me             - Update user profile
```

#### 2. Loans (`/api/v1/loans`)
```
GET    /               - List all loans (filtered by role)
POST   /               - Create new loan
GET    /{id}           - Get loan details with EMI schedule
PUT    /{id}           - Update loan
POST   /approve        - Approve/reject loan
GET    /configs        - Get loan type configurations
```

#### 3. Dashboard (`/api/v1/dashboard`)
```
GET    /stats/overview     - Overall statistics
GET    /stats/monthly      - Monthly trends (default 6 months)
GET    /stats/farmers      - Farmer analytics
GET    /stats/performance  - Portfolio performance metrics
```

#### 4. Reports (`/api/v1/reports`)
```
GET    /loans/export                - Export loans to CSV
GET    /emi-schedule/export/{id}    - Export EMI schedule to CSV
GET    /summary                     - JSON summary report
```

#### 5. Overdue Management (`/api/v1/overdue`)
```
POST   /check-overdue           - Check and update overdue EMIs
GET    /summary                 - Get overdue loans summary
GET    /loan/{id}               - Get overdue EMIs for specific loan
POST   /mark-defaulted/{id}     - Mark loan as defaulted
```

#### 6. Loan Closure (`/api/v1/loan-closure`)
```
GET    /calculate/{id}  - Calculate closure amount
POST   /close/{id}      - Close loan
GET    /summary         - Get closed loans summary
```

#### 7. Loan Rescheduling (`/api/v1/loan-rescheduling`)
```
GET    /options/{id}    - Get rescheduling options
POST   /reschedule/{id} - Reschedule loan
GET    /list            - List rescheduled loans
```

#### 8. Document Management (`/api/v1/documents`)
```
POST   /upload/{loan_id}    - Upload document
GET    /loan/{loan_id}      - Get loan documents
POST   /verify/{doc_id}     - Verify document
DELETE /{doc_id}            - Delete document
```

#### 9. Branch Management (`/api/v1/branches`)
```
GET    /statistics/{id}     - Get branch statistics
GET    /comparison          - Compare all branches
GET    /top-performing      - Get top performing branches
GET    /trend/{id}          - Get branch monthly trend
```

---

## 🗄️ Database Schema

### Key Relationships
```
User (Farmer) ←→ Loans ←→ Branch
             ↓
         EMI Schedules
             ↓
         Payments
             ↓
       Loan Ledger
```

### Important Fields

**Loan Model**:
- `loan_number`: Unique identifier
- `principal_amount`: Loan amount
- `interest_rate`: Annual interest rate
- `tenure_months`: Loan duration
- `emi_amount`: Monthly EMI (if applicable)
- `outstanding_principal`: Remaining principal
- `outstanding_interest`: Accrued interest
- `penal_interest`: Penalty for overdue
- `status`: DRAFT, PENDING_APPROVAL, APPROVED, ACTIVE, CLOSED, DEFAULTED, REJECTED, RESCHEDULED

**EMI Schedule Model**:
- `installment_number`: EMI sequence
- `due_date`: Payment due date
- `emi_amount`: Total EMI
- `principal_component`: Principal portion
- `interest_component`: Interest portion
- `is_paid`: Payment status
- `overdue_days`: Days overdue
- `penal_interest`: Calculated penalty

---

## 🧪 Testing

### Run Unit Tests
```powershell
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_auth.py -v
```

### Test Coverage
- ✅ Authentication endpoints
- ✅ Loan creation and management
- ✅ Overdue EMI tracking
- ✅ Authorization checks

### Manual Testing
Use the provided test user credentials:
```
Farmer: adiajay8684@gmail.com / <password>
Employee: employee@dccb.com / Employee@123
Admin: admin@dccb.com / Admin@123
```

---

## 🚢 Deployment

### Production Checklist

#### 1. Environment Configuration
- [ ] Change `SECRET_KEY` to strong random value
- [ ] Set `DEBUG=False`
- [ ] Configure production database URL
- [ ] Set up SSL/TLS certificates
- [ ] Configure CORS allowed origins

#### 2. Database
- [ ] Set up production PostgreSQL instance
- [ ] Run migrations
- [ ] Create database backups
- [ ] Set up connection pooling

#### 3. Application Server
```bash
# Use Gunicorn with Uvicorn workers
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

#### 4. Celery Workers
```bash
# Production Celery setup
celery -A app.core.celery_app worker --loglevel=info --concurrency=4
celery -A app.core.celery_app beat --loglevel=info
```

#### 5. Reverse Proxy (Nginx)
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### 6. Process Manager
```bash
# Use systemd or supervisor
sudo systemctl start dccb-loan-api
sudo systemctl enable dccb-loan-api
```

---

## 🔧 Maintenance

### Daily Tasks (Automated)
- ✅ Interest calculation (midnight)
- ✅ Overdue EMI checks (6 AM)
- ✅ EMI reminders (9 AM)
- ✅ Overdue loan alerts (10 AM)

### Monthly Tasks
- ✅ Generate monthly reports (1st of month, 8 AM)
- Manual: Review defaulted loans
- Manual: Reconcile accounts

### Monitoring
- Monitor API response times
- Track error rates
- Check background task completion
- Monitor database performance
- Review security logs

### Backup Strategy
```bash
# Daily database backup
pg_dump dccb_loan_db > backup_$(date +%Y%m%d).sql

# Weekly full system backup
# Restore command
psql dccb_loan_db < backup_20251205.sql
```

---

## 📞 Support & Contact

For issues, feature requests, or contributions:
- Create an issue in the repository
- Contact: adiajay8684@gmail.com
- Documentation: http://localhost:8000/docs

---

## 📄 License

This project is proprietary software developed for DCCB institutions.

---

## 🎉 Project Status

**Status**: ✅ **PRODUCTION READY**

### Completed Features (100%)
- ✅ User authentication and authorization
- ✅ Loan management (create, approve, update)
- ✅ EMI calculation and scheduling
- ✅ Overdue tracking and penal interest
- ✅ Loan closure
- ✅ Loan rescheduling
- ✅ Document management
- ✅ Dashboard analytics
- ✅ Reporting and export
- ✅ Branch management
- ✅ Background tasks
- ✅ Unit tests
- ✅ API documentation

### Future Enhancements
- Payment gateway integration
- SMS/Email notifications (templates ready)
- Mobile app (React Native)
- OCR document processing
- ML-based risk assessment
- Voice assistant

---

**Last Updated**: December 5, 2025
**Version**: 1.0.0
**Status**: Production Ready ✅
