# 🔐 Access Control & Role-Based Permissions

## Overview
The COOPERATIVE PACS Loan Management System implements a hierarchical access control system with three user roles:

```
┌─────────────────────────────────────────────────┐
│                     ADMIN                       │
│  ✓ Access to ALL farmers                       │
│  ✓ Access to ALL employees                     │
│  ✓ Access to ALL loans                         │
│  ✓ Access to ALL payments                      │
│  ✓ Access to ALL branches                      │
│  ✓ Full system control                         │
└─────────────────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────┐
│                  EMPLOYEE                       │
│  ✓ Access to farmers in THEIR BRANCH           │
│  ✓ Access to loans in THEIR BRANCH             │
│  ✓ Access to payments in THEIR BRANCH          │
│  ✓ Can manage branch operations                │
│  ✗ Cannot see other branches                   │
│  ✗ Cannot access employee list                 │
└─────────────────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────┐
│                   FARMER                        │
│  ✓ Access to THEIR OWN loans only              │
│  ✓ Access to THEIR OWN payments only           │
│  ✓ Can apply for loans                         │
│  ✓ Can make payments                           │
│  ✗ Cannot see other farmers                    │
│  ✗ Cannot access farmer list                   │
│  ✗ Cannot access employee data                 │
└─────────────────────────────────────────────────┘
```

---

## 📋 Detailed Permissions Matrix

### 1. **Farmers Management**

| Endpoint | Farmer | Employee | Admin |
|----------|--------|----------|-------|
| `GET /auth/users/farmers` | ❌ Forbidden | ✅ Branch farmers only | ✅ All farmers |
| `GET /auth/users/farmers/{id}` | ❌ Forbidden | ✅ If in their branch | ✅ All |
| `POST /auth/register-farmer` | ❌ Forbidden | ✅ Can register | ✅ Can register |
| `PUT /auth/users/farmers/{id}` | ❌ Forbidden | ✅ If in their branch | ✅ All |

### 2. **Employee Management**

| Endpoint | Farmer | Employee | Admin |
|----------|--------|----------|-------|
| `GET /auth/users/employees` | ❌ Forbidden | ❌ Forbidden | ✅ All employees |
| `GET /auth/users/employees/{id}` | ❌ Forbidden | ❌ Forbidden | ✅ All |
| `POST /auth/register` (employee) | ❌ Forbidden | ❌ Forbidden | ✅ Can register |
| `PUT /auth/users/employees/{id}` | ❌ Forbidden | ❌ Forbidden | ✅ Can update |

### 3. **Loan Management**

| Endpoint | Farmer | Employee | Admin |
|----------|--------|----------|-------|
| `GET /loans/` | ✅ Own loans | ✅ Branch loans | ✅ All loans |
| `GET /loans/{id}` | ✅ Own loans | ✅ Branch loans | ✅ All loans |
| `POST /loans/` | ✅ Can apply | ✅ Can create | ✅ Can create |
| `PUT /loans/{id}` | ❌ View only | ✅ Branch loans | ✅ All loans |
| `DELETE /loans/{id}` | ❌ Forbidden | ❌ Forbidden | ✅ All loans |
| `POST /loans/{id}/approve` | ❌ Forbidden | ✅ Branch loans | ✅ All loans |
| `POST /loans/{id}/disburse` | ❌ Forbidden | ✅ Branch loans | ✅ All loans |

### 4. **Payment Management**

| Endpoint | Farmer | Employee | Admin |
|----------|--------|----------|-------|
| `GET /payments/` | ✅ Own payments | ✅ Branch payments | ✅ All payments |
| `GET /payments/{id}` | ✅ Own payments | ✅ Branch payments | ✅ All payments |
| `POST /payments/` | ✅ Can pay | ✅ Can record | ✅ Can record |
| `GET /payments/ledger/{loan_id}` | ✅ Own loans | ✅ Branch loans | ✅ All loans |

### 5. **Dashboard & Analytics**

| Endpoint | Farmer | Employee | Admin |
|----------|--------|----------|-------|
| `GET /dashboard/stats` | ❌ Forbidden | ✅ Branch stats | ✅ All stats |
| `GET /dashboard/stats/overview` | ❌ Forbidden | ✅ Branch overview | ✅ All overview |
| `GET /branches/` | ❌ Forbidden | ✅ Their branch | ✅ All branches |
| `GET /reports/` | ❌ Forbidden | ✅ Branch reports | ✅ All reports |

### 6. **Smart Calculator**

| Endpoint | Farmer | Employee | Admin |
|----------|--------|----------|-------|
| `GET /smart-calculator/loans` | ✅ Own active loans | ✅ Branch active loans | ✅ All active loans |
| `POST /smart-calculator/calculate/*` | ✅ Own loans | ✅ Branch loans | ✅ All loans |
| `POST /smart-calculator/compare/*` | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| `POST /smart-calculator/recommendations/*` | ✅ Own loans | ✅ Branch loans | ✅ All loans |

### 7. **Document Management**

| Endpoint | Farmer | Employee | Admin |
|----------|--------|----------|-------|
| `GET /documents/{loan_id}` | ✅ Own loans | ✅ Branch loans | ✅ All loans |
| `POST /documents/{loan_id}` | ✅ Own loans | ✅ Branch loans | ✅ All loans |
| `DELETE /documents/{id}` | ✅ Own docs | ✅ Branch docs | ✅ All docs |

---

## 🔒 Implementation Details

### Backend Access Control

All endpoints use FastAPI dependencies for role checking:

```python
# Auth dependencies (app/api/deps.py)
get_current_user          # Any authenticated user
require_admin             # Admin only
require_employee          # Admin or Employee
require_admin_or_employee # Admin or Employee
require_farmer            # Farmer only

# Role-based filtering in endpoints
if current_user.role == UserRole.FARMER:
    query = query.where(Loan.farmer_id == current_user.id)
elif current_user.role == UserRole.EMPLOYEE:
    query = query.where(Loan.branch_id == current_user.branch_id)
# Admin: No filter (sees all)
```

### Frontend Access Control

Navigation menu dynamically shows/hides based on role:

```javascript
// DashboardLayout.jsx
const baseNavigation = [
    { name: 'Dashboard', roles: ['farmer', 'employee', 'admin'] },
    { name: 'Loans', roles: ['farmer', 'employee', 'admin'] },
    { name: 'Payments', roles: ['farmer', 'employee', 'admin'] },
    { name: 'Smart Calculator', roles: ['farmer', 'employee', 'admin'] },
]

const employeeNavigation = [
    { name: 'Farmers', roles: ['employee', 'admin'] },
    { name: 'Overdue', roles: ['employee', 'admin'] },
    { name: 'Branches', roles: ['employee', 'admin'] },
    { name: 'Reports', roles: ['employee', 'admin'] },
]
```

---

## 🎯 Access Control Rules

### Rule 1: Data Ownership
- **Farmers** can only see their own data
- **Employees** can see all data in their assigned branch
- **Admin** can see all data across all branches

### Rule 2: Branch Isolation
- Employees are assigned to a specific branch (`branch_id`)
- They can only access farmers and loans in their branch
- Cross-branch access is forbidden

### Rule 3: Hierarchical Access
```
Admin > Employee > Farmer
```
- Higher roles inherit permissions of lower roles
- Admin can perform all employee actions
- Admin can perform all farmer actions

### Rule 4: Action Restrictions
- **Loan Approval/Disbursement**: Employee & Admin only
- **Farmer Management**: Employee & Admin only
- **Employee Management**: Admin only
- **System Configuration**: Admin only

### Rule 5: Single Admin
- Only ONE admin should exist in the system
- Admin has superuser privileges
- Admin can create/manage employees
- Employees can create/manage farmers

---

## 🔐 Security Features

### 1. **JWT Token Authentication**
- All API requests require Bearer token
- Tokens expire after configured time
- Refresh token mechanism available

### 2. **Password Security**
- Minimum 8 characters
- Must contain uppercase, lowercase, and digit
- Hashed using bcrypt
- Password change requires old password

### 3. **Session Management**
- Track last login time
- Active session tracking
- Logout clears all tokens

### 4. **Database-Level Security**
- Role stored in user table
- Branch ID foreign key constraint
- Soft deletes (is_active flag)

---

## 📊 Example Scenarios

### Scenario 1: Employee Creates Farmer
```
1. Employee logs in → Gets branch_id from their account
2. Employee creates farmer → Farmer automatically assigned to employee's branch
3. Employee can see this farmer in their list
4. Other branch employees CANNOT see this farmer
5. Admin CAN see this farmer
```

### Scenario 2: Farmer Applies for Loan
```
1. Farmer logs in → Sees only their loans
2. Farmer applies for loan → Status: pending_approval
3. Employee in farmer's branch sees the application
4. Employee approves → Status: approved
5. Employee disburses → Status: active
6. Farmer can now see loan in active status
```

### Scenario 3: Admin Monitors System
```
1. Admin logs in → Dashboard shows ALL branches
2. Admin views farmers → Sees farmers from ALL branches
3. Admin views loans → Sees loans from ALL branches
4. Admin can filter by branch to focus on specific branch
5. Admin can export reports for all branches
```

---

## ✅ Current Implementation Status

✅ **Implemented:**
- Farmer role-based loan filtering
- Employee branch-based filtering
- Admin all-access permissions
- Farmers endpoint access control
- Employees endpoint (admin-only)
- Payments endpoint filtering
- Dashboard stats filtering
- Smart Calculator filtering

✅ **Navigation Menu:**
- Role-based menu items
- Farmers see: Dashboard, Loans, Payments, Smart Calculator, Profile
- Employees see: + Farmers, Overdue, Branches, Reports
- Admin sees: All menu items

✅ **Security:**
- JWT authentication
- Password hashing
- Role validation
- Branch isolation

---

## 🚀 Testing Access Control

### Test as Farmer:
1. Login as farmer
2. ✅ Can see own loans
3. ❌ Cannot access /farmers page
4. ❌ Cannot see other farmers' loans
5. ✅ Can use Smart Calculator for own loans

### Test as Employee:
1. Login as employee
2. ✅ Can see farmers in their branch
3. ✅ Can see loans in their branch
4. ❌ Cannot see other branches
5. ❌ Cannot access employee list
6. ✅ Can approve/disburse loans

### Test as Admin:
1. Login as admin
2. ✅ Can see ALL farmers
3. ✅ Can see ALL employees
4. ✅ Can see ALL loans
5. ✅ Can see ALL branches
6. ✅ Has full system control

---

## 📝 Notes

- **Single Admin Policy**: Only create ONE admin user for the system
- **Branch Assignment**: All employees MUST be assigned to a branch
- **Farmer Creation**: Farmers can only be created by employees/admin
- **Role Changes**: Contact admin to change user roles
- **Security**: Never share admin credentials

---

**Last Updated**: December 7, 2025
**System**: COOPERATIVE PACS Loan Management System
