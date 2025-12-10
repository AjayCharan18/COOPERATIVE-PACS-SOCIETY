# 🔄 Role Switcher Feature - Complete Documentation

## Overview

The Role Switcher is a professional, animated dashboard toggle component that allows users with multiple access levels to seamlessly switch between different dashboard views (Farmer, Employee, Admin) without logging out.

---

## 🎯 Features

### ✅ Smart Role Detection
- **Farmer** → Shows only Farmer dashboard tab
- **Employee** → Shows Employee + Farmer dashboard tabs
- **Admin** → Shows Admin + Employee + Farmer dashboard tabs

### ✅ Modern UI Design
- **Pill-slider animation** with smooth transitions
- **Gradient backgrounds** for active role
- **Professional banking dashboard aesthetics**
- **Responsive and mobile-friendly**
- **Accessibility compliant**

### ✅ State Management
- Integrated with Zustand auth store
- Persistent active role across page refreshes
- URL-based routing synchronization
- Real-time role switching

---

## 📁 File Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── RoleSwitcher.jsx          ← Main role switcher component
│   │   └── UnifiedDashboard.jsx      ← Dashboard router component
│   ├── stores/
│   │   └── authStore.js              ← Enhanced with activeRole state
│   ├── layouts/
│   │   └── DashboardLayout.jsx       ← Updated with RoleSwitcher integration
│   └── App.jsx                        ← Updated with role-based routes
```

---

## 🔧 Component Details

### 1. RoleSwitcher.jsx

**Purpose**: Animated pill-slider toggle for switching dashboard views

**Key Features**:
- Dynamic role availability based on user's primary role
- Smooth CSS transitions and animations
- Gradient backgrounds with role-specific colors
- Icon integration (Heroicons)
- Permission indicator display

**Role Configuration**:
```javascript
ROLE_CONFIG = {
    farmer: {
        label: 'Farmer',
        icon: UserCircleIcon,
        gradient: 'from-green-400 to-green-600',
        dashboard: '/dashboard/farmer'
    },
    employee: {
        label: 'Employee',
        icon: BriefcaseIcon,
        gradient: 'from-blue-400 to-blue-600',
        dashboard: '/dashboard/employee'
    },
    admin: {
        label: 'Admin',
        icon: ShieldCheckIcon,
        gradient: 'from-purple-400 to-purple-600',
        dashboard: '/dashboard/admin'
    }
}
```

**State Management**:
- `activeRole` - Currently selected role
- `availableRoles` - Roles accessible to the user
- `user` - Current logged-in user from authStore

**Animation Details**:
- Pill width: Calculated dynamically based on number of roles
- Pill offset: Animated using CSS transitions (300ms ease-in-out)
- Active state: Scale, shadow, and gradient effects
- Pulse animation on active indicator dot

---

### 2. UnifiedDashboard.jsx

**Purpose**: Routes to the appropriate dashboard component based on active role

**Access Control Logic**:
```javascript
Admin can access:     [Admin, Employee, Farmer] dashboards
Employee can access:  [Employee, Farmer] dashboards
Farmer can access:    [Farmer] dashboard only
```

**Security**:
- Validates user has access to requested role
- Redirects to primary dashboard if unauthorized
- Protects against URL manipulation

---

### 3. Enhanced authStore.js

**New State**:
```javascript
activeRole: null  // Tracks which dashboard view is currently active
```

**New Methods**:
```javascript
setActiveRole: (role) => {
    set({ activeRole: role })
}
```

**Integration**:
- Persists across page refreshes
- Cleared on logout
- Synchronized with routing

---

## 🚀 Usage Examples

### Example 1: Admin User (Full Access)
```
Login as: admin@coop.com
Available Roles: Admin, Employee, Farmer

Switcher displays:
┌──────────────────────────────────────┐
│ [ Admin ] [ Employee ] [ Farmer ]    │
└──────────────────────────────────────┘
   ↑ Active (purple gradient, sliding pill)

User can click any tab to switch views
```

### Example 2: Employee User
```
Login as: employee@coop.com
Available Roles: Employee, Farmer

Switcher displays:
┌──────────────────────────────┐
│ [ Employee ] [ Farmer ]      │
└──────────────────────────────┘
   ↑ Active (blue gradient)

Admin tab is not shown
```

### Example 3: Farmer User
```
Login as: farmer@coop.com
Available Roles: Farmer only

Switcher displays:
NOTHING - Switcher is hidden (only 1 role)

User stays on Farmer dashboard
```

---

## 🎨 Visual Design

### Color Scheme
| Role     | Gradient                     | Active Color |
|----------|------------------------------|--------------|
| Admin    | Purple (#a78bfa to #7c3aed)  | Purple-500   |
| Employee | Blue (#60a5fa to #2563eb)    | Blue-500     |
| Farmer   | Green (#4ade80 to #16a34a)   | Green-500    |

### Layout
```
┌─────────────────────────────────────────────────┐
│  Switch Dashboard View                          │
│  Admin Dashboard                                │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │                                         │   │
│  │  [ Admin ] [ Employee ] [ Farmer ]     │   │
│  │   ←─────────────┘                      │   │
│  │   Sliding pill (animated)              │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ⚪ You have access to 3 dashboards            │
└─────────────────────────────────────────────────┘
```

### Responsive Behavior
- **Desktop**: Full width with icons and labels
- **Tablet**: Maintains spacing, adjusts padding
- **Mobile**: Stacks vertically if needed, icons remain visible

---

## 🔌 Integration Steps

### Step 1: Install Component
Files already created:
- ✅ `RoleSwitcher.jsx`
- ✅ `UnifiedDashboard.jsx`
- ✅ Updated `authStore.js`
- ✅ Updated `DashboardLayout.jsx`
- ✅ Updated `App.jsx`

### Step 2: Test Routes
Navigate to:
- `/dashboard/farmer` - Shows Farmer Dashboard
- `/dashboard/employee` - Shows Employee Dashboard
- `/dashboard/admin` - Shows Admin Dashboard

### Step 3: Verify Access Control
1. Login as Farmer → Should only see `/dashboard/farmer`
2. Login as Employee → Should see Employee + Farmer tabs
3. Login as Admin → Should see all 3 tabs

---

## 📝 API Integration

### User Object Structure
```javascript
{
    id: 123,
    full_name: "John Doe",
    email: "john@coop.com",
    role: "admin",  // Primary role: farmer | employee | admin
    branch_id: 1,
    is_active: true
}
```

### JWT Token
- Token stored in localStorage
- Automatically attached to all API requests
- Contains user role information
- Validated on every dashboard switch

---

## 🧪 Testing Guide

### Test Case 1: Role Switching Animation
1. Login as admin
2. Click "Employee" tab
3. ✅ Verify: Pill slides smoothly from Admin to Employee
4. ✅ Verify: URL changes to `/dashboard/employee`
5. ✅ Verify: Employee Dashboard loads

### Test Case 2: Access Control
1. Login as farmer
2. Manually navigate to `/dashboard/admin`
3. ✅ Verify: Redirected to `/dashboard/farmer`
4. ✅ Verify: Error message or silent redirect

### Test Case 3: State Persistence
1. Login as admin
2. Switch to "Employee" dashboard
3. Refresh page (F5)
4. ✅ Verify: Still on Employee dashboard
5. ✅ Verify: Pill position remains on "Employee"

### Test Case 4: Logout Behavior
1. Login as admin, switch to Employee view
2. Logout
3. Login again as admin
4. ✅ Verify: Defaults to Admin dashboard (primary role)
5. ✅ Verify: activeRole resets correctly

---

## ⚡ Performance Optimization

### Rendering
- Component only renders when `availableRoles.length > 1`
- Uses React memo for icon components (optional)
- CSS transitions handled by GPU

### State Updates
- Minimal re-renders with Zustand
- Only updates when activeRole changes
- No prop drilling required

---

## 🛠️ Customization

### Change Colors
Edit `RoleSwitcher.jsx`:
```javascript
background: `linear-gradient(135deg, ${
    activeRole === 'admin' ? '#YOUR_COLOR_1, #YOUR_COLOR_2' :
    activeRole === 'employee' ? '#YOUR_COLOR_3, #YOUR_COLOR_4' :
    '#YOUR_COLOR_5, #YOUR_COLOR_6'
})`
```

### Add More Roles
1. Update `ROLE_CONFIG` in `RoleSwitcher.jsx`
2. Add new dashboard component
3. Update access control in `UnifiedDashboard.jsx`
4. Update `getAvailableRoles()` logic

### Change Animation Speed
```javascript
className="transition-all duration-300"  // Change to 200, 500, etc.
```

---

## 🐛 Troubleshooting

### Issue 1: Switcher Not Showing
**Cause**: User has only 1 role
**Solution**: This is expected behavior. Switcher only shows for multi-role users.

### Issue 2: Wrong Dashboard Loads
**Cause**: activeRole state not synchronized
**Solution**: Check `useEffect` in RoleSwitcher that syncs with location.pathname

### Issue 3: Access Denied on Switch
**Cause**: User doesn't have permission
**Solution**: Verify `hasAccess()` logic in UnifiedDashboard.jsx

### Issue 4: Pill Position Incorrect
**Cause**: CSS calc() not working
**Solution**: Check that `availableRoles` array order matches button order

---

## 📚 Code Examples

### Example: Accessing Active Role in Other Components
```javascript
import { useAuthStore } from '../stores/authStore'

function MyComponent() {
    const { activeRole } = useAuthStore()
    
    return (
        <div>
            Current View: {activeRole}
        </div>
    )
}
```

### Example: Programmatic Role Switch
```javascript
import { useAuthStore } from '../stores/authStore'
import { useNavigate } from 'react-router-dom'

function MyComponent() {
    const { setActiveRole } = useAuthStore()
    const navigate = useNavigate()
    
    const switchToEmployee = () => {
        setActiveRole('employee')
        navigate('/dashboard/employee')
    }
    
    return <button onClick={switchToEmployee}>Go to Employee View</button>
}
```

---

## 🎯 Best Practices

1. **Always validate access** before rendering sensitive components
2. **Use UnifiedDashboard** instead of direct dashboard imports in routes
3. **Keep activeRole in sync** with URL routing
4. **Clear activeRole on logout** to prevent stale state
5. **Test with all 3 user types** before deployment

---

## 🚢 Deployment Checklist

- [ ] All components created and imported correctly
- [ ] authStore updated with activeRole state
- [ ] Routes added to App.jsx
- [ ] DashboardLayout includes RoleSwitcher
- [ ] Access control tested for all roles
- [ ] Animation smooth on all browsers
- [ ] Mobile responsiveness verified
- [ ] State persistence tested
- [ ] Logout clears activeRole
- [ ] No console errors

---

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review component code comments
3. Test with different user roles
4. Verify JWT token contains correct role

---

## 🎉 Success Criteria

✅ **Visual**:
- Pill slider animation is smooth
- Colors match role (purple/blue/green)
- Icons display correctly
- Responsive on all devices

✅ **Functional**:
- Correct roles shown for each user type
- Dashboard switches on click
- URL updates correctly
- State persists on refresh

✅ **Security**:
- Access control enforced
- Unauthorized access blocked
- JWT validation working

---

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Component Author**: COOPERATIVE PACS Development Team
