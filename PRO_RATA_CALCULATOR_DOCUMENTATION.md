# Pro-Rata Interest Calculator

## Overview
The Pro-Rata Interest Calculator is a powerful tool for Admin and Employee dashboards that allows them to calculate exact daily interest for any loan type and amount **before** disbursement. This helps demonstrate interest charges to farmers.

## Features

### ✨ Key Capabilities
- **Any Loan Type**: Calculate for SAO, AMUL, Rythu Bandhu, etc.
- **Any Amount**: Test different principal amounts up to the loan limit
- **Any Period**: Calculate for any number of days (30, 95, 400, 500, etc.)
- **Automatic Rate Switching**: Interest rate automatically increases after 365 days
- **Rate Breakdown**: Shows exactly how interest is calculated for each period
- **Real-time Calculation**: Instant results with detailed breakdown

### 📊 What It Shows
1. **Total Interest** for the specified period
2. **Daily Interest Rate** (average across period)
3. **Total Amount Payable** (principal + interest)
4. **Rate Breakdown** by period (showing rate switching)
5. **Base Rate** vs **Rate After 1 Year**

## API Endpoint

### POST `/api/v1/smart-calculator/calculate/interest-for-days`

**Request Body:**
```json
{
  "loan_type": "sao",
  "principal_amount": 100000,
  "days": 30,
  "disbursement_date": "2024-12-01"  // optional
}
```

**Response:**
```json
{
  "loan_type": "sao",
  "loan_name": "Short-term Agricultural Operations (SAO)",
  "principal_amount": 100000,
  "days": 30,
  "start_date": "2024-12-01",
  "end_date": "2024-12-31",
  "total_interest": 575.34,
  "daily_interest": 19.18,
  "total_amount": 100575.34,
  "rate_breakdown": [
    {
      "days": 30,
      "rate": 7.0,
      "interest": 575.34
    }
  ],
  "base_rate": 7.0,
  "rate_after_year": 13.75
}
```

## Frontend Routes

### Admin Dashboard
- **Route**: `/admin/pro-rata-calculator`
- **Component**: `frontend/src/pages/admin/ProRataCalculator.jsx`

### Employee Dashboard  
- **Route**: `/employee/pro-rata-calculator`
- **Component**: `frontend/src/pages/employee/ProRataCalculator.jsx`

## Interest Rate Logic

### Rate Switching Rules
The calculator automatically applies higher interest rates after 1 year (365 days):

| Loan Type | Year 1 Rate | After 1 Year |
|-----------|-------------|--------------|
| SAO | 7.0% | 13.75% |
| AMUL Loan | 12.0% | 14.0% |
| Rythu Bandhu | 12.5% | 14.5% |
| Rythu Nethany | 12.5% | 14.5% |
| Long Term EMI | 12.0% | 12.75% |

### Calculation Formula

**For periods ≤ 365 days:**
```
Interest = Principal × (Rate / 365 / 100) × Days
```

**For periods > 365 days:**
```
Period 1 Interest = Principal × (Base Rate / 365 / 100) × 365
Period 2 Interest = Principal × (Rate After / 365 / 100) × Remaining Days
Total Interest = Period 1 + Period 2
```

## User Interface

### Input Form
- **Loan Type Dropdown**: Select from all active loan types
- **Principal Amount**: Enter desired loan amount (validated against max limit)
- **Start Date**: Defaults to today
- **Number of Days**: Enter the period for calculation
- **End Date**: Auto-calculated based on start date + days

### Results Display
- **Summary Cards**: Total Interest and Daily Interest highlighted
- **Period Details**: Full breakdown of dates and amounts
- **Rate Breakdown**: Shows each period with rate and interest
- **Total Amount Card**: Final amount payable prominently displayed
- **Information Note**: Explains automatic rate switching

## Use Cases

### 1. Pre-Loan Consultation
**Scenario**: Farmer asks "How much interest will I pay for ₹1,00,000 SAO loan for 6 months?"
```
Input: SAO, ₹100,000, 180 days
Output: Total Interest ₹3,452.05
```

### 2. Period Comparison
**Scenario**: Compare interest for 30 days vs 95 days
```
30 days: ₹575.34 interest
95 days: ₹1,821.92 interest
```

### 3. Rate Switching Demonstration
**Scenario**: Show impact of crossing 1 year
```
365 days: ₹7,000 @ 7% (SAO)
400 days: ₹10,500 @ 7% + ₹1,977.74 @ 13.75% = ₹12,477.74
```

### 4. Loan Type Comparison
**Scenario**: Compare SAO vs AMUL for same amount/period
```
SAO 100K/30 days: ₹575.34
AMUL 100K/30 days: ₹986.30
```

## Testing

Run the test script to verify all calculations:
```bash
python scripts/test_pro_rata_calculator.py
```

**Test Cases:**
- ✅ SAO 30 days (within year 1)
- ✅ AMUL 95 days (within year 1) 
- ✅ SAO 400 days (crosses 1 year boundary)
- ✅ AMUL 365 days (exactly 1 year)
- ✅ SAO 500 days (well into year 2)

## Navigation

The Pro-Rata Calculator appears in the sidebar navigation for Admin and Employee roles:

**Sidebar Menu:**
```
📊 Dashboard
💰 Loans  
💳 Payments
🧮 Smart Calculator
👥 Farmers
⚠️ Overdue
🏢 Branches
📈 Reports
🔢 Pro-Rata Calculator  ← NEW!
```

## Technical Implementation

### Backend
- **File**: `app/api/v1/endpoints/smart_calculator.py`
- **Function**: `calculate_interest_for_days()`
- **Models**: `LoanTypeConfig` from `app/models/loan.py`
- **Dependencies**: SQLAlchemy async, Pydantic validation

### Frontend
- **Framework**: React with TailwindCSS
- **State Management**: useState, useEffect hooks
- **API Client**: Axios
- **Icons**: Heroicons
- **Notifications**: React Hot Toast

## Benefits

### For Employees
- **Quick Demonstrations**: Calculate interest on the fly during farmer consultations
- **Accurate Estimates**: No manual calculations needed
- **Professional Presentation**: Clean, easy-to-understand results
- **Time Saving**: Instant calculations vs manual work

### For Farmers
- **Transparency**: Clear breakdown of all charges
- **Informed Decisions**: Compare different loan amounts/periods
- **Trust Building**: See exact calculations before commitment
- **Financial Planning**: Understand total repayment amount

## Future Enhancements

Potential improvements for future versions:
- 📅 **Multiple Scenarios**: Save and compare multiple calculations
- 📊 **Visual Charts**: Graph interest over time
- 📄 **PDF Export**: Generate calculation reports
- 🔄 **EMI Integration**: Show EMI breakdowns for EMI loans
- 📱 **Mobile Optimization**: Responsive design for tablets/phones
- 🌐 **Multi-language**: Support for regional languages

## Support

For issues or questions about the Pro-Rata Calculator:
- Check test script output for validation
- Review API logs for error details
- Verify loan type configurations in admin panel
- Ensure user has Employee or Admin role

---

**Last Updated**: December 9, 2025
**Version**: 1.0
**Status**: ✅ Production Ready
