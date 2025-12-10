# OTP-Based Authentication & Farmer Account Management

## Overview
This system implements secure OTP-based password reset via Email/SMS and employee-managed farmer account creation.

## Key Features

### 1. **Farmer Account Creation (Employee Only)**
- ✅ Only EMPLOYEE or ADMIN can create farmer accounts
- ✅ Auto-generates secure temporary password
- ✅ Sends credentials via Email, SMS, or Both
- ✅ Farmer must change password on first login

### 2. **OTP-Based Password Reset**
- ✅ Supports Email OR Mobile number
- ✅ 6-digit OTP with 10-minute expiration
- ✅ Maximum 3 attempts per OTP
- ✅ Resend OTP functionality
- ✅ Secure bcrypt password hashing

---

## API Endpoints

### 🔐 Password Reset Flow

#### 1. Request Password Reset OTP
```http
POST /api/v1/auth/forgot-password
Content-Type: application/json

{
  "identifier": "farmer@dccb.com",  // Email or Mobile (1234567890)
  "method": "email"                  // "email" or "sms"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to far***@dccb.com",
  "method": "email",
  "identifier": "farmer@dccb.com"
}
```

#### 2. Verify OTP & Reset Password
```http
POST /api/v1/auth/verify-otp-reset-password
Content-Type: application/json

{
  "identifier": "farmer@dccb.com",
  "otp": "123456",
  "new_password": "NewSecurePass@123"
}
```

**Response:**
```json
{
  "message": "Password reset successful",
  "success": true
}
```

#### 3. Resend OTP
```http
POST /api/v1/auth/resend-otp
Content-Type: application/json

{
  "identifier": "farmer@dccb.com",
  "method": "email"  // or "sms"
}
```

---

### 👨‍🌾 Farmer Account Creation (Employee)

#### Create Farmer Account
```http
POST /api/v1/auth/create-farmer-account
Authorization: Bearer <employee_token>
Content-Type: application/json

{
  "email": "newfarmer@example.com",
  "mobile": "9876543210",
  "full_name": "Ramesh Kumar",
  "aadhaar_number": "123456789012",
  "village": "Kondapur",
  "mandal": "Serilingampally",
  "district": "Hyderabad",
  "state": "Telangana",
  "land_area": "5.5",
  "crop_type": "Rice",
  "branch_id": 1,
  "send_credentials_via": "both"  // "email", "sms", or "both"
}
```

**Response:**
```json
{
  "id": 15,
  "email": "newfarmer@example.com",
  "mobile": "9876543210",
  "full_name": "Ramesh Kumar",
  "role": "farmer",
  "is_active": true,
  "created_at": "2025-12-07T10:30:00"
}
```

**Credentials Email:**
```
Subject: Your DCCB Loan Account Credentials

Dear Ramesh Kumar,

Your farmer account has been created successfully.

Login Credentials:
Email: newfarmer@example.com
Mobile: 9876543210
Temporary Password: xY9mK2pQ3wR5

⚠️ IMPORTANT: Please change your password immediately after first login.

You can login at: http://localhost:5173

To reset your password, use the "Forgot Password" option.

Regards,
DCCB Loan Team
```

---

## Email Configuration

### SMTP Settings (`.env`)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=ahajaycharan2526@gmail.com
SMTP_PASSWORD=efnx pqoc rxlq ycxg
EMAIL_FROM="DCCB Loan Alerts <ahajaycharan2526@gmail.com>"
```

### Gmail App Password Setup
1. Go to Google Account Settings
2. Security → 2-Step Verification (Enable)
3. App Passwords → Select "Mail" → Generate
4. Copy 16-character password to `.env`

---

## SMS Configuration (Optional)

### Using Twilio
```bash
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

---

## Security Features

### Password Requirements
- ✅ Minimum 8 characters
- ✅ At least 1 uppercase letter
- ✅ At least 1 lowercase letter
- ✅ At least 1 number
- ✅ At least 1 special character (@$!%*?&)

### OTP Security
- ✅ 6-digit random OTP
- ✅ 10-minute expiration
- ✅ Max 3 verification attempts
- ✅ Auto-deletion after use
- ✅ In-memory storage (use Redis in production)

### Password Storage
- ✅ Bcrypt hashing with salt
- ✅ Never stored in plain text
- ✅ One-way encryption

---

## User Flows

### 🔹 Farmer Registration Flow
```
Employee Login
    ↓
Navigate to "Create Farmer"
    ↓
Fill farmer details
    ↓
Select credential delivery: Email/SMS/Both
    ↓
Submit form
    ↓
System generates temp password
    ↓
Credentials sent to farmer
    ↓
Farmer receives email/SMS
    ↓
Farmer logs in with temp password
    ↓
System prompts password change
    ↓
Farmer sets new password
```

### 🔹 Password Reset Flow (Farmer)
```
Farmer clicks "Forgot Password"
    ↓
Enter Email or Mobile
    ↓
Select method: Email or SMS
    ↓
Receive 6-digit OTP
    ↓
Enter OTP + New Password
    ↓
Verify OTP (3 attempts max)
    ↓
Password updated
    ↓
Login with new password
```

---

## Testing

### Test Password Reset (Email)
```bash
curl -X POST http://localhost:8000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "farmer@dccb.com",
    "method": "email"
  }'
```

### Test OTP Verification
```bash
curl -X POST http://localhost:8000/api/v1/auth/verify-otp-reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "farmer@dccb.com",
    "otp": "123456",
    "new_password": "NewPass@123"
  }'
```

### Test Farmer Creation
```bash
curl -X POST http://localhost:8000/api/v1/auth/create-farmer-account \
  -H "Authorization: Bearer <employee_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "mobile": "9876543210",
    "full_name": "Test Farmer",
    "district": "Hyderabad",
    "state": "Telangana",
    "send_credentials_via": "email"
  }'
```

---

## Frontend Integration

### Forgot Password Form
```javascript
const handleForgotPassword = async (identifier, method) => {
  const response = await api.post('/auth/forgot-password', {
    identifier,  // email or mobile
    method       // 'email' or 'sms'
  });
  
  if (response.data.success) {
    // Show OTP input form
    showOTPForm();
  }
};
```

### OTP Verification
```javascript
const handleVerifyOTP = async (identifier, otp, newPassword) => {
  const response = await api.post('/auth/verify-otp-reset-password', {
    identifier,
    otp,
    new_password: newPassword
  });
  
  if (response.data.success) {
    // Redirect to login
    navigate('/login');
  }
};
```

### Create Farmer (Employee)
```javascript
const handleCreateFarmer = async (farmerData) => {
  const response = await api.post('/auth/create-farmer-account', {
    ...farmerData,
    send_credentials_via: 'both'  // email, sms, or both
  });
  
  if (response.data.id) {
    toast.success('Farmer account created successfully!');
  }
};
```

---

## Database Schema

### OTP Storage (In-Memory)
```python
{
  "identifier": {
    "otp": "123456",
    "expires_at": datetime,
    "attempts": 0
  }
}
```

### User Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  mobile VARCHAR UNIQUE NOT NULL,
  hashed_password VARCHAR NOT NULL,
  full_name VARCHAR,
  role VARCHAR,  -- FARMER, EMPLOYEE, ADMIN
  is_active BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## Production Recommendations

1. **Use Redis for OTP Storage**
   ```python
   # Replace in-memory dict with Redis
   import redis
   redis_client = redis.Redis(host='localhost', port=6379, db=0)
   ```

2. **Rate Limiting**
   - Limit OTP requests to 3 per hour per user
   - Implement IP-based rate limiting

3. **Audit Logging**
   - Log all password reset attempts
   - Track OTP generation and verification
   - Monitor failed login attempts

4. **Email Template Improvements**
   - Professional HTML templates
   - Company branding
   - Multi-language support

5. **SMS Provider**
   - Use Twilio, AWS SNS, or local SMS gateway
   - Implement delivery status tracking

---

## Troubleshooting

### Email Not Sending
1. Check SMTP credentials in `.env`
2. Enable "Less secure app access" in Gmail
3. Use App Password instead of regular password
4. Check firewall/proxy settings

### OTP Not Received
1. Check spam/junk folder
2. Verify mobile number format
3. Check SMS provider balance
4. Review server logs for errors

### Password Reset Fails
1. Verify OTP hasn't expired (10 min)
2. Check attempt count (max 3)
3. Ensure password meets requirements
4. Clear browser cache

---

## Support

For issues or questions:
- Check server logs: `logs/app.log`
- Database logs: PostgreSQL logs
- Email delivery: SMTP server logs

---

**Last Updated**: December 7, 2025
**Version**: 1.0
