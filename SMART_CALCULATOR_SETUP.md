# Smart Calculator - Quick Setup Guide

## Installation & Setup

### 1. Install Dependencies
```bash
# Backend dependencies already in requirements.txt
pip install google-generativeai  # Should already be installed
```

### 2. Run Database Migration
```bash
# Create tables for smart calculator
alembic upgrade head
```

### 3. Verify Environment Variables
```bash
# Check .env file has:
GEMINI_API_KEY=AIzaSyDYv5Wrh4Fd2nBHbriJIaw7ftgPmyY5jKo
REDIS_URL=redis://localhost:6379/0
```

### 4. Start Backend Server
```bash
cd "D:\DCCB LOAN MANAGEMENT"
uvicorn app.main:app --reload
```

### 5. Start Frontend
```bash
cd frontend
npm run dev
```

## Access Smart Calculator

### Farmer Access
1. Login as farmer
2. Go to "My Loans"
3. Click on any loan
4. Click "Smart Calculator" button
5. URL: http://localhost:5173/farmer/loans/{loan_id}/calculator

### Employee Access
1. Login as employee
2. Go to "Farmer Management"
3. Search for farmer
4. View their loans
5. Click "Calculator" button
6. URL: http://localhost:5173/employee/loans/{loan_id}/calculator

## Test the Features

### Test 1: Calculate Interest for 10 Days
```bash
curl -X POST http://localhost:8000/api/v1/smart-calculator/calculate/interest-for-days \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "loan_id": 1,
    "days": 10
  }'
```

### Test 2: Get Tomorrow's Interest
```bash
curl http://localhost:8000/api/v1/smart-calculator/calculate/interest-tomorrow/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 3: Simulate Prepayment
```bash
curl -X POST http://localhost:8000/api/v1/smart-calculator/simulate/payment \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "loan_id": 1,
    "payment_amount": 50000,
    "payment_date": "2025-12-15",
    "simulation_type": "prepayment",
    "reduce_emi": true
  }'
```

### Test 4: AI Explanation
```bash
curl -X POST http://localhost:8000/api/v1/smart-calculator/ai/explain \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "calculation_data": {
      "interest_amount": 342.47,
      "days": 10,
      "principal": 100000
    },
    "language": "hindi"
  }'
```

### Test 5: Run Daily Accrual (Admin Only)
```bash
curl -X POST http://localhost:8000/api/v1/smart-calculator/admin/run-daily-accrual \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## Setup Daily Accrual Job

### Windows (Task Scheduler)
```powershell
# Create scheduled task
$action = New-ScheduledTaskAction -Execute 'python' -Argument '"D:\DCCB LOAN MANAGEMENT\app\tasks\daily_accrual.py"'
$trigger = New-ScheduledTaskTrigger -Daily -At 12:05AM
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
Register-ScheduledTask -Action $action -Trigger $trigger -Principal $principal -TaskName "DCCB_DailyAccrual" -Description "Daily interest accrual for DCCB loans"
```

### Linux (Cron)
```bash
# Edit crontab
crontab -e

# Add line (runs at 00:05 AM daily)
5 0 * * * cd /path/to/DCCB\ LOAN\ MANAGEMENT && /usr/bin/python3 app/tasks/daily_accrual.py >> /var/log/dccb_accrual.log 2>&1
```

## Verify Installation

### Check API Documentation
Open: http://localhost:8000/docs

Look for new section: **Smart Calculator & AI**

Should see endpoints:
- POST `/smart-calculator/calculate/interest-for-days`
- GET `/smart-calculator/calculate/interest-tomorrow/{loan_id}`
- POST `/smart-calculator/simulate/payment`
- POST `/smart-calculator/ai/explain`
- POST `/smart-calculator/ai/suggest-repayment`
- etc.

### Check Database Tables
```sql
-- Connect to PostgreSQL
psql -U postgres -d DCCBLOANMANAGEMENT

-- Check new tables exist
\dt loan_ledgers
\dt accrual_jobs
\dt calculation_cache
\dt audit_logs

-- Should show all 4 tables
```

### Test Frontend Components
1. Open browser: http://localhost:5173
2. Login as farmer
3. Navigate to any loan
4. Should see "Smart Calculator" tab/button
5. Click to open calculator interface
6. Should see 3 tabs:
   - Instant Calculations
   - What-If Simulations
   - AI Assistant

## Common Issues & Solutions

### Issue 1: "Module 'google.generativeai' not found"
```bash
Solution:
pip install google-generativeai==0.3.1
```

### Issue 2: "Table 'loan_ledgers' doesn't exist"
```bash
Solution:
alembic upgrade head
```

### Issue 3: AI explanations return error
```bash
Solution:
Check GEMINI_API_KEY in .env file
Test API key: curl https://generativelanguage.googleapis.com/v1beta/models \
  -H "x-goog-api-key: YOUR_KEY"
```

### Issue 4: Calculator not showing in UI
```bash
Solution:
1. Check frontend route is added
2. Restart frontend: npm run dev
3. Clear browser cache
4. Check console for errors
```

### Issue 5: Daily accrual job not running
```bash
Solution:
1. Test manually first:
   python app/tasks/daily_accrual.py
   
2. Check logs for errors

3. Verify cron/task scheduler is active:
   Windows: Get-ScheduledTask -TaskName "DCCB_DailyAccrual"
   Linux: crontab -l
```

## Next Steps

1. **Add Routes in Frontend**
   - Update farmer loan detail page to include calculator link
   - Update employee farmer view to include calculator link

2. **Test with Real Data**
   - Create test loans
   - Run calculations
   - Verify results

3. **Setup Monitoring**
   - Monitor accrual job execution
   - Track calculation cache hit rate
   - Review audit logs

4. **Train Users**
   - Demo to farmers: How to use simulations
   - Demo to employees: How to help farmers
   - Explain AI features in local language

## Quick Reference Card

### Farmer Features
| Feature | What It Does |
|---------|--------------|
| Interest for Days | Calculate interest for any number of days |
| Tomorrow's Interest | Quick view of next day's interest |
| EMI Schedule | See all EMIs and payment status |
| Early Payment Sim | See effect of making extra payment |
| Prepayment Sim | Choose to reduce EMI or tenure |
| AI Explanation | Get simple explanation in local language |
| Repayment Plan | AI suggests best payment strategy |

### Employee Features
| Feature | What It Does |
|---------|--------------|
| All Farmer Features | Everything farmers can do |
| Penalty Calculation | Calculate overdue penalties |
| Rate Switching | Check if rate increase applies |
| Comprehensive Analysis | Full loan analysis with all calculations |
| Batch Operations | Process multiple loans (admin) |

## Support Contacts

- Technical Issues: Check logs in `app/logs/`
- API Issues: http://localhost:8000/docs
- Database Issues: Check connection string in .env
- Frontend Issues: Check browser console

## Success Metrics

After setup, verify:
- ✅ API endpoints respond correctly
- ✅ Database tables created
- ✅ Frontend calculator loads
- ✅ Calculations are accurate
- ✅ AI explanations work
- ✅ Daily accrual job runs
- ✅ Audit logs are created
- ✅ Farmers can access calculator
- ✅ Employees can access calculator

## Resources

- Full Documentation: `SMART_CALCULATOR_DOCS.md`
- API Reference: http://localhost:8000/docs
- Frontend Component: `frontend/src/components/SmartCalculator.jsx`
- Backend Service: `app/services/smart_calculator.py`
- Daily Task: `app/tasks/daily_accrual.py`

---

**Setup Complete!** 🎉

The Smart Automation Calculator is now ready to use in both farmer and employee dashboards.
