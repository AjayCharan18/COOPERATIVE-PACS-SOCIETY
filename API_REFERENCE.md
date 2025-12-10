# 🏦 DCCB Loan Management System - API Reference

## Complete Endpoint List

### 🔐 Authentication Endpoints

#### POST `/api/v1/auth/register`
**Description**: Register a new user (Farmer, Employee, or Admin)

**Request Body**:
```json
{
  "email": "user@example.com",
  "mobile": "9999999999",
  "password": "Password@123",
  "full_name": "John Doe",
  "role": "farmer",
  "aadhaar_number": "123456789012",
  "pan_number": "ABCDE1234F",
  "address": "Street Address",
  "village": "Village Name",
  "district": "District Name",
  "state": "Telangana",
  "pincode": "500001"
}
```

**Response**: User object with JWT token

---

#### POST `/api/v1/auth/login`
**Description**: Login and receive JWT token

**Request Body** (form-data):
```
username: user@example.com
password: Password@123
```

**Response**:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJ...",
  "token_type": "bearer"
}
```

---

### 💰 Loan Endpoints

#### POST `/api/v1/loans/`
**Description**: Create a new loan application

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "loan_type": "long_term_emi",
  "principal_amount": 300000,
  "interest_rate": 12.0,
  "tenure_months": 108,
  "purpose": "Agricultural development",
  "branch_id": 2,
  "crop_season": "Kharif 2025"
}
```

**Auto-calculated Fields**:
- `emi_amount`: Automatically calculated for EMI loans
- `total_amount_payable`: Principal + Interest
- `maturity_date`: Sanction date + tenure

---

#### POST `/api/v1/loans/approve`
**Description**: Approve or reject a loan (Employee/Admin only)

**Request Body**:
```json
{
  "loan_id": 1,
  "approved": true,
  "disbursement_date": "2025-12-06",
  "remarks": "Approved after verification"
}
```

**Actions on Approval**:
1. Sets loan status to ACTIVE
2. Sets first EMI date (30 days after disbursement)
3. Generates complete EMI schedule
4. Creates ledger entry for disbursement

---

### 📊 Dashboard Endpoints

#### GET `/api/v1/dashboard/stats/overview`
**Description**: Get overall statistics (Employee/Admin only)

**Response**:
```json
{
  "total_loans": 100,
  "loans_by_status": {
    "active": 60,
    "pending_approval": 20,
    "closed": 15,
    "defaulted": 5
  },
  "total_disbursed": 50000000.00,
  "total_outstanding": 35000000.00,
  "loans_by_type": {
    "sao": 30,
    "long_term_emi": 40,
    "rythu_bandhu": 20
  },
  "recent_loans": [...]
}
```

---

#### GET `/api/v1/dashboard/stats/monthly?months=6`
**Description**: Get monthly disbursement trends

**Response**:
```json
{
  "monthly_stats": [
    {
      "month": "2025-06",
      "loan_count": 15,
      "total_amount": 4500000.00
    },
    ...
  ]
}
```

---

### 📈 Reports & Export

#### GET `/api/v1/reports/loans/export`
**Description**: Export loans to CSV file

**Query Parameters**:
- `status`: Filter by loan status (optional)
- `loan_type`: Filter by loan type (optional)
- `from_date`: Start date (optional)
- `to_date`: End date (optional)

**Response**: CSV file download

**CSV Columns**:
```
Loan Number, Farmer Name, Branch, Loan Type, Principal Amount,
Interest Rate, Tenure, EMI Amount, Status, Disbursement Date,
Outstanding Principal, Outstanding Interest
```

---

#### GET `/api/v1/reports/emi-schedule/export/{loan_id}`
**Description**: Export EMI schedule for a specific loan

**Response**: CSV file with EMI schedule

**CSV Columns**:
```
Installment Number, Due Date, EMI Amount, Principal Component,
Interest Component, Outstanding Principal, Payment Status,
Paid Date, Overdue Days, Penal Interest
```

---

### ⏰ Overdue Management

#### POST `/api/v1/overdue/check-overdue`
**Description**: Check and update all overdue EMIs (Employee/Admin only)

**Response**:
```json
{
  "message": "Overdue EMI check completed",
  "summary": {
    "total_overdue": 25,
    "loans_affected": 15,
    "total_penal_interest": 15000.00
  }
}
```

**Automated Actions**:
1. Calculates overdue days for each unpaid EMI
2. Marks EMIs as overdue if past due date
3. Calculates penal interest (after 90 days default)
4. Updates loan records

---

#### GET `/api/v1/overdue/summary`
**Description**: Get summary of all overdue loans

**Response**:
```json
{
  "total_overdue_loans": 15,
  "loans": [
    {
      "loan_id": 6,
      "loan_number": "LOAN2025120504AE71AC",
      "farmer_name": "John Doe",
      "farmer_mobile": "9999999999",
      "overdue_emis_count": 3,
      "total_overdue_amount": 13665.81,
      "total_penal_interest": 500.00,
      "max_overdue_days": 45,
      "oldest_overdue_date": "2025-10-20"
    },
    ...
  ]
}
```

---

### 🔒 Loan Closure

#### GET `/api/v1/loan-closure/calculate/{loan_id}`
**Description**: Calculate amount required to close a loan

**Response**:
```json
{
  "loan_id": 6,
  "loan_number": "LOAN2025120504AE71AC",
  "outstanding_principal": 298444.73,
  "outstanding_interest": 189000.00,
  "penal_interest": 2500.00,
  "total_closure_amount": 489944.73,
  "unpaid_emis_count": 107,
  "calculation_date": "2025-12-05"
}
```

---

#### POST `/api/v1/loan-closure/close/{loan_id}`
**Description**: Close a loan after full payment (Employee/Admin only)

**Request Body**:
```json
{
  "closure_amount": 489944.73,
  "payment_mode": "cash",
  "remarks": "Full and final settlement"
}
```

**Actions**:
1. Validates closure amount
2. Marks all unpaid EMIs as paid
3. Sets loan status to CLOSED
4. Clears all outstanding amounts

---

### 🔄 Loan Rescheduling

#### GET `/api/v1/loan-rescheduling/options/{loan_id}`
**Description**: Get available rescheduling options (Employee/Admin only)

**Response**:
```json
{
  "loan_id": 6,
  "current_outstanding_principal": 298444.73,
  "current_tenure_months": 108,
  "current_interest_rate": 12.0,
  "current_emi_amount": 4555.27,
  "rescheduling_options": [
    {
      "option": "Extend tenure by 6 months",
      "new_tenure_months": 114,
      "new_emi_amount": 4205.50,
      "savings_per_month": 349.77
    },
    {
      "option": "Extend tenure by 12 months",
      "new_tenure_months": 120,
      "new_emi_amount": 3912.30,
      "savings_per_month": 642.97
    }
  ]
}
```

---

#### POST `/api/v1/loan-rescheduling/reschedule/{loan_id}`
**Description**: Reschedule a loan with new terms (Admin only)

**Request Body**:
```json
{
  "new_tenure_months": 120,
  "new_interest_rate": 11.5,
  "restructure_date": "2025-12-10",
  "reason": "Financial difficulty due to crop failure"
}
```

**Actions**:
1. Updates loan terms
2. Recalculates EMI amount
3. Deletes old unpaid EMI schedule
4. Generates new EMI schedule
5. Updates maturity date
6. Marks loan as RESCHEDULED

---

### 📄 Document Management

#### POST `/api/v1/documents/upload/{loan_id}`
**Description**: Upload a document for a loan

**Headers**: 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Form Data**:
- `file`: Document file (PDF, JPG, PNG, DOC - max 10MB)
- `document_type`: Type (aadhaar, pan, land_records, photo, etc.)

**Response**:
```json
{
  "message": "Document uploaded successfully",
  "document": {
    "id": 1,
    "filename": "aadhaar.pdf",
    "document_type": "aadhaar",
    "file_size": 245678,
    "uploaded_at": "2025-12-05T10:30:00"
  }
}
```

---

#### POST `/api/v1/documents/verify/{document_id}`
**Description**: Verify an uploaded document (Employee/Admin only)

**Request Body**:
```json
{
  "remarks": "Document verified and authentic"
}
```

---

### 🏢 Branch Management

#### GET `/api/v1/branches/statistics/{branch_id}`
**Description**: Get statistics for a specific branch (Employee/Admin only)

**Response**:
```json
{
  "branch_id": 2,
  "total_loans": 50,
  "active_loans": 30,
  "total_disbursed": 15000000.00,
  "total_outstanding": 10500000.00,
  "collection_rate": 30.00,
  "loans_by_status": {
    "active": 30,
    "closed": 15,
    "pending_approval": 5
  },
  "loans_by_type": {
    "sao": 20,
    "long_term_emi": 25,
    "rythu_bandhu": 5
  }
}
```

---

#### GET `/api/v1/branches/comparison`
**Description**: Compare all branches (Admin only)

**Response**:
```json
[
  {
    "branch_id": 1,
    "branch_name": "Main Branch",
    "branch_code": "MAIN001",
    "statistics": { ... }
  },
  {
    "branch_id": 2,
    "branch_name": "Hyderabad Branch",
    "branch_code": "HYD001",
    "statistics": { ... }
  }
]
```

---

## 🔑 Authorization Matrix

| Endpoint Category | Farmer | Employee | Admin |
|-------------------|--------|----------|-------|
| Auth (register, login) | ✅ | ✅ | ✅ |
| Create Loan | ✅ | ✅ | ✅ |
| View Own Loans | ✅ | ❌ | ❌ |
| View All Loans | ❌ | ✅ | ✅ |
| Approve Loans | ❌ | ✅ | ✅ |
| Dashboard | ❌ | ✅ | ✅ |
| Reports | ❌ | ✅ | ✅ |
| Overdue Management | ❌ | ✅ | ✅ |
| Loan Closure | ❌ | ✅ | ✅ |
| Loan Rescheduling | ❌ | ❌ | ✅ |
| Document Upload | ✅ | ✅ | ✅ |
| Document Verify | ❌ | ✅ | ✅ |
| Branch Statistics | ❌ | ✅ (own) | ✅ (all) |

---

## 📝 Notes

- All dates are in ISO 8601 format: `YYYY-MM-DD`
- All amounts are in INR (₹)
- JWT tokens are non-expiring (configurable in production)
- EMI schedules are automatically generated on loan approval
- Penal interest applies after 90 days overdue (configurable)

---

**For complete examples, visit**: http://localhost:8000/docs
