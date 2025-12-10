# 🚀 Role Switcher - Quick Start Guide

## What is it?

A **professional pill-slider toggle** that lets users with multiple access levels switch between dashboards **without logging out**.

---

## 🎯 For Developers

### Files Created
```
✅ frontend/src/components/RoleSwitcher.jsx
✅ frontend/src/components/UnifiedDashboard.jsx
✅ frontend/src/stores/authStore.js (updated)
✅ frontend/src/layouts/DashboardLayout.jsx (updated)
✅ frontend/src/App.jsx (updated)
```

### Installation - NO ADDITIONAL STEPS NEEDED!
Everything is already integrated. Just start your frontend:

```bash
cd frontend
npm run dev
```

---

## 🧪 How to Test

### Test 1: Login as Admin
1. Go to `http://localhost:5173/login/employee`
2. Login with admin credentials
3. **Expected Result**:
   ```
   ┌────────────────────────────────────┐
   │  [ Admin ] [ Employee ] [ Farmer ] │
   └────────────────────────────────────┘
       ↑ All 3 tabs visible
   ```
4. Click "Employee" → Dashboard changes to Employee view
5. Click "Farmer" → Dashboard changes to Farmer view

### Test 2: Login as Employee
1. Go to `http://localhost:5173/login/employee`
2. Login with employee credentials
3. **Expected Result**:
   ```
   ┌───────────────────────────┐
   │  [ Employee ] [ Farmer ]  │
   └───────────────────────────┘
       ↑ Only 2 tabs visible
   ```
4. Click "Farmer" → Switches to Farmer dashboard view

### Test 3: Login as Farmer
1. Go to `http://localhost:5173/login/farmer`
2. Login with farmer credentials
3. **Expected Result**:
   ```
   No switcher displayed (farmer has only 1 role)
   ```

---

## 🎨 Visual Behavior

### Animation
- **Pill slider** smoothly animates when switching roles
- **Gradient background** changes color based on active role:
  - 🟣 Admin: Purple gradient
  - 🔵 Employee: Blue gradient
  - 🟢 Farmer: Green gradient

### Active State
- Active tab has:
  - Glowing gradient background
  - Slight scale-up effect
  - Pulsing indicator dot
  - White text

### Inactive State
- Inactive tabs have:
  - Transparent background
  - Gray text
  - Hover effect

---

## 🔒 Access Control Matrix

| User's Primary Role | Can Access Dashboards      | Switcher Shows       |
|---------------------|----------------------------|----------------------|
| Farmer              | Farmer only                | Hidden (1 role)      |
| Employee            | Employee, Farmer           | 2 tabs               |
| Admin               | Admin, Employee, Farmer    | 3 tabs               |

---

## 📍 URL Routes

The switcher navigates to these routes:

```javascript
/dashboard/farmer    → Farmer Dashboard
/dashboard/employee  → Employee Dashboard
/dashboard/admin     → Admin Dashboard
```

**Security**: If you manually navigate to a route you don't have access to, you'll be redirected to your primary dashboard.

---

## 🎯 For End Users

### Scenario 1: I'm an Admin
"I need to check both system stats AND process a farmer's loan"

**Solution**:
1. Login as Admin → See Admin dashboard with system overview
2. Click "Employee" tab → Switch to Employee dashboard
3. Process farmer's loan
4. Click "Admin" → Return to admin view

### Scenario 2: I'm an Employee
"I want to see what farmers see in their dashboard"

**Solution**:
1. Login as Employee
2. Click "Farmer" tab → Switch to Farmer view
3. See exactly what farmers see
4. Click "Employee" → Return to employee view

### Scenario 3: I'm a Farmer
"I just want to apply for a loan"

**Solution**:
- Login as Farmer
- No switcher appears (you only have 1 dashboard)
- Use your Farmer dashboard normally

---

## 🔧 Technical Details

### State Management
- **Active Role** is stored in Zustand `authStore`
- Persists across page refreshes
- Cleared on logout

### Component Location
The switcher appears **at the top of every dashboard page**, just below the main navigation bar.

```
┌─────────────────────────────────┐
│  COOPERATIVE PACS Logo | Logout │  ← Top Nav
├─────────────────────────────────┤
│  Switch Dashboard View          │  ← Role Switcher
│  [ Admin ] [ Employee ]         │
├─────────────────────────────────┤
│  Dashboard Content              │
│  (Cards, Tables, Stats, etc.)   │
└─────────────────────────────────┘
```

---

## 🐛 Common Issues

### Issue: "I don't see the switcher"
**Answer**: You only have 1 role. Switcher only appears for users with multiple access levels.

### Issue: "Pill animation is laggy"
**Solution**: Check browser performance, disable browser extensions, or reduce animation speed in code.

### Issue: "Wrong dashboard loads"
**Solution**: Clear browser cache and local storage, then login again.

---

## 💡 Pro Tips

1. **Keyboard Navigation**: Use Tab key to navigate between role buttons
2. **Accessibility**: Screen readers will announce role switches
3. **Mobile**: Switcher is fully responsive and touch-friendly
4. **State Sync**: Active role syncs with URL, so you can bookmark specific dashboard views

---

## 📊 Example Workflow

**Admin Managing Daily Operations**:
```
9:00 AM  → Login as Admin
9:05 AM  → Check System Overview (Admin Dashboard)
9:15 AM  → Switch to Employee view
9:20 AM  → Process pending loan applications
10:00 AM → Switch to Farmer view
10:05 AM → Test farmer loan calculator
10:15 AM → Switch back to Admin
10:20 AM → Review employee performance metrics
```

All without logging out once! 🎉

---

## 🚀 Next Steps

1. **Start frontend**: `npm run dev`
2. **Login with different roles** to test
3. **Try switching dashboards** and observe animations
4. **Check URL changes** when switching roles
5. **Refresh page** to verify state persistence

---

## 📞 Need Help?

Check:
1. `ROLE_SWITCHER_DOCUMENTATION.md` - Full technical docs
2. Browser console for errors
3. Network tab for API issues
4. Verify JWT token contains correct role

---

**Ready to use! No installation needed.** 🎉

Just start your frontend and login to see the magic! ✨
