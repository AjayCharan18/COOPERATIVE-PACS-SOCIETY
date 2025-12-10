# 📁 Project Structure Guide

## Directory Overview

```
DCCB-LOAN-MANAGEMENT/
│
├── 📂 app/                          # Backend application
│   ├── 📂 api/                      # API layer
│   │   ├── deps.py                  # Dependency injection
│   │   └── 📂 v1/                   # API version 1
│   │       ├── api.py               # Route aggregator
│   │       └── 📂 endpoints/        # API endpoints
│   │           ├── auth.py          # Authentication (login, register)
│   │           ├── loans.py         # Loan CRUD operations
│   │           ├── payments.py      # Payment processing
│   │           ├── documents.py     # Document upload/OCR
│   │           ├── dashboard.py     # Dashboard analytics
│   │           ├── reports.py       # Report generation
│   │           ├── branches.py      # Branch management
│   │           ├── overdue.py       # Overdue loan tracking
│   │           ├── loan_closure.py  # Loan closure workflow
│   │           └── loan_rescheduling.py  # Loan rescheduling
│   │
│   ├── 📂 core/                     # Core configuration
│   │   ├── config.py                # Settings (env variables)
│   │   ├── security.py              # JWT, password hashing
│   │   └── celery_app.py            # Celery configuration
│   │
│   ├── 📂 db/                       # Database layer
│   │   ├── session.py               # Async DB sessions
│   │   └── base.py                  # Base model imports
│   │
│   ├── 📂 models/                   # SQLAlchemy ORM models
│   │   ├── user.py                  # User model
│   │   ├── loan.py                  # Loan model
│   │   ├── payment.py               # Payment model
│   │   ├── loan_document.py         # Document model
│   │   └── notification.py          # Notification model
│   │
│   ├── 📂 schemas/                  # Pydantic schemas
│   │   ├── user.py                  # User DTOs
│   │   ├── loan.py                  # Loan DTOs
│   │   ├── payment.py               # Payment DTOs
│   │   └── token.py                 # Auth DTOs
│   │
│   ├── 📂 services/                 # Business logic
│   │   ├── loan_service.py          # Loan operations
│   │   ├── payment_service.py       # Payment processing
│   │   ├── interest_calculator.py   # Interest calculations
│   │   ├── document_service.py      # Document handling
│   │   ├── ocr_service.py           # OCR processing
│   │   ├── notification_service.py  # Notifications
│   │   ├── ml_service.py            # AI/ML features
│   │   ├── branch_service.py        # Branch operations
│   │   ├── overdue_service.py       # Overdue management
│   │   ├── loan_closure_service.py  # Loan closure
│   │   └── loan_rescheduling_service.py  # Rescheduling
│   │
│   ├── 📂 tasks/                    # Celery background tasks
│   │   ├── interest_calculation.py  # Daily interest calc
│   │   ├── notifications.py         # Notification tasks
│   │   ├── overdue_tasks.py         # Overdue checks
│   │   └── reports.py               # Report generation
│   │
│   ├── 📂 utils/                    # Utility functions
│   │   └── constants.py             # Constants
│   │
│   └── main.py                      # FastAPI app entry point
│
├── 📂 frontend/                     # React frontend
│   ├── 📂 src/
│   │   ├── 📂 components/           # Reusable components
│   │   │   ├── LoanClosure.jsx
│   │   │   └── LoanRescheduling.jsx
│   │   │
│   │   ├── 📂 layouts/              # Layout components
│   │   │   ├── AuthLayout.jsx       # Login/Register layout
│   │   │   └── DashboardLayout.jsx  # Main dashboard layout
│   │   │
│   │   ├── 📂 pages/                # Page components
│   │   │   ├── Profile.jsx
│   │   │   ├── 📂 admin/            # Admin pages
│   │   │   ├── 📂 auth/             # Auth pages
│   │   │   ├── 📂 branches/         # Branch pages
│   │   │   ├── 📂 documents/        # Document pages
│   │   │   ├── 📂 employee/         # Employee pages
│   │   │   ├── 📂 farmer/           # Farmer pages
│   │   │   ├── 📂 loans/            # Loan pages
│   │   │   ├── 📂 overdue/          # Overdue pages
│   │   │   ├── 📂 payments/         # Payment pages
│   │   │   └── 📂 reports/          # Report pages
│   │   │
│   │   ├── 📂 services/             # API client
│   │   │   └── api.js               # Axios configuration
│   │   │
│   │   ├── 📂 stores/               # State management
│   │   │   └── authStore.js         # Auth state (Zustand)
│   │   │
│   │   ├── 📂 utils/                # Utility functions
│   │   │   └── loanHelpers.js       # Loan formatting
│   │   │
│   │   ├── App.jsx                  # Root component
│   │   ├── main.jsx                 # Entry point
│   │   └── index.css                # Global styles
│   │
│   ├── index.html                   # HTML template
│   ├── package.json                 # Dependencies
│   ├── vite.config.js               # Vite configuration
│   └── tailwind.config.js           # TailwindCSS config
│
├── 📂 scripts/                      # Utility scripts
│   ├── seed_data.py                 # Database seeding
│   ├── create_sample_loans.py       # Sample loan data
│   ├── add_branches.py              # Branch setup
│   ├── add_loan_types.py            # Loan type config
│   └── test_api.py                  # API testing
│
├── 📂 tests/                        # Test suite
│   ├── conftest.py                  # Test configuration
│   ├── test_auth.py                 # Auth tests
│   ├── test_loans.py                # Loan tests
│   └── test_overdue.py              # Overdue tests
│
├── 📂 alembic/                      # Database migrations
│   └── env.py                       # Alembic configuration
│
├── 📂 nginx/                        # Nginx configuration
│   └── nginx.conf                   # Production Nginx config
│
├── 📂 .github/workflows/            # CI/CD pipelines
│   └── ci-cd.yml                    # GitHub Actions
│
├── 📄 .env.example                  # Environment template
├── 📄 .gitignore                    # Git ignore rules
├── 📄 .dockerignore                 # Docker ignore rules
├── 📄 Dockerfile                    # Docker image config
├── 📄 docker-compose.yml            # Multi-container setup
├── 📄 requirements.txt              # Python dependencies
├── 📄 alembic.ini                   # Alembic settings
├── 📄 ecosystem.config.js           # PM2 configuration
├── 📄 start.sh                      # Linux startup script
├── 📄 start.ps1                     # Windows startup script
│
└── 📚 Documentation/
    ├── README.md                    # Main documentation
    ├── DEPLOYMENT.md                # Deployment guide (500+ lines)
    ├── DEPLOY_QUICKSTART.md         # Quick deploy guide
    ├── PRODUCTION_CHECKLIST.md      # Pre-deployment checklist
    ├── API_REFERENCE.md             # API documentation
    ├── FEATURES.md                  # Feature list
    ├── FRONTEND_UI_GUIDE.md         # UI guide
    ├── SETUP.md                     # Setup instructions
    └── START_HERE.md                # Getting started
```

## 🏗️ Architecture

### Backend Architecture (FastAPI)
```
Request → Nginx → FastAPI App → API Router → Endpoint → Service → Model → Database
                                                      ↓
                                                   Schema (Pydantic)
                                                      ↓
                                                   Response
```

### Frontend Architecture (React)
```
User → React Router → Page Component → API Service (Axios) → Backend API
                           ↓
                    Layout Component
                           ↓
                    Reusable Components
                           ↓
                    State Management (Zustand)
```

### Background Tasks (Celery)
```
Scheduler (Beat) → Task Queue (Redis) → Worker → Service → Database
                                          ↓
                                    Notifications (Email/SMS/WhatsApp)
```

## 📊 Data Flow

### Loan Application Flow
```
1. Farmer submits application → Frontend Form
2. Frontend → POST /api/v1/loans → Backend
3. Backend validates → LoanService
4. Service calculates interest → InterestCalculator
5. Service saves to database → Loan Model
6. Background task processes documents → OCR Service
7. AI evaluates risk → ML Service (Gemini)
8. Employee reviews → Dashboard
9. Employee approves → Status Update
10. Notification sent → Email/SMS/WhatsApp
```

### Payment Processing Flow
```
1. Payment initiated → Frontend
2. Razorpay gateway → Payment collection
3. Webhook callback → Backend /api/v1/payments/webhook
4. Service validates → PaymentService
5. Update loan balance → Loan Model
6. Calculate interest → InterestCalculator
7. Check if fully paid → Loan Status Update
8. Send receipt → Notification Service
```

## 🗄️ Database Schema

### Core Tables
- **users**: User accounts (admin, employee, farmer)
- **loans**: Loan applications and status
- **payments**: Payment transactions
- **loan_documents**: Document metadata and OCR results
- **notifications**: Notification history
- **branches**: Bank branch information
- **loan_types**: Loan product configurations

### Key Relationships
```
User (1) ─── (Many) Loans
Loan (1) ─── (Many) Payments
Loan (1) ─── (Many) LoanDocuments
User (1) ─── (Many) Notifications
Branch (1) ─── (Many) Loans
```

## 🔐 Security Layers

1. **Authentication**: JWT tokens with refresh mechanism
2. **Authorization**: Role-based access control (RBAC)
3. **Password Security**: Bcrypt hashing with salt
4. **API Security**: Rate limiting, CORS, CSP headers
5. **Data Encryption**: Sensitive data encrypted at rest
6. **SQL Injection Protection**: Parameterized queries
7. **XSS Protection**: Content Security Policy
8. **HTTPS/SSL**: TLS 1.2+ encryption

## 🚀 Deployment Options

### 1. Docker (Recommended)
- Complete containerization
- Easy scaling
- Consistent environments
- See: `docker-compose.yml`

### 2. Traditional Server
- Ubuntu/Debian server
- Systemd services
- Nginx reverse proxy
- See: `DEPLOYMENT.md`

### 3. Cloud Platforms
- AWS: ECS, RDS, ElastiCache
- Azure: App Service, PostgreSQL
- GCP: Cloud Run, Cloud SQL

## 📈 Scalability

### Horizontal Scaling
- Multiple backend workers (Uvicorn)
- Multiple Celery workers
- Redis cluster for caching
- PostgreSQL read replicas

### Performance Optimization
- Database indexing
- Query optimization
- Redis caching layer
- CDN for static assets
- Gzip compression
- Connection pooling

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `.env` | Environment variables (secrets, API keys) |
| `alembic.ini` | Database migration settings |
| `nginx.conf` | Web server configuration |
| `docker-compose.yml` | Container orchestration |
| `tailwind.config.js` | CSS framework settings |
| `vite.config.js` | Frontend build configuration |

## 📝 Code Standards

### Backend (Python)
- PEP 8 style guide
- Type hints (mypy)
- Async/await for I/O operations
- Service layer pattern
- Dependency injection

### Frontend (JavaScript)
- ES6+ features
- Functional components
- React Hooks
- Axios for API calls
- TailwindCSS for styling

## 🧪 Testing

### Backend Tests
```bash
pytest tests/ -v --cov=app
```

### Frontend Tests
```bash
cd frontend && npm test
```

### Load Testing
```bash
ab -n 1000 -c 10 http://localhost/api/v1/loans/
```

## 📞 Support & Maintenance

### Logs Location
- Application: `logs/app.log`
- Nginx: `logs/nginx/access.log`, `logs/nginx/error.log`
- Celery: `logs/celery.log`

### Health Check
```bash
curl http://localhost/health
```

### Backup Database
```bash
# Docker
docker-compose exec db pg_dump -U postgres dccb_production > backup.sql

# Traditional
pg_dump -U dccb_user dccb_production > backup.sql
```

## 🎯 Next Steps

1. Review `PRODUCTION_CHECKLIST.md` before deploying
2. Follow `DEPLOY_QUICKSTART.md` for deployment
3. Configure monitoring and alerts
4. Set up automated backups
5. Perform load testing
6. Train users on the system

---

**Built with ❤️ for District Central Cooperative Banks**
