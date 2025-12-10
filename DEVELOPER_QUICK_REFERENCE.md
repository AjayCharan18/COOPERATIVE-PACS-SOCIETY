# Smart Calculator - Developer Quick Reference

## 🔥 Quick Start

### 1. Import the Service
```python
from app.services.smart_calculator import SmartCalculator
from app.services.daily_accrual_service import DailyAccrualService
```

### 2. Initialize
```python
calculator = SmartCalculator(db, redis_client)
accrual_service = DailyAccrualService(db, redis_client)
```

### 3. Use It!
```python
# Calculate interest
result = await calculator.calculate_interest_for_days(loan_id=1, days=10)

# Simulate payment
sim = await calculator.simulate_prepayment(
    loan_id=1, 
    prepayment_amount=Decimal('50000'),
    prepayment_date=date.today(),
    reduce_emi=True
)

# Run daily accrual
result = await accrual_service.run_daily_accrual()
```

## 📖 Code Examples

### Example 1: Interest Calculation
```python
from app.services.smart_calculator import SmartCalculator
from datetime import date

async def calculate_interest_example(db, loan_id: int):
    calculator = SmartCalculator(db)
    
    # Interest for 10 days
    result = await calculator.calculate_interest_for_days(
        loan_id=loan_id,
        days=10,
        from_date=date.today()
    )
    
    print(f"Interest for 10 days: ₹{result['interest_amount']}")
    print(f"Explanation: {result['explanation']}")
    
    return result
```

### Example 2: Payment Simulation
```python
from decimal import Decimal

async def simulate_payment_example(db, loan_id: int):
    calculator = SmartCalculator(db)
    
    # Simulate ₹50,000 prepayment
    result = await calculator.simulate_prepayment(
        loan_id=loan_id,
        prepayment_amount=Decimal('50000'),
        prepayment_date=date.today(),
        reduce_emi=True  # Option 1: Reduce EMI
    )
    
    print(f"Current EMI: ₹{result['current_emi']}")
    print(f"New EMI: ₹{result['new_emi']}")
    print(f"Savings: ₹{result['current_emi'] - result['new_emi']} per month")
    
    return result
```

### Example 3: AI Explanation
```python
async def get_ai_explanation(db, calculation_data: dict):
    calculator = SmartCalculator(db)
    
    # Get explanation in Hindi
    explanation = await calculator.explain_with_ai(
        calculation_data=calculation_data,
        language='hindi'
    )
    
    print(f"AI Explanation: {explanation}")
    
    return explanation
```

### Example 4: Daily Accrual
```python
from app.services.daily_accrual_service import DailyAccrualService

async def run_daily_accrual_example(db):
    service = DailyAccrualService(db)
    
    # Run accrual for today
    result = await service.run_daily_accrual()
    
    print(f"Loans processed: {result['loans_processed']}")
    print(f"Total accrual: ₹{result['total_accrual']}")
    
    return result
```

### Example 5: Penalty Calculation
```python
async def calculate_penalty_example(db, loan_id: int):
    calculator = SmartCalculator(db)
    
    result = await calculator.calculate_penalty(
        loan_id=loan_id,
        overdue_days=45,
        overdue_amount=Decimal('5000')
    )
    
    print(f"Tier: {result['tier']}")
    print(f"Penalty Rate: {result['penalty_rate']}%")
    print(f"Penalty Amount: ₹{result['penalty_amount']}")
    
    return result
```

## 🎯 API Endpoints Quick Reference

### Public Endpoints (Farmer + Employee)

```bash
# Calculate interest for days
POST /api/v1/smart-calculator/calculate/interest-for-days
Body: { "loan_id": 1, "days": 10 }

# Tomorrow's interest
GET /api/v1/smart-calculator/calculate/interest-tomorrow/1

# EMI schedule
POST /api/v1/smart-calculator/calculate/emi-schedule
Body: { "loan_id": 1, "as_of_date": "2025-12-06" }

# Simulate payment
POST /api/v1/smart-calculator/simulate/payment
Body: {
  "loan_id": 1,
  "payment_amount": 50000,
  "payment_date": "2025-12-15",
  "simulation_type": "prepayment",
  "reduce_emi": true
}

# Check rate switching
GET /api/v1/smart-calculator/rate/check-switching/1?as_of_date=2025-12-06

# Calculate penalty
POST /api/v1/smart-calculator/penalty/calculate
Body: { "loan_id": 1, "overdue_days": 45, "overdue_amount": 5000 }

# AI explanation
POST /api/v1/smart-calculator/ai/explain
Body: {
  "calculation_data": { "interest_amount": 342.47 },
  "language": "hindi"
}

# AI repayment suggestion
POST /api/v1/smart-calculator/ai/suggest-repayment
Body: { "loan_id": 1, "farmer_income": 25000 }

# Comprehensive analysis
GET /api/v1/smart-calculator/analyze/1?include_ai=true&language=english
```

### Admin Endpoints

```bash
# Run daily accrual
POST /api/v1/smart-calculator/admin/run-daily-accrual?accrual_date=2025-12-06

# Batch calculation
POST /api/v1/smart-calculator/admin/batch-calculation?calculation_type=outstanding

# Accrual history
GET /api/v1/smart-calculator/admin/accrual-history?days=7
```

## 🗄️ Database Models

### LoanLedger
```python
from app.models.loan_ledger import LoanLedger

# Create ledger entry
ledger = LoanLedger(
    loan_id=1,
    transaction_date=date.today(),
    transaction_type="DAILY_ACCRUAL",
    debit_amount=Decimal('342.47'),
    credit_amount=Decimal('0'),
    balance=Decimal('100342.47'),
    description="Daily interest accrual",
    created_by="system"
)
db.add(ledger)
await db.commit()
```

### AccrualJob
```python
from app.models.loan_ledger import AccrualJob

# Track accrual job
job = AccrualJob(
    job_date=date.today(),
    status="running",
    started_at=datetime.utcnow()
)
db.add(job)
await db.flush()

# Update when complete
job.status = "completed"
job.loans_processed = 150
job.total_accrual_amount = Decimal('50000')
await db.commit()
```

### AuditLog
```python
from app.models.loan_ledger import AuditLog

# Log action
audit = AuditLog(
    actor_type="system",
    action="DAILY_ACCRUAL",
    description="Processed 150 loans",
    metadata=json.dumps({"total": 50000})
)
db.add(audit)
await db.commit()
```

## 🎨 Frontend Integration

### Import Component
```jsx
import SmartCalculator from '../../components/SmartCalculator';
```

### Use in Page
```jsx
export default function LoanDetail() {
  const { id } = useParams();
  
  return (
    <div>
      <h1>Loan Details</h1>
      
      {/* Smart Calculator */}
      <SmartCalculator loanId={parseInt(id)} userRole="farmer" />
    </div>
  );
}
```

### API Calls from Frontend
```javascript
import api from '../../services/api';

// Calculate interest
const result = await api.post('/smart-calculator/calculate/interest-for-days', {
  loan_id: 1,
  days: 10
});

// Simulate payment
const sim = await api.post('/smart-calculator/simulate/payment', {
  loan_id: 1,
  payment_amount: 50000,
  payment_date: '2025-12-15',
  simulation_type: 'prepayment',
  reduce_emi: true
});

// Get AI explanation
const aiResult = await api.post('/smart-calculator/ai/explain', {
  calculation_data: result.data,
  language: 'hindi'
});
```

## 🔧 Utility Functions

### Helper: Get Outstanding Principal
```python
async def _get_outstanding_principal(db, loan_id: int, as_of_date: date) -> Decimal:
    from app.models.loan import Loan
    from app.models.payment import Payment
    from sqlalchemy import select, and_
    
    # Get loan
    result = await db.execute(select(Loan).where(Loan.id == loan_id))
    loan = result.scalar_one()
    
    # Get payments
    result = await db.execute(
        select(Payment).where(
            and_(
                Payment.loan_id == loan_id,
                Payment.payment_date <= as_of_date
            )
        )
    )
    payments = result.scalars().all()
    total_paid = sum(p.amount for p in payments)
    
    return loan.principal_amount - total_paid
```

### Helper: Calculate EMI
```python
from decimal import Decimal

def calculate_emi(principal: Decimal, annual_rate: Decimal, tenure_months: int) -> Decimal:
    """Calculate EMI using reducing balance method"""
    monthly_rate = annual_rate / Decimal(1200)
    
    if monthly_rate == 0:
        return principal / tenure_months
    
    emi = principal * monthly_rate * (
        (1 + monthly_rate) ** tenure_months
    ) / (
        ((1 + monthly_rate) ** tenure_months) - 1
    )
    
    return emi
```

### Helper: Format Currency
```python
def format_currency(amount: float) -> str:
    """Format amount as Indian currency"""
    return f"₹{amount:,.2f}"
```

## 📊 Testing

### Unit Test Example
```python
import pytest
from decimal import Decimal
from datetime import date

@pytest.mark.asyncio
async def test_interest_calculation(db_session):
    calculator = SmartCalculator(db_session)
    
    result = await calculator.calculate_interest_for_days(
        loan_id=1,
        days=10,
        from_date=date.today()
    )
    
    assert result['days'] == 10
    assert result['interest_amount'] > 0
    assert 'explanation' in result
```

### Integration Test Example
```python
@pytest.mark.asyncio
async def test_daily_accrual(db_session):
    service = DailyAccrualService(db_session)
    
    result = await service.run_daily_accrual(date.today())
    
    assert result['status'] == 'completed'
    assert result['loans_processed'] > 0
    assert result['total_accrual'] > 0
```

## 🐛 Debugging

### Enable Logging
```python
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

logger.debug("Calculating interest for loan %s", loan_id)
logger.info("Result: %s", result)
logger.error("Calculation failed: %s", error)
```

### Check Database
```sql
-- View ledger entries
SELECT * FROM loan_ledgers WHERE loan_id = 1 ORDER BY transaction_date DESC;

-- Check accrual jobs
SELECT * FROM accrual_jobs ORDER BY job_date DESC LIMIT 10;

-- View audit logs
SELECT * FROM audit_logs WHERE action = 'DAILY_ACCRUAL' ORDER BY created_at DESC;
```

### Check Cache
```bash
# Redis CLI
redis-cli

# View all cache keys
KEYS calc:loan:*

# Get specific cache
GET calc:loan:1:interest:2025-12-06

# Clear cache for loan
DEL calc:loan:1:*
```

## 🚀 Performance Tips

1. **Use Caching**
   ```python
   # Calculator automatically uses Redis cache
   # Just pass redis_client
   calculator = SmartCalculator(db, redis_client)
   ```

2. **Batch Operations**
   ```python
   # Process multiple loans efficiently
   result = await service.run_batch_calculation('outstanding')
   ```

3. **Async Execution**
   ```python
   # All methods are async
   await calculator.calculate_interest_for_days(...)
   ```

4. **Index Usage**
   ```sql
   -- Queries use indexes on:
   -- loan_id, transaction_date, created_at
   ```

## 📝 Best Practices

1. **Always use Decimal for money**
   ```python
   # ✅ Good
   amount = Decimal('50000.00')
   
   # ❌ Bad
   amount = 50000.00  # Float precision errors
   ```

2. **Handle errors gracefully**
   ```python
   try:
       result = await calculator.calculate_interest_for_days(...)
   except Exception as e:
       logger.error(f"Calculation failed: {e}")
       # Handle error
   ```

3. **Validate inputs**
   ```python
   if days <= 0:
       raise ValueError("Days must be positive")
   if payment_amount <= 0:
       raise ValueError("Amount must be positive")
   ```

4. **Log important actions**
   ```python
   await self._log_audit(
       actor_type="system",
       action="RATE_CHANGE",
       description=f"Rate changed from {old} to {new}"
   )
   ```

## 🎓 Common Patterns

### Pattern 1: Daily Job
```python
async def daily_job():
    async with async_session_maker() as session:
        service = DailyAccrualService(session)
        result = await service.run_daily_accrual()
        await session.commit()
        return result
```

### Pattern 2: User Action
```python
async def user_calculation(loan_id: int, current_user: User, db: Session):
    calculator = SmartCalculator(db)
    result = await calculator.calculate_interest_for_days(loan_id, 10)
    
    # Log user action
    await log_audit(
        actor_type="user",
        actor_id=current_user.id,
        action="INTEREST_CALCULATION",
        entity_type="loan",
        entity_id=loan_id
    )
    
    return result
```

### Pattern 3: Simulation Flow
```python
async def show_payment_options(loan_id: int, amount: Decimal):
    calculator = SmartCalculator(db)
    
    # Show both options
    reduce_emi = await calculator.simulate_prepayment(
        loan_id, amount, date.today(), reduce_emi=True
    )
    
    reduce_tenure = await calculator.simulate_prepayment(
        loan_id, amount, date.today(), reduce_emi=False
    )
    
    return {
        "option1": reduce_emi,
        "option2": reduce_tenure
    }
```

## 📱 Mobile/API Client Examples

### cURL
```bash
# Get auth token
TOKEN=$(curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"farmer@example.com","password":"password"}' \
  | jq -r '.access_token')

# Calculate interest
curl -X POST http://localhost:8000/api/v1/smart-calculator/calculate/interest-for-days \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"loan_id":1,"days":10}'
```

### Python Requests
```python
import requests

# Login
response = requests.post('http://localhost:8000/api/v1/auth/login', json={
    'email': 'farmer@example.com',
    'password': 'password'
})
token = response.json()['access_token']

# Calculate
response = requests.post(
    'http://localhost:8000/api/v1/smart-calculator/calculate/interest-for-days',
    headers={'Authorization': f'Bearer {token}'},
    json={'loan_id': 1, 'days': 10}
)
result = response.json()
print(f"Interest: ₹{result['interest_amount']}")
```

---

## 🎯 Quick Checklist

- [ ] Import SmartCalculator or DailyAccrualService
- [ ] Initialize with db (and optional redis_client)
- [ ] Call async methods with await
- [ ] Use Decimal for money calculations
- [ ] Handle errors gracefully
- [ ] Log important actions
- [ ] Test thoroughly
- [ ] Check audit logs
- [ ] Monitor performance
- [ ] Clear cache when needed

**Happy Coding!** 🚀
