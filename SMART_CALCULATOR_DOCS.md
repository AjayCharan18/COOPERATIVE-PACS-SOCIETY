# Smart Automation Calculator - Complete Documentation

## Overview

The Smart Automation Calculator is an AI-powered loan calculation system that provides:
- Instant calculations for arbitrary periods
- What-if simulations for payment scenarios
- Automated daily interest accrual
- Tiered penalty calculations
- AI-assisted explanations in multiple languages
- Complete audit trail and ledger management

## Features

### 1. Instant Single-Loan Calculations

#### Calculate Interest for Arbitrary Days
```python
# API Endpoint
POST /api/v1/smart-calculator/calculate/interest-for-days

# Request
{
  "loan_id": 123,
  "days": 10,
  "from_date": "2025-12-01"  # Optional
}

# Response
{
  "loan_id": 123,
  "days": 10,
  "start_date": "2025-12-01",
  "end_date": "2025-12-11",
  "principal": 100000.00,
  "annual_rate": 12.50,
  "daily_rate": 0.034247,
  "interest_amount": 342.47,
  "explanation": "Interest for 10 days:\nPrincipal: ₹1,00,000.00\n..."
}
```

#### Calculate Tomorrow's Interest
```python
# API Endpoint
GET /api/v1/smart-calculator/calculate/interest-tomorrow/{loan_id}

# Quick calculation for next day's interest
```

#### EMI Schedule & Outstanding for Any Date
```python
# API Endpoint
POST /api/v1/smart-calculator/calculate/emi-schedule

# Request
{
  "loan_id": 123,
  "as_of_date": "2025-12-06"
}

# Shows loan status on specific date with full EMI schedule
```

### 2. Simulation / What-If Analysis

#### Simulate Early Payment
```python
# API Endpoint
POST /api/v1/smart-calculator/simulate/payment

# Request
{
  "loan_id": 123,
  "payment_amount": 50000,
  "payment_date": "2025-12-15",
  "simulation_type": "early_payment"
}

# Response shows:
# - New outstanding balance
# - New EMI amount
# - Interest saved
# - New maturity date
```

#### Simulate Prepayment
```python
# Request
{
  "loan_id": 123,
  "payment_amount": 50000,
  "payment_date": "2025-12-15",
  "simulation_type": "prepayment",
  "reduce_emi": true  # or false to reduce tenure
}

# Two options:
# 1. Reduce EMI (keep tenure same)
# 2. Reduce Tenure (keep EMI same)
```

### 3. Incremental Accrual & Ledger Entries

#### Daily Accrual Job
```python
# Automated task runs daily at 00:05 AM
# Posts interest entries to loan_ledgers table

# Manual trigger (Admin only)
POST /api/v1/smart-calculator/admin/run-daily-accrual?accrual_date=2025-12-06

# Features:
# - Idempotency: Won't duplicate if already processed
# - Batch processing: All active loans
# - Audit trail: Logs all actions
# - Error handling: Continues on individual failures
```

#### Ledger Structure
```sql
CREATE TABLE loan_ledgers (
    id SERIAL PRIMARY KEY,
    loan_id INTEGER NOT NULL,
    transaction_date DATE NOT NULL,
    transaction_type VARCHAR(50),  -- DAILY_ACCRUAL, PAYMENT, RATE_CHANGE
    debit_amount NUMERIC(15,2),    -- Interest accrued, fees
    credit_amount NUMERIC(15,2),   -- Payments received
    balance NUMERIC(15,2),         -- Running balance
    description TEXT,
    narration TEXT,                -- Human-readable
    interest_rate_applied NUMERIC(5,2),
    days_calculated INTEGER,
    created_by VARCHAR(100),
    created_at TIMESTAMP
);
```

### 4. Rate Switching & Rollovers

```python
# API Endpoint
GET /api/v1/smart-calculator/rate/check-switching/{loan_id}?as_of_date=2025-12-06

# Automatically applies rate increases after 1 year
# Example: 12.5% → 13.0% after 365 days

# Response includes:
# - Current rate
# - New rate (if applicable)
# - Switch date
# - Rule applied
# - Explanation
```

**Rate Switching Rules:**
- Loans > 1 year: +0.5% increase
- Records date and rule in audit log
- Automatic application during accrual

### 5. Penalty & Tiered Penalty Rules

```python
# API Endpoint
POST /api/v1/smart-calculator/penalty/calculate

# Request
{
  "loan_id": 123,
  "overdue_days": 45,
  "overdue_amount": 5000
}

# Tiered Penalty Structure:
# 0-30 days:   2% penalty
# 31-90 days:  4% penalty
# >90 days:    6% penalty
```

### 6. Idempotency & Caching

#### Redis Caching
```python
# Cache key format: calc:loan:{loan_id}:{calculation_type}:{as_of_date}
# Example: calc:loan:123:interest:2025-12-06

# Automatic invalidation on:
# - New payment received
# - Loan modification
# - Rate change
```

#### Idempotent Operations
```sql
-- Accrual jobs tracked to prevent duplicates
CREATE TABLE accrual_jobs (
    id SERIAL PRIMARY KEY,
    job_date DATE UNIQUE NOT NULL,
    status VARCHAR(20),  -- pending, running, completed, failed
    loans_processed INTEGER,
    total_accrual_amount NUMERIC(15,2),
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);
```

### 7. Explainability

#### Human-Readable Explanations
Every calculation returns an `explanation` field:

```
"Interest for 10 days:
Principal: ₹1,00,000.00
Annual Rate: 12.5%
Daily Rate: 0.034247%
Interest = ₹1,00,000.00 × 0.034247% × 10 days
Total Interest: ₹342.47"
```

#### Calculation Breakdown
All responses include:
- Input parameters
- Intermediate calculations
- Formula used
- Step-by-step logic

### 8. Batch Calculation

```python
# API Endpoint
POST /api/v1/smart-calculator/admin/batch-calculation

# Request
{
  "calculation_type": "outstanding",  # or "penalty"
  "as_of_date": "2025-12-06"
}

# Processes all active loans
# Returns summary and individual results
# Used for end-of-day accounting
```

### 9. Audit Trail

```sql
-- All automated actions logged
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    actor_type VARCHAR(20),      -- user, system, worker
    actor_id INTEGER,
    action VARCHAR(100),
    entity_type VARCHAR(50),
    entity_id INTEGER,
    old_value TEXT,              -- JSON
    new_value TEXT,              -- JSON
    rule_applied VARCHAR(100),   -- Business rule
    description TEXT,
    metadata TEXT,               -- JSON
    created_at TIMESTAMP
);

-- Examples:
-- Actor: system, Action: DAILY_ACCRUAL, Description: "Processed 150 loans, ₹50,000 total"
-- Actor: system, Action: RATE_CHANGE, Rule: "RATE_INCREASE_AFTER_1YR"
-- Actor: system, Action: PAYMENT_POSTED, Entity: loan:123
```

### 10. AI-Assisted Assistance

#### AI Explanation (Multi-Language)
```python
# API Endpoint
POST /api/v1/smart-calculator/ai/explain

# Request
{
  "calculation_data": {
    "interest_amount": 342.47,
    "days": 10,
    "principal": 100000
  },
  "language": "hindi"  # english, hindi, marathi, gujarati, telugu, tamil
}

# Uses Google Gemini AI
# Returns simple, farmer-friendly explanation
```

#### AI Repayment Suggestions
```python
# API Endpoint
POST /api/v1/smart-calculator/ai/suggest-repayment

# Request
{
  "loan_id": 123,
  "farmer_income": 25000  # Optional monthly income
}

# AI analyzes:
# - Current loan status
# - Outstanding amount
# - EMI burden
# - Income (if provided)

# Suggests:
# - Optimal EMI amount (30-40% of income)
# - Prepayment recommendations
# - Timeline for full repayment
# - Financial tips
```

## Dashboard Integration

### Farmer Dashboard
```jsx
// Route: /farmer/loans/:id/calculator

<SmartCalculator loanId={123} userRole="farmer" />

// Features accessible:
// ✓ Interest calculations
// ✓ EMI schedule viewer
// ✓ Payment simulations
// ✓ AI explanations in local language
// ✓ Repayment suggestions
```

### Employee Dashboard
```jsx
// Route: /employee/loans/:id/calculator

<SmartCalculator loanId={123} userRole="employee" />

// Additional features:
// ✓ All farmer features
// ✓ Penalty calculations
// ✓ Rate switching info
// ✓ Comprehensive analysis
```

## Usage Examples

### Example 1: Check Tomorrow's Interest
```javascript
// Frontend
const response = await api.get('/smart-calculator/calculate/interest-tomorrow/123');
console.log(`Tomorrow's interest: ₹${response.data.interest_amount}`);
```

### Example 2: Simulate Prepayment
```javascript
// Frontend
const simulation = await api.post('/smart-calculator/simulate/payment', {
  loan_id: 123,
  payment_amount: 50000,
  payment_date: '2025-12-15',
  simulation_type: 'prepayment',
  reduce_emi: true
});

alert(`
  Your EMI will reduce from ₹${simulation.data.current_emi} 
  to ₹${simulation.data.new_emi}
  
  Monthly savings: ₹${simulation.data.current_emi - simulation.data.new_emi}
`);
```

### Example 3: Get AI Suggestion
```javascript
// Frontend
const suggestion = await api.post('/smart-calculator/ai/suggest-repayment', {
  loan_id: 123,
  farmer_income: 25000
});

console.log(suggestion.data.ai_suggestion);
// "Based on your monthly income of ₹25,000, your current EMI of ₹8,500 
//  is within the ideal range (34%). Consider making a prepayment of 
//  ₹20,000 to reduce your EMI to ₹7,000, which will give you more 
//  financial flexibility..."
```

## Scheduled Tasks

### Setup Cron Job (Linux)
```bash
# Edit crontab
crontab -e

# Add daily accrual task (runs at 00:05 AM)
5 0 * * * cd /path/to/app && python -m app.tasks.daily_accrual

# Add penalty calculation (runs at 00:30 AM)
30 0 * * * cd /path/to/app && python -c "from app.tasks.daily_accrual import run_penalty_calculation_task; import asyncio; asyncio.run(run_penalty_calculation_task())"
```

### Windows Task Scheduler
```powershell
# Create daily task
$action = New-ScheduledTaskAction -Execute 'python' -Argument 'C:\path\to\app\tasks\daily_accrual.py'
$trigger = New-ScheduledTaskTrigger -Daily -At 12:05AM
Register-ScheduledTask -Action $action -Trigger $trigger -TaskName "LoanDailyAccrual"
```

## API Reference Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/smart-calculator/calculate/interest-for-days` | POST | Calculate interest for N days |
| `/smart-calculator/calculate/interest-tomorrow/{id}` | GET | Tomorrow's interest |
| `/smart-calculator/calculate/emi-schedule` | POST | EMI schedule as of date |
| `/smart-calculator/simulate/payment` | POST | Simulate payment scenarios |
| `/smart-calculator/rate/check-switching/{id}` | GET | Check rate switching |
| `/smart-calculator/penalty/calculate` | POST | Calculate tiered penalties |
| `/smart-calculator/ai/explain` | POST | AI explanation |
| `/smart-calculator/ai/suggest-repayment` | POST | AI repayment suggestions |
| `/smart-calculator/analyze/{id}` | GET | Comprehensive analysis |
| `/smart-calculator/admin/run-daily-accrual` | POST | Manual accrual trigger |
| `/smart-calculator/admin/batch-calculation` | POST | Batch processing |
| `/smart-calculator/admin/accrual-history` | GET | View accrual job history |

## Database Migrations

```bash
# Create migration for new tables
alembic revision --autogenerate -m "Add smart calculator tables"

# Apply migration
alembic upgrade head
```

## Environment Variables

```bash
# .env file
GEMINI_API_KEY=your_gemini_api_key_here
REDIS_URL=redis://localhost:6379/0
```

## Testing

```python
# Test interest calculation
async def test_interest_calculation():
    calculator = SmartCalculator(db)
    result = await calculator.calculate_interest_for_days(
        loan_id=1,
        days=30,
        from_date=date.today()
    )
    assert result['interest_amount'] > 0
    assert 'explanation' in result

# Test simulation
async def test_prepayment_simulation():
    calculator = SmartCalculator(db)
    result = await calculator.simulate_prepayment(
        loan_id=1,
        prepayment_amount=Decimal('50000'),
        prepayment_date=date.today(),
        reduce_emi=True
    )
    assert result['new_emi'] < result['current_emi']
```

## Benefits

### For Farmers
- ✅ Understand loan calculations in simple terms
- ✅ Plan payments with what-if simulations
- ✅ Get AI guidance in local language
- ✅ See exact interest for any period
- ✅ Make informed prepayment decisions

### For Employees
- ✅ Quick calculations without manual work
- ✅ Help farmers with simulations
- ✅ Accurate penalty calculations
- ✅ Complete audit trail
- ✅ Historical reporting capabilities

### For Bank
- ✅ Automated daily accrual
- ✅ Accurate interest tracking
- ✅ Complete ledger system
- ✅ Regulatory compliance
- ✅ Reduced manual errors
- ✅ Historical audit capability

## Troubleshooting

### Issue: Accrual job not running
```bash
# Check job history
GET /api/v1/smart-calculator/admin/accrual-history?days=7

# Manually trigger
POST /api/v1/smart-calculator/admin/run-daily-accrual
```

### Issue: AI explanations failing
```bash
# Check Gemini API key
echo $GEMINI_API_KEY

# Test API connection
curl https://generativelanguage.googleapis.com/v1beta/models -H "x-goog-api-key: YOUR_KEY"
```

### Issue: Cache not invalidating
```bash
# Clear Redis cache manually
redis-cli FLUSHDB

# Or specific loan
redis-cli DEL calc:loan:123:*
```

## Future Enhancements

1. **Advanced Simulations**
   - Multiple prepayments timeline
   - Variable interest rate scenarios
   - Seasonal payment adjustments

2. **Enhanced AI**
   - Voice-based explanations
   - Chat interface for Q&A
   - Predictive payment defaults

3. **Analytics**
   - Farmer payment patterns
   - Optimal prepayment timing
   - Cash flow forecasting

4. **Notifications**
   - SMS reminders for optimal prepayment dates
   - WhatsApp integration for calculations
   - Email reports

## Support

For issues or questions:
- Check API documentation: http://localhost:8000/docs
- View logs: `app/logs/smart_calculator.log`
- Contact: support@dccb.com
