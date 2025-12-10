# Smart Calculator - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Start the Backend
```bash
cd "d:\DCCB LOAN MANAGEMENT"
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Step 2: Start the Frontend
```bash
cd frontend
npm run dev
```

### Step 3: Use Smart Calculator
1. Open browser: http://localhost:5173
2. Login as Employee or Admin
3. Click "Smart Calculator" in menu
4. Select a loan and start calculating!

---

## 📊 7 Calculators in One

### 1️⃣ Pro-Rata Interest (Daily Interest)
**Use Case:** "Farmer wants to pay after 40 days. What's the interest?"

**Steps:**
1. Select loan
2. Click "Pro-Rata Interest" tab
3. Set from/to dates
4. Click "Calculate Interest"

**Result:**
```
Total Days: 40
Principal: ₹50,000
Interest Rate: 7%
Total Interest: ₹383.56
```

---

### 2️⃣ Interest Projections
**Use Case:** "How much will farmer owe tomorrow? Next month?"

**Steps:**
1. Select loan
2. Click "Interest Projections" tab
3. Click "Calculate Projections"

**Result:**
```
Today: ₹50,000
Tomorrow: ₹50,009.59
After 10 days: ₹50,095.89
Next month: ₹50,287.67
```

---

### 3️⃣ Overdue Calculator
**Use Case:** "Farmer delayed EMI by 35 days. What's the penalty?"

**Steps:**
1. Select loan
2. Click "Overdue Calculator" tab
3. Enter overdue amount: ₹5,000
4. Enter overdue days: 35
5. Click "Calculate Overdue"

**Result:**
```
Overdue Amount: ₹5,000
Penalty Tier: 31-90 days (4% penalty)
Overdue Interest: ₹67.12
Penalty: ₹200
Total Due: ₹5,267.12
```

---

### 4️⃣ EMI Amortization Table
**Use Case:** "Show me the EMI schedule like bank statement"

**Steps:**
1. Select EMI-based loan
2. Click "EMI Amortization" tab
3. Click "Generate Amortization Table"

**Result:**
```
EMI #1: ₹8,884 (Principal: ₹7,884 + Interest: ₹1,000)
EMI #2: ₹8,884 (Principal: ₹7,963 + Interest: ₹921)
...
Total Payment: ₹1,06,619
Total Interest: ₹6,619
```

---

### 5️⃣ Loan Ledger
**Use Case:** "Generate complete account statement"

**Steps:**
1. Select loan
2. Click "Loan Ledger" tab
3. Click "Generate Ledger"

**Result:**
```
Date       | Description        | Credit  | Debit   | Interest | Balance
-----------|-------------------|---------|---------|----------|----------
01-Jan-24  | Loan Disbursed    | 0       | 50,000  | 0        | 50,000
31-Jan-24  | Interest Accrued  | 0       | 0       | 416.67   | 50,416.67
05-Feb-24  | Payment Received  | 5,000   | 0       | 0        | 45,416.67
```

---

### 6️⃣ Loan Scheme Comparison
**Use Case:** "Which loan is best for ₹2,00,000?"

**Steps:**
1. Click "Compare Schemes" tab
2. Enter amount: ₹2,00,000
3. Enter tenure: 24 months
4. Select schemes to compare
5. Click "Compare Schemes"

**Result:**
```
SAO:
- EMI: ₹8,700
- Total Interest: ₹8,800
- Total Payment: ₹2,08,800

Long Term EMI:
- EMI: ₹9,200
- Total Interest: ₹12,800
- Total Payment: ₹2,12,800

✓ Best Choice: SAO (Save ₹4,000)
```

---

### 7️⃣ Smart AI Recommendations
**Use Case:** "Should farmer pay early? Prepay?"

**Steps:**
1. Select loan
2. Click "Smart Advice" tab
3. Enter farmer's monthly income (optional)
4. Click "Get Smart Recommendations"

**Result:**
```
✓ Pay before month-end to save ₹850 in interest
✓ EMI is only 28% of income. You can afford ₹5,000 prepayment
✓ Consider part-payment of ₹10,000 to reduce interest by ₹2,400
✓ Check if you qualify for Rythu Bandhu scheme (lower rate)

Quick Actions:
[Pay Today ₹51,500] [Prepay 10% ₹5,000]
```

---

## 💡 Common Scenarios

### Scenario 1: Farmer Late Payment
**Question:** "I'm 15 days late. What do I owe?"

**Answer:**
1. Use **Overdue Calculator**
2. Enter EMI amount and 15 days
3. Show penalty (2% for 0-30 days)

---

### Scenario 2: Farmer Wants to Pay Early
**Question:** "I want to pay next week. How much interest?"

**Answer:**
1. Use **Pro-Rata Interest**
2. Set date range: today to next week
3. Show exact interest amount

---

### Scenario 3: New Loan Inquiry
**Question:** "Which loan should I take?"

**Answer:**
1. Use **Loan Scheme Comparison**
2. Enter desired amount and tenure
3. Compare all eligible schemes
4. Recommend best option

---

### Scenario 4: Prepayment Decision
**Question:** "Should I pay extra ₹10,000?"

**Answer:**
1. Use **Smart AI Recommendations**
2. Enter farmer's income
3. Show AI advice on prepayment benefits

---

## 🎯 Key Features

✅ **Automatic Rate Switching**
- SAO: 7% → 13.75% after 1 year
- Long Term: 12% → 12.75% after 1 year
- Rythu: 12.5% → 14.5% after 1 year

✅ **Tiered Penalties**
- 0-30 days: 2%
- 31-90 days: 4%
- >90 days: 6%

✅ **AI-Powered**
- Uses Google Gemini for smart recommendations
- Analyzes loan data and farmer income
- Provides actionable advice

✅ **Bank-Style Reports**
- EMI amortization tables
- Complete loan ledgers
- Professional formatting

---

## 📱 Access Points

### For Employees & Admins:
- **Menu:** Click "Smart Calculator" in top navigation
- **Direct URL:** http://localhost:5173/calculator

### Navigation Menu Location:
```
Dashboard → Loans → Payments → [Smart Calculator] → Farmers → ...
```

---

## 🔑 Authentication Required

Smart Calculator is available only for:
- ✅ **Employees**
- ✅ **Admins**
- ❌ Not available for farmers (they see their own calculations in their dashboard)

---

## 💻 Technical Requirements

### Backend:
- Python 3.11+
- FastAPI running on port 8000
- Database with loan data

### Frontend:
- Node.js with Vite
- React application on port 5173
- User logged in as Employee/Admin

### Optional:
- Google Gemini API key for AI recommendations
- (Falls back to rule-based if not available)

---

## 📖 Documentation

- **Complete Guide:** `SMART_CALCULATOR_COMPLETE.md`
- **Implementation Details:** `SMART_CALCULATOR_IMPLEMENTATION.md`
- **This Guide:** `SMART_CALCULATOR_QUICKSTART.md`

---

## 🆘 Troubleshooting

### Calculator Not Loading?
1. Check backend is running: http://localhost:8000/docs
2. Check frontend is running: http://localhost:5173
3. Check logged in as Employee/Admin
4. Check browser console for errors

### No Loans Showing?
1. Create test loans in system
2. Ensure loans are status: ACTIVE or APPROVED
3. Check loan has disbursement_date set

### AI Recommendations Not Working?
1. Check Gemini API key in config
2. System will use rule-based recommendations as fallback
3. No error shown to user

### Rate Not Switching?
1. Check loan disbursement_date
2. Ensure loan is >365 days old
3. Check loan_type matches configuration

---

## 🎉 Quick Demo

1. **Login:** Employee credentials
2. **Navigate:** Smart Calculator
3. **Select:** Any active loan
4. **Try:** "Interest Projections" first (easiest)
5. **Click:** "Calculate Projections"
6. **See:** Today, tomorrow, 10 days, next month instantly!

---

## 📊 Sample Test Data

If you need test loans:
```bash
cd "d:\DCCB LOAN MANAGEMENT"
python scripts/create_sample_loans.py
```

This creates loans with:
- Different types (SAO, Long Term, etc.)
- Various amounts and tenures
- Disbursement dates (some >1 year old for rate switching)

---

## 🚀 Ready to Go!

The Smart Calculator is **fully functional** and ready to use. It automates all manual PACS calculations and provides AI-powered recommendations.

**Start using it now to save time and serve farmers better!** 🎯
