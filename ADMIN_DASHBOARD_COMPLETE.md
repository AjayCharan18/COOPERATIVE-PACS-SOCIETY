# Admin Dashboard - Complete Implementation Guide

## Overview
This document describes the complete Admin Dashboard implementation for the COOPERATIVE PACS Loan Management System. All backend APIs are implemented and ready for frontend integration.

---

## 🎯 Features Implemented

### 1. System-Wide Overview
**Endpoint**: `GET /api/v1/dashboard/admin/system-overview`  
**Access**: Admin only  
**Description**: Comprehensive system-wide statistics and metrics

**Response Structure**:
```json
{
  "user_statistics": {
    "total_farmers": 150,
    "total_employees": 20,
    "total_admins": 3,
    "active_users": 168,
    "total_users": 173
  },
  "loan_statistics": {
    "total_loans": 500,
    "pending_loans": 25,
    "approved_loans": 50,
    "active_loans": 300,
    "closed_loans": 100,
    "rejected_loans": 25,
    "total_principal": 50000000.00,
    "total_outstanding": 35000000.00,
    "portfolio_at_risk": 2500000.00
  },
  "collection_statistics": {
    "today": {"count": 45, "amount": 125000.00},
    "this_month": {"count": 850, "amount": 3500000.00},
    "this_year": {"count": 9500, "amount": 38000000.00}
  },
  "npa_statistics": {
    "npa_loan_count": 15,
    "npa_amount": 1500000.00,
    "npa_percentage": 4.29,
    "gross_npa_ratio": 4.29
  },
  "branch_performance": [
    {
      "branch_id": 1,
      "branch_name": "Main Branch",
      "total_loans": 150,
      "total_disbursed": 15000000.00,
      "total_outstanding": 12000000.00,
      "farmer_count": 50
    }
  ],
  "recent_activity": {
    "recent_loans_count": 10,
    "last_loan_date": "2025-01-27T10:30:00"
  }
}
```

---

### 2. Employee Management
**Base Path**: `/api/v1/auth/users/employees/`  
**Access**: Admin only

#### 2.1 Toggle Employee Status
**Endpoint**: `PUT /api/v1/auth/users/employees/{employee_id}/toggle-status`  
**Description**: Activate or deactivate employee accounts

**Response**:
```json
{
  "id": 5,
  "full_name": "John Doe",
  "is_active": false,
  "message": "Employee deactivated successfully"
}
```

#### 2.2 Assign Employee to Branch
**Endpoint**: `PUT /api/v1/auth/users/employees/{employee_id}/assign-branch`  
**Query Parameters**:
- `branch_id` (integer, required)

**Response**:
```json
{
  "id": 5,
  "full_name": "John Doe",
  "old_branch_id": 1,
  "new_branch_id": 2,
  "branch_name": "North Branch",
  "message": "Branch assigned successfully"
}
```

#### 2.3 Get Employee Performance
**Endpoint**: `GET /api/v1/auth/users/employees/{employee_id}/performance`  
**Description**: View detailed performance metrics for an employee

**Response**:
```json
{
  "employee_id": 5,
  "employee_name": "John Doe",
  "branch_id": 1,
  "performance": {
    "loans_processed": 125,
    "loans_approved": 100,
    "active_loans": 85,
    "total_disbursed": 12500000.00,
    "payments_received": 450,
    "total_collected": 5500000.00
  },
  "account_info": {
    "is_active": true,
    "last_login": "2025-01-27T09:15:00",
    "created_at": "2024-01-15T10:00:00"
  }
}
```

---

### 3. Multi-Branch Analytics
**Endpoint**: `GET /api/v1/dashboard/admin/branch-analytics`  
**Access**: Admin only  
**Description**: Comprehensive comparison of all branches

**Response Structure**:
```json
{
  "branch_count": 5,
  "branches": [
    {
      "branch_id": 1,
      "branch_name": "Main Branch",
      "branch_code": "MAIN01",
      "location": {
        "address": "123 Main St",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400001"
      },
      "contact": {
        "phone": "+91-9876543210",
        "email": "main@cooperative.com",
        "manager": "Mr. Manager"
      },
      "loan_statistics": {
        "total_loans": 150,
        "pending": 10,
        "approved": 15,
        "active": 100,
        "closed": 20,
        "rejected": 5,
        "total_principal": 15000000.00,
        "outstanding_balance": 12000000.00
      },
      "collection_statistics": {
        "this_month_count": 250,
        "this_month_amount": 1250000.00,
        "collection_efficiency": 10.42
      },
      "npa_statistics": {
        "npa_count": 5,
        "npa_amount": 500000.00,
        "npa_percentage": 4.17
      },
      "resource_statistics": {
        "farmer_count": 50,
        "employee_count": 5,
        "loans_per_employee": 30.00,
        "farmers_per_employee": 10.00,
        "avg_loan_size": 120000.00
      },
      "status": {
        "is_active": true,
        "created_at": "2024-01-01T00:00:00"
      }
    }
  ],
  "system_totals": {
    "total_loans": 500,
    "total_outstanding": 35000000.00,
    "total_collections_this_month": 3500000.00,
    "total_npa": 2500000.00,
    "system_npa_percentage": 7.14
  },
  "rankings": {
    "top_by_outstanding": [
      {"rank": 1, "branch_id": 1, "branch_name": "Main Branch", "outstanding": 12000000.00}
    ],
    "top_by_collections": [
      {"rank": 1, "branch_id": 2, "branch_name": "North Branch", "collections": 1500000.00}
    ],
    "best_by_npa": [
      {"rank": 1, "branch_id": 3, "branch_name": "South Branch", "npa_percentage": 2.5}
    ]
  }
}
```

---

### 4. System Configuration Management
**Base Path**: `/api/v1/admin/config/`  
**Access**: Admin only

#### 4.1 Get All Loan Type Configurations
**Endpoint**: `GET /api/v1/admin/config/loan-types`  
**Description**: View all loan type settings

**Response**: Array of loan type configurations

#### 4.2 Get Specific Loan Type Config
**Endpoint**: `GET /api/v1/admin/config/loan-types/{loan_type}`  
**Parameters**:
- `loan_type`: SAO | LONG_TERM_EMI | SHORT_TERM | CROP_LOAN | GOLD_LOAN

**Response**:
```json
{
  "id": 1,
  "loan_type": "SAO",
  "display_name": "Short Term Agriculture",
  "description": "Short-term agricultural loans",
  "default_interest_rate": 7.0,
  "default_tenure_months": 12,
  "min_amount": 10000.0,
  "max_amount": 500000.0,
  "interest_calculation_type": "PRORATA_DAILY",
  "penal_interest_rate": 2.0,
  "overdue_days_for_penalty": 90,
  "requires_emi": false,
  "emi_frequency": "monthly",
  "min_land_area": 0.5,
  "eligible_crops": "[\"Rice\", \"Wheat\", \"Cotton\"]",
  "is_active": true
}
```

#### 4.3 Update Loan Type Configuration
**Endpoint**: `PUT /api/v1/admin/config/loan-types/{loan_type}`  
**Body**: LoanTypeConfigUpdate schema (all fields optional)

**Example Request**:
```json
{
  "default_interest_rate": 7.5,
  "penal_interest_rate": 2.5,
  "max_amount": 600000.0
}
```

**Response**:
```json
{
  "message": "Loan type SAO configuration updated successfully",
  "loan_type": "SAO",
  "updated_fields": ["default_interest_rate", "penal_interest_rate", "max_amount"]
}
```

#### 4.4 Toggle Loan Type Status
**Endpoint**: `POST /api/v1/admin/config/loan-types/{loan_type}/toggle-status`  
**Description**: Activate/deactivate a loan type

#### 4.5 Get Interest Rate Summary
**Endpoint**: `GET /api/v1/admin/config/interest-rates/summary`  
**Description**: Overview of all interest rates across loan types

#### 4.6 Bulk Update Interest Rates
**Endpoint**: `POST /api/v1/admin/config/interest-rates/bulk-update`  
**Query Parameters**:
- `rate_adjustment_percentage`: -50 to +50 (percentage change)

**Example**: `POST /api/v1/admin/config/interest-rates/bulk-update?rate_adjustment_percentage=5`  
*Increases all rates by 5%*

**Response**:
```json
{
  "message": "All interest rates adjusted by 5%",
  "updated_count": 5,
  "details": [
    {"loan_type": "SAO", "old_rate": 7.0, "new_rate": 7.35},
    {"loan_type": "LONG_TERM_EMI", "old_rate": 12.0, "new_rate": 12.6}
  ]
}
```

#### 4.7 System Settings
**Endpoint**: `GET /api/v1/admin/config/system-settings`  
**Endpoint**: `PUT /api/v1/admin/config/system-settings`  
**Description**: Manage global system settings

---

### 5. Audit & Activity Logs
**Base Path**: `/api/v1/admin/audit/`  
**Access**: Admin only

#### 5.1 Get Audit Logs with Filters
**Endpoint**: `GET /api/v1/admin/audit/`  
**Query Parameters**:
- `action` (string, optional) - Filter by action type
- `entity_type` (string, optional) - Filter by entity (loan, payment, user)
- `entity_id` (integer, optional) - Filter by specific entity ID
- `actor_id` (integer, optional) - Filter by user who performed action
- `start_date` (datetime, optional) - Start date
- `end_date` (datetime, optional) - End date
- `limit` (integer, default 100, max 1000) - Results per page
- `offset` (integer, default 0) - Pagination offset

**Response**: Array of audit log entries

#### 5.2 Get Recent Activity
**Endpoint**: `GET /api/v1/admin/audit/recent`  
**Query Parameters**:
- `hours` (integer, default 24, max 168) - Look back period
- `limit` (integer, default 50, max 500)

**Description**: Quick view of recent system activities

#### 5.3 Get User Activity
**Endpoint**: `GET /api/v1/admin/audit/user/{user_id}`  
**Query Parameters**:
- `days` (integer, default 30, max 365)
- `limit` (integer, default 100, max 1000)

**Description**: All activities performed by a specific user

#### 5.4 Get Audit Statistics
**Endpoint**: `GET /api/v1/admin/audit/statistics`  
**Query Parameters**:
- `days` (integer, default 30, max 365)

**Response**:
```json
{
  "period_days": 30,
  "total_activities": 5420,
  "by_action": [
    {"action": "CREATE_PAYMENT", "count": 1250},
    {"action": "APPROVE_LOAN", "count": 850},
    {"action": "LOGIN", "count": 650}
  ],
  "by_entity_type": [
    {"entity_type": "payment", "count": 2100},
    {"entity_type": "loan", "count": 1800},
    {"entity_type": "user", "count": 500}
  ],
  "by_user": [
    {"actor_name": "admin@system.com", "actor_type": "user", "count": 450},
    {"actor_name": "employee1@branch.com", "actor_type": "user", "count": 380}
  ]
}
```

#### 5.5 Get Entity History
**Endpoint**: `GET /api/v1/admin/audit/entity/{entity_type}/{entity_id}`  
**Description**: Complete audit trail for a specific loan, payment, or user

---

## 📊 API Endpoints Summary

### Dashboard & Analytics
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/dashboard/admin/system-overview` | GET | System-wide statistics |
| `/api/v1/dashboard/admin/branch-analytics` | GET | Multi-branch comparison |

### Employee Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/users/employees/` | GET | List all employees |
| `/api/v1/auth/users/employees/{id}/toggle-status` | PUT | Activate/deactivate |
| `/api/v1/auth/users/employees/{id}/assign-branch` | PUT | Change branch assignment |
| `/api/v1/auth/users/employees/{id}/performance` | GET | Performance metrics |

### System Configuration
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/admin/config/loan-types` | GET | All loan type configs |
| `/api/v1/admin/config/loan-types/{type}` | GET | Specific loan type |
| `/api/v1/admin/config/loan-types/{type}` | PUT | Update loan type |
| `/api/v1/admin/config/loan-types/{type}/toggle-status` | POST | Activate/deactivate |
| `/api/v1/admin/config/interest-rates/summary` | GET | Interest rate overview |
| `/api/v1/admin/config/interest-rates/bulk-update` | POST | Bulk rate adjustment |
| `/api/v1/admin/config/system-settings` | GET/PUT | Global settings |

### Audit Logs
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/admin/audit/` | GET | Filtered audit logs |
| `/api/v1/admin/audit/recent` | GET | Recent activities |
| `/api/v1/admin/audit/user/{id}` | GET | User activity history |
| `/api/v1/admin/audit/statistics` | GET | Audit statistics |
| `/api/v1/admin/audit/entity/{type}/{id}` | GET | Entity history |

---

## 🔒 Security & Access Control

### Authentication
- All admin endpoints require JWT Bearer token
- Token must belong to user with `role = ADMIN`
- Enforced via `require_admin` dependency

### Authorization Checks
```python
from app.api.deps import require_admin

@router.get("/admin-only-endpoint")
async def admin_function(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    # Only admins can access this
    pass
```

### Error Responses
- **401 Unauthorized**: Missing or invalid token
- **403 Forbidden**: Valid token but insufficient permissions
- **404 Not Found**: Resource doesn't exist

---

## 📈 Performance Considerations

### Database Queries
- All endpoints use async SQLAlchemy
- Proper indexing on commonly filtered columns
- Pagination for large result sets
- Aggregation queries optimized with `select()` and `func`

### Response Times
- System overview: ~200-500ms (depends on data volume)
- Branch analytics: ~300-800ms (iterates through all branches)
- Audit logs: ~100-300ms (indexed timestamps)
- Configuration endpoints: ~50-150ms (small datasets)

### Caching Recommendations
- System overview can be cached for 5-10 minutes
- Branch analytics can be cached for 30 minutes
- Loan type configs rarely change, cache for hours
- Audit logs should NOT be cached (real-time compliance)

---

## 🎨 Frontend Integration Guide

### Required React Components

#### 1. AdminDashboard.jsx
Main dashboard with:
- System overview cards (users, loans, collections, NPA)
- Recent activity feed
- Quick action buttons
- Branch performance summary table

#### 2. EmployeeManagement.jsx
Employee management panel with:
- Employee list table
- Activate/deactivate toggle buttons
- Branch assignment dropdown
- Performance metrics modal

#### 3. BranchAnalytics.jsx
Multi-branch comparison with:
- Branch comparison table
- Rankings (top performers)
- Charts: Outstanding by branch, NPA comparison
- Filters: By location, active/inactive

#### 4. SystemConfiguration.jsx
Configuration panel with:
- Loan type cards (editable)
- Interest rate sliders
- Bulk update controls
- System settings form

#### 5. AuditLogViewer.jsx
Audit log viewer with:
- Filterable table (date, action, entity, user)
- Statistics dashboard
- User activity timeline
- Entity history modal

### API Integration Example

```javascript
// services/api.js
export const adminApi = {
  // System Overview
  getSystemOverview: () => api.get('/dashboard/admin/system-overview'),
  
  // Employee Management
  getEmployees: () => api.get('/auth/users/employees'),
  toggleEmployeeStatus: (id) => api.put(`/auth/users/employees/${id}/toggle-status`),
  assignBranch: (id, branchId) => api.put(`/auth/users/employees/${id}/assign-branch?branch_id=${branchId}`),
  getEmployeePerformance: (id) => api.get(`/auth/users/employees/${id}/performance`),
  
  // Branch Analytics
  getBranchAnalytics: () => api.get('/dashboard/admin/branch-analytics'),
  
  // Configuration
  getLoanTypes: () => api.get('/admin/config/loan-types'),
  updateLoanType: (type, data) => api.put(`/admin/config/loan-types/${type}`, data),
  bulkUpdateRates: (percentage) => api.post(`/admin/config/interest-rates/bulk-update?rate_adjustment_percentage=${percentage}`),
  
  // Audit Logs
  getAuditLogs: (filters) => api.get('/admin/audit/', { params: filters }),
  getRecentActivity: (hours) => api.get(`/admin/audit/recent?hours=${hours}`),
  getAuditStats: (days) => api.get(`/admin/audit/statistics?days=${days}`)
};
```

---

## 🧪 Testing the APIs

### Using FastAPI Docs
1. Navigate to `http://localhost:8000/docs`
2. Click "Authorize" button
3. Enter Bearer token: `Bearer your_admin_jwt_token`
4. Test any admin endpoint

### Example cURL Requests

```bash
# Get system overview
curl -X GET "http://localhost:8000/api/v1/dashboard/admin/system-overview" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Toggle employee status
curl -X PUT "http://localhost:8000/api/v1/auth/users/employees/5/toggle-status" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Get branch analytics
curl -X GET "http://localhost:8000/api/v1/dashboard/admin/branch-analytics" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Bulk update interest rates (increase by 5%)
curl -X POST "http://localhost:8000/api/v1/admin/config/interest-rates/bulk-update?rate_adjustment_percentage=5" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Get recent audit logs (last 48 hours)
curl -X GET "http://localhost:8000/api/v1/admin/audit/recent?hours=48&limit=100" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 📝 Next Steps for Frontend

### Priority Order
1. **Admin Dashboard** (High Priority)
   - System overview cards
   - Recent activity feed
   - Quick stats visualization

2. **Employee Management** (High Priority)
   - Employee list with actions
   - Branch assignment interface

3. **Branch Analytics** (Medium Priority)
   - Comparison tables
   - Performance charts

4. **System Configuration** (Medium Priority)
   - Loan type editor
   - Interest rate manager

5. **Audit Log Viewer** (Low Priority)
   - Searchable audit trail
   - Statistics dashboard

### Design Recommendations
- Use card-based layout for dashboard
- Implement data tables with sorting/filtering
- Add charts using Chart.js or Recharts
- Use modals for detailed views
- Implement real-time updates with polling or WebSockets

---

## ✅ Implementation Checklist

### Backend (COMPLETED ✅)
- [x] System overview endpoint
- [x] Employee management endpoints (3 endpoints)
- [x] Branch analytics endpoint
- [x] Loan type configuration endpoints (7 endpoints)
- [x] Audit log endpoints (5 endpoints)
- [x] All endpoints registered in API router
- [x] Access control with `require_admin`
- [x] Comprehensive error handling
- [x] Response schemas defined

### Frontend (PENDING)
- [ ] Admin Dashboard component
- [ ] Employee Management component
- [ ] Branch Analytics component
- [ ] System Configuration component
- [ ] Audit Log Viewer component
- [ ] API integration in services
- [ ] Navigation menu updates
- [ ] Charts and visualizations

---

## 🔗 Related Documentation
- [ACCESS_CONTROL_SUMMARY.md](./ACCESS_CONTROL_SUMMARY.md) - Access control details
- [API_REFERENCE.md](./API_REFERENCE.md) - Complete API documentation
- [SMART_CALCULATOR_DOCS.md](./SMART_CALCULATOR_DOCS.md) - Smart Calculator features

---

**Last Updated**: January 27, 2025  
**Status**: Backend Complete, Frontend Pending  
**Version**: 1.0.0
