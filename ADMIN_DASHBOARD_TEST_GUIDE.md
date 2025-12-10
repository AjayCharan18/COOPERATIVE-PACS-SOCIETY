# Admin Dashboard - Quick Test Guide

## 🚀 Getting Started

### Prerequisites
1. Backend server running on `http://localhost:8000`
2. Admin user credentials
3. Valid JWT token

### Get Admin Token

```bash
# Login as admin
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@system.com",
    "password": "your_password"
  }'

# Save the access_token from response
export ADMIN_TOKEN="your_token_here"
```

---

## 📊 Test System Overview

```bash
curl -X GET "http://localhost:8000/api/v1/dashboard/admin/system-overview" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

**Expected Response**: JSON with user stats, loan stats, collections, NPA, branch performance

**Key Metrics to Verify**:
- ✅ Total farmers, employees, admins
- ✅ Loan counts by status
- ✅ Today's collections
- ✅ NPA percentage
- ✅ Branch-wise breakdown

---

## 👥 Test Employee Management

### 1. List All Employees
```bash
curl -X GET "http://localhost:8000/api/v1/auth/users/employees" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

### 2. Toggle Employee Status
```bash
# Replace 5 with actual employee ID
curl -X PUT "http://localhost:8000/api/v1/auth/users/employees/5/toggle-status" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

### 3. Assign Employee to Branch
```bash
# Replace 5 with employee ID, 2 with branch ID
curl -X PUT "http://localhost:8000/api/v1/auth/users/employees/5/assign-branch?branch_id=2" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

### 4. Get Employee Performance
```bash
curl -X GET "http://localhost:8000/api/v1/auth/users/employees/5/performance" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

**Expected**: Loans processed, collections made, activity stats

---

## 🏢 Test Branch Analytics

```bash
curl -X GET "http://localhost:8000/api/v1/dashboard/admin/branch-analytics" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

**Expected Response**: Complete analytics for all branches including:
- ✅ Loan statistics per branch
- ✅ Collection statistics
- ✅ NPA percentages
- ✅ Resource statistics (farmers, employees)
- ✅ Rankings (top by outstanding, collections, best NPA)

**What to Look For**:
- Branch comparison data
- Top 5 performers by different metrics
- System-wide totals
- Efficiency metrics (loans per employee, etc.)

---

## ⚙️ Test System Configuration

### 1. Get All Loan Types
```bash
curl -X GET "http://localhost:8000/api/v1/admin/config/loan-types" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

### 2. Get Specific Loan Type
```bash
curl -X GET "http://localhost:8000/api/v1/admin/config/loan-types/SAO" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

### 3. Update Loan Type Settings
```bash
curl -X PUT "http://localhost:8000/api/v1/admin/config/loan-types/SAO" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "default_interest_rate": 7.5,
    "penal_interest_rate": 2.5,
    "max_amount": 600000.0
  }' | jq
```

### 4. Toggle Loan Type Status
```bash
curl -X POST "http://localhost:8000/api/v1/admin/config/loan-types/SAO/toggle-status" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

### 5. Get Interest Rate Summary
```bash
curl -X GET "http://localhost:8000/api/v1/admin/config/interest-rates/summary" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

### 6. Bulk Update Interest Rates
```bash
# Increase all rates by 5%
curl -X POST "http://localhost:8000/api/v1/admin/config/interest-rates/bulk-update?rate_adjustment_percentage=5" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq

# Decrease all rates by 3%
curl -X POST "http://localhost:8000/api/v1/admin/config/interest-rates/bulk-update?rate_adjustment_percentage=-3" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

**Expected**: Shows old and new rates for all loan types

### 7. Get System Settings
```bash
curl -X GET "http://localhost:8000/api/v1/admin/config/system-settings" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

---

## 📋 Test Audit Logs

### 1. Get Recent Activity (Last 24 Hours)
```bash
curl -X GET "http://localhost:8000/api/v1/admin/audit/recent?hours=24&limit=50" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

### 2. Get Filtered Audit Logs
```bash
# Filter by action
curl -X GET "http://localhost:8000/api/v1/admin/audit/?action=CREATE_PAYMENT&limit=100" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq

# Filter by entity type
curl -X GET "http://localhost:8000/api/v1/admin/audit/?entity_type=loan&limit=100" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq

# Filter by date range
curl -X GET "http://localhost:8000/api/v1/admin/audit/?start_date=2025-01-01T00:00:00&end_date=2025-01-27T23:59:59" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

### 3. Get User Activity History
```bash
# Replace 5 with actual user ID
curl -X GET "http://localhost:8000/api/v1/admin/audit/user/5?days=30&limit=100" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

### 4. Get Audit Statistics
```bash
curl -X GET "http://localhost:8000/api/v1/admin/audit/statistics?days=30" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

**Expected**: Breakdown by action type, entity type, and top users

### 5. Get Entity History
```bash
# Get all changes to loan ID 10
curl -X GET "http://localhost:8000/api/v1/admin/audit/entity/loan/10" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq

# Get all changes to payment ID 25
curl -X GET "http://localhost:8000/api/v1/admin/audit/entity/payment/25" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

---

## 🔍 Verification Checklist

### System Overview ✅
- [ ] User statistics show correct counts
- [ ] Loan statistics match database
- [ ] Collections data is accurate
- [ ] NPA calculation is correct
- [ ] Branch performance data populated

### Employee Management ✅
- [ ] Can list all employees
- [ ] Toggle status works (active/inactive)
- [ ] Branch assignment updates correctly
- [ ] Performance metrics are calculated
- [ ] Proper error for non-existent employee

### Branch Analytics ✅
- [ ] All branches listed
- [ ] Statistics are accurate per branch
- [ ] Rankings show top performers
- [ ] System totals match sum of branches
- [ ] Efficiency metrics calculated correctly

### System Configuration ✅
- [ ] Can view all loan type configs
- [ ] Update endpoint modifies settings
- [ ] Toggle status works
- [ ] Bulk update affects all loan types
- [ ] Interest rate summary is correct

### Audit Logs ✅
- [ ] Recent activity shows latest entries
- [ ] Filters work correctly
- [ ] User activity history is accurate
- [ ] Statistics breakdown is correct
- [ ] Entity history shows all changes

---

## 🐛 Common Issues & Solutions

### Issue: 401 Unauthorized
**Solution**: Check if token is valid and not expired. Re-login to get fresh token.

### Issue: 403 Forbidden
**Solution**: Endpoint requires admin role. Ensure logged-in user has `role = ADMIN`.

### Issue: 404 Not Found
**Solution**: Check if the resource (employee ID, branch ID, etc.) exists in database.

### Issue: 422 Validation Error
**Solution**: Check request body/parameters match expected schema. See error details.

### Issue: Empty response arrays
**Solution**: Database might not have data. Seed sample data first.

---

## 📚 API Documentation

For complete API documentation with all schemas and examples:

```bash
# Open FastAPI interactive docs
http://localhost:8000/docs

# Or OpenAPI JSON spec
http://localhost:8000/openapi.json
```

---

## 🎯 Quick Test Script

Save this as `test_admin_apis.sh`:

```bash
#!/bin/bash

# Set your admin token
ADMIN_TOKEN="your_admin_token_here"
BASE_URL="http://localhost:8000/api/v1"

echo "🔍 Testing Admin Dashboard APIs..."

echo "\n📊 1. System Overview"
curl -s -X GET "$BASE_URL/dashboard/admin/system-overview" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.user_statistics, .loan_statistics'

echo "\n🏢 2. Branch Analytics"
curl -s -X GET "$BASE_URL/dashboard/admin/branch-analytics" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.branch_count, .system_totals'

echo "\n👥 3. Employee List"
curl -s -X GET "$BASE_URL/auth/users/employees" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.[0:3]'

echo "\n⚙️ 4. Loan Type Configs"
curl -s -X GET "$BASE_URL/admin/config/loan-types" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.[0:2] | .[] | {loan_type, default_interest_rate, is_active}'

echo "\n📋 5. Recent Audit Logs"
curl -s -X GET "$BASE_URL/admin/audit/recent?hours=24&limit=10" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.[0:5] | .[] | {action, entity_type, actor_name, timestamp}'

echo "\n✅ All tests complete!"
```

Make executable and run:
```bash
chmod +x test_admin_apis.sh
./test_admin_apis.sh
```

---

## 📝 Next Steps

1. **Test all endpoints** using the commands above
2. **Verify data accuracy** against database
3. **Check response times** under load
4. **Start building frontend** components
5. **Integrate with React** dashboard

---

**Happy Testing! 🚀**
