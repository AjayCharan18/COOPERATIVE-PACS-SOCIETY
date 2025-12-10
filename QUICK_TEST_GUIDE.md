# 🚀 Quick Test Guide - DCCB Loan Management System

## ✅ System Status
- **Backend**: http://127.0.0.1:8000 ✓ Running
- **Frontend**: http://localhost:5174/ ✓ Running
- **Database**: PostgreSQL ✓ Connected

---

## 🎯 START HERE - Test Registration & Login

### Step 1: Register New User (2 minutes)
1. Open: http://localhost:5174/register
2. Fill form:
   ```
   Full Name: Test User
   Email: test@example.com
   Mobile: 9876543210
   Branch: Select any (4 available)
   Password: Test@123
   Confirm Password: Test@123
   ```
3. Click "Register"
4. Should redirect to login page

### Step 2: Login (1 minute)
1. URL: http://localhost:5174/login
2. Enter:
   ```
   Email: test@example.com
   Password: Test@123
   ```
3. Click "Sign In"
4. Should redirect to dashboard

---

## 📊 Loan Types Available

| Type | Interest Rate | Tenure | Amount Range |
|------|--------------|--------|--------------|
| **Short Term (STD)** | 7% (≤1yr), 13.45% (>1yr) | 12 months | ₹1K - ₹5L |
| **Long Term EMI** | 12% (1st yr), 0.75% (after) | 9 years | ₹50K - ₹50L |
| **Rythu Bandhu** | 12.50% (≤1yr), 14.50% (>1yr) | 10 years | ₹10K - ₹10L |
| **Rythu Nathany** | 12.50% (≤1yr), 14.50% (>1yr) | 10 years | ₹10K - ₹10L |
| **Amul Loans** | 12% (≤1yr), 14% (>1yr) | 10 months | ₹5K - ₹5L |

---

## 🔍 What to Test

### ✅ Phase 1: Authentication (Now)
- [x] Registration form
- [x] Login form
- [ ] Password validation
- [ ] Dashboard redirect
- [ ] Logout functionality

### 📋 Phase 2: Dashboard (Next)
- [ ] View loan statistics
- [ ] Navigate menu items
- [ ] View profile
- [ ] Update profile info

### 💰 Phase 3: Loan Application (After Phase 2)
- [ ] Create new loan application
- [ ] Select loan type
- [ ] Auto-calculate interest
- [ ] Generate EMI schedule
- [ ] Submit application

### 💳 Phase 4: Payments (After Phase 3)
- [ ] View payment history
- [ ] Make payment
- [ ] Generate receipt
- [ ] Update loan balance

---

## 🐛 If You See Errors

### Error: "Registration Failed"
**Check**:
- Password has 8+ characters
- Password has 1 uppercase letter
- Mobile is exactly 10 digits
- Email format is valid
- Branch is selected

### Error: "Login Failed - 401"
**Check**:
- Email and password match registered account
- No typos in credentials
- Account was registered successfully

### Error: "CORS Error"
**Solution**: Already fixed - refresh page

### Error: "404 Not Found"
**Check**: 
- Backend running on port 8000
- Frontend running on port 5174
- Both terminals are active

---

## 📱 Test Users You Can Create

### Farmer Account
```
Email: farmer@test.com
Password: Farmer@123
Role: Farmer
```
**Can Do**: Apply for loans, view own loans, make payments

### Employee Account
```
Email: employee@test.com
Password: Employee@123
Role: Employee
```
**Can Do**: Approve loans, process payments, view all loans

### Admin Account
```
Email: admin@test.com
Password: Admin@123
Role: Admin
```
**Can Do**: Everything + system settings, reports

---

## 🎨 UI Features

### ✅ Implemented & Styled
- Modern gradient designs
- Responsive layout
- Professional forms
- Data tables
- Statistics cards
- Navigation sidebar
- User profile menu

### 🎯 Color Scheme
- Primary: Green (Agricultural theme)
- Accent: Teal
- Success: Green
- Error: Red
- Warning: Yellow

---

## 📞 Quick Links

| Resource | URL |
|----------|-----|
| **Frontend** | http://localhost:5174/ |
| **Backend** | http://localhost:8000 |
| **API Docs** | http://localhost:8000/docs |
| **Register** | http://localhost:5174/register |
| **Login** | http://localhost:5174/login |

---

## ⚡ Quick Commands

### Restart Backend
```powershell
cd "D:\DCCB LOAN MANAGEMENT"
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Restart Frontend
```powershell
cd "D:\DCCB LOAN MANAGEMENT\frontend"
npm run dev
```

---

## 💡 Pro Tips

1. **Open Browser DevTools** (F12) to see network requests
2. **Check Console Tab** for JavaScript errors
3. **Use API Docs** to test backend directly
4. **Create multiple test users** with different roles
5. **Test on Chrome** for best compatibility

---

## ✅ Success Indicators

**Registration Success**:
- Green toast notification
- Redirect to login page
- Email appears in database

**Login Success**:
- Green toast notification
- Redirect to dashboard
- User name in header
- Sidebar visible

**Dashboard Load Success**:
- Statistics cards visible
- No console errors
- Navigation menu works
- Profile dropdown functional

---

## 🎯 Your Current Task

**NOW**: Test registration and login

1. Go to http://localhost:5174/register
2. Create a farmer account
3. Login with credentials
4. Explore dashboard
5. Report any issues

---

**Ready to Test!** 🚀

Both servers are running. Start with registration now! 👆
