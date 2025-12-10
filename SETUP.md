# DCCB Loan Management - Setup and Installation Guide

## 🚀 Complete Setup Instructions

### Prerequisites

Make sure you have the following installed:
- Python 3.10+
- PostgreSQL 13+
- Redis 6+
- Node.js 18+
- Tesseract OCR

### Backend Setup

1. **Create and activate virtual environment:**
```powershell
python -m venv venv
.\venv\Scripts\activate
```

2. **Install Python dependencies:**
```powershell
pip install -r requirements.txt
```

3. **Setup PostgreSQL database:**
```powershell
# Create database (using psql or pgAdmin)
createdb -U postgres DCCBLOANMANAGEMENT
```

4. **Initialize database with Alembic:**
```powershell
# Create migration
alembic init alembic

# Generate initial migration
alembic revision --autogenerate -m "Initial migration"

# Apply migrations
alembic upgrade head
```

5. **Start Redis:**
```powershell
# If Redis is installed as Windows service
redis-server

# Or using Docker
docker run -d -p 6379:6379 redis:latest
```

6. **Run the FastAPI application:**
```powershell
uvicorn app.main:app --reload
```

The API will be available at: http://localhost:8000

### Celery Workers

Open new terminal windows for each:

**Terminal 1 - Celery Worker:**
```powershell
.\venv\Scripts\activate
celery -A app.core.celery_app worker --loglevel=info --pool=solo
```

**Terminal 2 - Celery Beat (Scheduler):**
```powershell
.\venv\Scripts\activate
celery -A app.core.celery_app beat --loglevel=info
```

**Terminal 3 - Flower (Optional - Celery Monitoring):**
```powershell
.\venv\Scripts\activate
celery -A app.core.celery_app flower
```

### Frontend Setup

1. **Navigate to frontend directory:**
```powershell
cd frontend
```

2. **Install dependencies:**
```powershell
npm install
```

3. **Start development server:**
```powershell
npm run dev
```

The frontend will be available at: http://localhost:5173

### 📝 Default Login Credentials

After running seed data (optional):

**Admin:**
- Email: admin@dccb.com
- Password: Admin@123

**Employee:**
- Email: employee@dccb.com
- Password: Employee@123

**Farmer:**
- Email: farmer@dccb.com
- Password: Farmer@123

### 🔧 Configuration

All configuration is in `.env` file. Key settings:

- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `GEMINI_API_KEY`: Google Gemini API key for AI features
- `TWILIO_*`: Twilio credentials for SMS
- `WHATSAPP_*`: WhatsApp Business API credentials

### 📚 API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 🎯 Features Implemented

✅ Multiple loan types (SAO, Long-term EMI, Rythu Bandhu, etc.)
✅ Interest calculator (Pro-rata, EMI, Simple, Compound)
✅ Role-based access control (Admin, Employee, Farmer)
✅ Loan approval workflow
✅ Payment processing and ledger
✅ EMI schedule generation
✅ Notification system (SMS/WhatsApp/Email)
✅ ML-based risk assessment
✅ OCR for document processing
✅ Loan rescheduling
✅ Dashboard with statistics
✅ Multilingual support structure

### 🔍 Testing the System

1. **Register a new user:**
```bash
POST http://localhost:8000/api/v1/auth/register
```

2. **Login:**
```bash
POST http://localhost:8000/api/v1/auth/login
```

3. **Create a loan:**
```bash
POST http://localhost:8000/api/v1/loans
```

4. **Make a payment:**
```bash
POST http://localhost:8000/api/v1/payments
```

### 🐛 Troubleshooting

**Database connection issues:**
- Verify PostgreSQL is running
- Check DATABASE_URL in .env

**Redis connection issues:**
- Ensure Redis server is running
- Check REDIS_URL in .env

**Import errors:**
- Make sure virtual environment is activated
- Reinstall dependencies: `pip install -r requirements.txt`

### 📱 Mobile App (Future)

React Native mobile app can be added in `mobile/` directory with similar structure.

### 🌍 Multilingual Support

Add translations in `app/services/translation_service.py` for:
- Telugu (తెలుగు)
- Kannada (ಕನ್ನಡ)
- Hindi (हिंदी)

### 🎓 Training ML Model

To train the default prediction model with your data:

```python
from app.services.ml_service import MLService

# Prepare training data
training_data = [...]  # Your historical loan data

# Train model
MLService.train_model(training_data)
```

### 📊 Reports

Generate reports using Celery tasks:
- Monthly loan reports
- NPA reports
- Branch-wise analysis
- Recovery reports

For support, refer to the documentation or create an issue in the repository.
