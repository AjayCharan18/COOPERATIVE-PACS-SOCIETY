# Quick Start Guide - DCCB Loan Management System

## 🚀 Run the Project in 5 Minutes

### Step 1: Start Backend

```powershell
# Activate virtual environment
.\venv\Scripts\activate

# Install dependencies (first time only)
pip install -r requirements.txt

# Start the API server
uvicorn app.main:app --reload
```

**Backend running at:** http://localhost:8000
**API Docs:** http://localhost:8000/docs

### Step 2: Start Frontend

```powershell
# Open new terminal
cd frontend

# Install dependencies (first time only)
npm install

# Start dev server
npm run dev
```

**Frontend running at:** http://localhost:5173

### Step 3: (Optional) Start Background Tasks

```powershell
# Open new terminal for Celery worker
.\venv\Scripts\activate
celery -A app.core.celery_app worker --loglevel=info --pool=solo

# Open another terminal for Celery beat
.\venv\Scripts\activate
celery -A app.core.celery_app beat --loglevel=info
```

### Step 4: Seed Database (First Time)

```powershell
# Make sure backend is running
python scripts/seed_data.py
```

### Step 5: Login

Open http://localhost:5173 and login with:

**Farmer:**
- Email: `farmer@dccb.com`
- Password: `Farmer@123`

**Employee:**
- Email: `employee@dccb.com`
- Password: `Employee@123`

**Admin:**
- Email: `admin@dccb.com`
- Password: `Admin@123`

## 🎯 Quick Test Flow

1. Login as **Employee**
2. Create a new loan application
3. Approve the loan as **Admin**
4. Make a payment as **Farmer**
5. View loan ledger and statistics

## 🔧 Troubleshooting

**Backend won't start?**
- Check if Python virtual environment is activated
- Verify .env file exists with correct DATABASE_URL
- Ensure PostgreSQL is running

**Frontend won't start?**
- Run `npm install` in frontend directory
- Check if port 5173 is available

**Database connection error?**
- Verify PostgreSQL is running on port 5433
- Check DATABASE_URL in .env file
- Create database: `createdb -U postgres DCCBLOANMANAGEMENT`

## 📱 Test API Endpoints

Visit http://localhost:8000/docs for interactive API documentation.

Try these endpoints:
- POST `/api/v1/auth/login` - Login
- GET `/api/v1/loans` - Get loans
- POST `/api/v1/loans` - Create loan
- POST `/api/v1/payments` - Make payment

## 🎓 Next Steps

1. Read [FEATURES.md](FEATURES.md) for complete feature list
2. Read [SETUP.md](SETUP.md) for detailed setup
3. Explore the API docs at http://localhost:8000/docs
4. Customize loan types in Admin panel

---

**Support:** Check README.md for detailed information
