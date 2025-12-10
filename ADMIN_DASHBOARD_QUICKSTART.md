# Admin Dashboard - Quick Start Guide

## 🚀 Start the Application

### 1. Start Backend Server
```powershell
cd "d:\DCCB LOAN MANAGEMENT"
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Start Frontend Server
```powershell
cd "d:\DCCB LOAN MANAGEMENT\frontend"
npm run dev
```

### 3. Access URLs
- **Frontend**: http://localhost:5173
- **Backend API Docs**: http://localhost:8000/docs
- **Backend**: http://localhost:8000

---

## 👤 Login as Admin

1. Go to: http://localhost:5173/login/employee
2. Login with admin credentials:
   - Email: `admin@system.com` (or your admin email)
   - Password: Your admin password

---

## 📊 Access Admin Features

Once logged in as admin, you'll see three new menu items in the navigation:

### 1. **System Overview**
- URL: http://localhost:5173/admin/overview
- Shows: User stats, loan portfolio, collections, NPA, branch performance
- Features: Real-time refresh, color-coded metrics

### 2. **Employee Management**
- URL: http://localhost:5173/admin/employees
- Shows: Employee list with search and filters
- Actions:
  - Activate/Deactivate employees
  - Assign employees to branches
  - View performance metrics

### 3. **System Configuration**
- URL: http://localhost:5173/admin/configuration
- Shows: All loan type configurations
- Actions:
  - Edit loan type settings (rates, amounts, tenure)
  - Bulk update interest rates
  - Toggle loan type active/inactive

---

## 🎯 Key Features to Try

### System Overview Dashboard
1. Click **"System Overview"** in navigation
2. View real-time statistics
3. Click **"Refresh"** to update data
4. Scroll down to see branch performance table

### Employee Management
1. Click **"Employee Mgmt"** in navigation
2. Search for employees by name/email
3. Filter by branch using dropdown
4. Click **"Activate"/"Deactivate"** to toggle status
5. Click **"Performance"** to view detailed metrics
6. Use branch dropdown to reassign employee

### System Configuration
1. Click **"Configuration"** in navigation
2. View interest rate summary at top
3. Click **"Edit"** on any loan type
4. Modify settings (rates, amounts, etc.)
5. Click **"Save Changes"**
6. Try **Bulk Adjustment**: Enter percentage (e.g., 5 or -3)
7. Click **"Apply to All Loan Types"**

---

## 🧪 Test Backend APIs

### Get Admin Token
```bash
# Login
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@system.com",
    "password": "your_password"
  }'

# Copy the access_token from response
```

### Test Endpoints
```bash
# Set token
export TOKEN="your_token_here"

# System Overview
curl "http://localhost:8000/api/v1/dashboard/admin/system-overview" \
  -H "Authorization: Bearer $TOKEN"

# Employee List
curl "http://localhost:8000/api/v1/auth/users/employees" \
  -H "Authorization: Bearer $TOKEN"

# Branch Analytics
curl "http://localhost:8000/api/v1/dashboard/admin/branch-analytics" \
  -H "Authorization: Bearer $TOKEN"

# Loan Type Configs
curl "http://localhost:8000/api/v1/admin/config/loan-types" \
  -H "Authorization: Bearer $TOKEN"

# Recent Audit Logs
curl "http://localhost:8000/api/v1/admin/audit/recent?hours=24" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📱 UI Components Guide

### AdminDashboard.jsx
**Location**: `/admin/overview`

**Components**:
- `StatCard` - User statistics with icons
- `LoanStatCard` - Loan portfolio metrics
- `MiniStatCard` - Loan status counts
- `CollectionCard` - Collection statistics
- NPA statistics section
- Branch performance table

**Key Functions**:
- `fetchSystemOverview()` - Loads all data
- `handleRefresh()` - Refreshes data
- `formatCurrency()` - ₹ formatting
- `formatNumber()` - Indian number format

### EmployeeManagement.jsx
**Location**: `/admin/employees`

**Components**:
- Employee list table
- Search input
- Branch filter dropdown
- Performance modal
- `MetricCard` - Performance metrics

**Key Functions**:
- `handleToggleStatus()` - Activate/deactivate
- `handleAssignBranch()` - Change branch
- `handleViewPerformance()` - Show performance modal
- Filtering logic for search and branch

### SystemConfiguration.jsx
**Location**: `/admin/configuration`

**Components**:
- Interest rate summary (gradient card)
- Bulk adjustment section
- Loan type cards (view/edit modes)
- `ConfigItem` - Configuration display

**Key Functions**:
- `handleEdit()` - Switch to edit mode
- `handleSave()` - Save configuration
- `handleToggleStatus()` - Activate/deactivate loan type
- `handleBulkUpdate()` - Bulk rate adjustment

---

## 🎨 Customization Tips

### Change Colors
Edit Tailwind classes in components:
- `bg-indigo-500` → Your brand color
- `text-blue-600` → Your text color
- `border-green-200` → Your border color

### Add More Metrics
1. Update backend endpoint to return new data
2. Add new stat card in frontend component
3. Use existing `StatCard` or `LoanStatCard` components

### Modify Table Columns
1. Edit table `<thead>` to add/remove headers
2. Update `<tbody>` mapping to show new data
3. Adjust grid/flex layouts as needed

---

## 🐛 Troubleshooting

### "Failed to fetch" Error
- **Check**: Backend server is running on port 8000
- **Fix**: Start backend with `python -m uvicorn app.main:app --reload`

### "401 Unauthorized"
- **Check**: You're logged in as admin
- **Fix**: Logout and login again with admin credentials

### "403 Forbidden"
- **Check**: Current user has admin role
- **Fix**: Use admin account, not employee or farmer

### Empty Data
- **Check**: Database has data
- **Fix**: Run seed scripts or create sample data

### Navigation Items Not Showing
- **Check**: User role is 'admin'
- **Fix**: Verify user.role in localStorage or database

---

## 📊 Sample Data Requirements

For best results, ensure you have:
- ✅ At least 5-10 branches in database
- ✅ At least 10-20 employees
- ✅ At least 50-100 farmers
- ✅ At least 100-200 loans
- ✅ At least 200-500 payments
- ✅ Loan types configured (SAO, LONG_TERM_EMI, etc.)

---

## 🔍 Feature Checklist

### System Overview ✅
- [x] User statistics cards
- [x] Loan portfolio metrics
- [x] Collections (today/month/year)
- [x] NPA calculation
- [x] Branch performance table
- [x] Refresh functionality

### Employee Management ✅
- [x] Employee list
- [x] Search employees
- [x] Filter by branch
- [x] Toggle active status
- [x] Assign to branch
- [x] View performance metrics

### System Configuration ✅
- [x] View loan types
- [x] Edit configurations
- [x] Update interest rates
- [x] Bulk rate adjustment
- [x] Toggle loan type status
- [x] Interest rate summary

---

## 📖 Documentation

- **Complete Guide**: `ADMIN_DASHBOARD_COMPLETE.md`
- **Testing Guide**: `ADMIN_DASHBOARD_TEST_GUIDE.md`
- **API Reference**: `API_REFERENCE.md`
- **Access Control**: `ACCESS_CONTROL_SUMMARY.md`

---

## 🎉 You're Ready!

All admin dashboard features are fully functional. Start exploring and managing your COOPERATIVE PACS Loan Management System!

**Questions?** Check the documentation files or API docs at http://localhost:8000/docs

**Happy Managing! 🚀**
