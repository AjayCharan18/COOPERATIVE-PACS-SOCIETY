"""
Authentication API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Form
from fastapi.security import HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func, case, and_
from datetime import datetime

from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.loan import Loan, LoanStatus
from app.models.payment import Payment, PaymentStatus
from app.schemas.user import UserCreate, User as UserSchema, ChangePasswordRequest, UserUpdate
from app.schemas.token import Token
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    validate_password_strength
)
from app.api.deps import get_current_user, require_admin_or_employee, require_admin

router = APIRouter()
security = HTTPBearer()


@router.get("/users/")
async def get_users(
    role: str = None,
    include_inactive: bool = False,
    current_user: User = Depends(require_admin_or_employee),
    db: AsyncSession = Depends(get_db)
):
    """
    Get list of users, optionally filtered by role
    Employee/Admin only
    By default, only returns active users (is_active=True)
    Set include_inactive=true to include deactivated users
    """
    from app.models.user import UserRole
    
    print(f"DEBUG: Received role parameter: '{role}', include_inactive: {include_inactive}")
    
    query = select(User)
    
    # Filter by active status (default: only active users)
    if not include_inactive:
        query = query.where(User.is_active == True)
    
    if role:
        try:
            # Convert role string to lowercase to match enum values
            user_role = UserRole(role.lower())
            print(f"DEBUG: Converted to UserRole: {user_role}")
            query = query.where(User.role == user_role)
        except ValueError as e:
            print(f"DEBUG: ValueError - {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role: {role}. Valid roles are: admin, employee, farmer"
            )
    
    result = await db.execute(query)
    users = result.scalars().all()
    
    return [
        {
            "id": user.id,
            "farmer_id": user.farmer_id,
            "email": user.email,
            "full_name": user.full_name,
            "mobile": user.mobile,
            "role": user.role.value,
            "branch_id": user.branch_id,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None
        }
        for user in users
    ]


@router.get("/users/farmers")
async def get_farmers(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get list of farmers based on role:
    - Admin: All farmers
    - Employee: Farmers in their branch only
    - Farmer: Access denied
    """
    from app.models.user import UserRole
    from app.models.loan import Loan, LoanStatus
    from sqlalchemy import func
    
    # Only admin and employees can access this endpoint
    if current_user.role == UserRole.FARMER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Farmers cannot access this endpoint"
        )
    
    # Query farmers with active loan count
    query = select(
        User,
        func.count(Loan.id).label('active_loan_count')
    ).outerjoin(
        Loan, 
        and_(
            Loan.farmer_id == User.id,
            Loan.status.in_([LoanStatus.ACTIVE, LoanStatus.APPROVED, LoanStatus.PENDING_APPROVAL])
        )
    ).where(
        User.role == UserRole.FARMER,
        User.is_active == True  # Only show active farmers
    )
    
    # Employee sees only farmers in their branch
    if current_user.role == UserRole.EMPLOYEE:
        query = query.where(User.branch_id == current_user.branch_id)
    # Admin sees all farmers (no additional filter)
    
    query = query.group_by(User.id).order_by(User.farmer_id)
    
    result = await db.execute(query)
    farmers_with_counts = result.all()
    
    return [
        {
            "id": user.id,
            "farmer_id": user.farmer_id,
            "email": user.email,
            "full_name": user.full_name,
            "mobile": user.mobile,
            "village": user.village,
            "district": user.district,
            "state": user.state,
            "branch_id": user.branch_id,
            "is_active": user.is_active,
            "active_loan_count": active_loan_count
        }
        for user, active_loan_count in farmers_with_counts
    ]


@router.get("/users/employees")
async def get_employees(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get list of all employees
    Only accessible by Admin
    """
    from app.models.user import UserRole
    
    # Only admin can access this endpoint
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can access employee list"
        )
    
    # Query all employees
    query = select(User).where(
        User.role == UserRole.EMPLOYEE,
        User.is_active == True  # Only show active employees
    ).order_by(User.created_at.desc())
    
    result = await db.execute(query)
    employees = result.scalars().all()
    
    return [
        {
            "id": employee.id,
            "email": employee.email,
            "full_name": employee.full_name,
            "mobile": employee.mobile,
            "branch_id": employee.branch_id,
            "is_active": employee.is_active,
            "created_at": employee.created_at,
            "last_login": employee.last_login
        }
        for employee in employees
    ]


@router.put("/users/employees/{employee_id}/toggle-status")
async def toggle_employee_status(
    employee_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Activate/Deactivate employee account (Admin only)
    """
    result = await db.execute(select(User).where(User.id == employee_id))
    employee = result.scalar_one_or_none()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    if employee.role != UserRole.EMPLOYEE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not an employee"
        )
    
    # Toggle status
    employee.is_active = not employee.is_active
    employee.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(employee)
    
    return {
        "id": employee.id,
        "full_name": employee.full_name,
        "is_active": employee.is_active,
        "message": f"Employee {'activated' if employee.is_active else 'deactivated'} successfully"
    }


@router.put("/users/employees/{employee_id}/assign-branch")
async def assign_employee_branch(
    employee_id: int,
    branch_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Assign or change employee branch (Admin only)
    """
    from app.models.branch import Branch
    
    # Check if employee exists
    result = await db.execute(select(User).where(User.id == employee_id))
    employee = result.scalar_one_or_none()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    if employee.role != UserRole.EMPLOYEE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not an employee"
        )
    
    # Check if branch exists
    result = await db.execute(select(Branch).where(Branch.id == branch_id))
    branch = result.scalar_one_or_none()
    
    if not branch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Branch not found"
        )
    
    # Assign branch
    old_branch_id = employee.branch_id
    employee.branch_id = branch_id
    employee.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(employee)
    
    return {
        "id": employee.id,
        "full_name": employee.full_name,
        "old_branch_id": old_branch_id,
        "new_branch_id": branch_id,
        "branch_name": branch.name,
        "message": "Branch assigned successfully"
    }


@router.get("/users/employees/{employee_id}/performance")
async def get_employee_performance(
    employee_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Get employee performance metrics (Admin only)
    Shows loans processed, collections made, etc.
    """
    # Check if employee exists
    result = await db.execute(select(User).where(User.id == employee_id))
    employee = result.scalar_one_or_none()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    # Loans processed (approved/disbursed by this employee)
    loans_query = select(
        func.count(Loan.id).label('total_loans'),
        func.count(case((Loan.status == LoanStatus.APPROVED, 1))).label('approved'),
        func.count(case((Loan.status == LoanStatus.ACTIVE, 1))).label('active'),
        func.sum(Loan.principal_amount).label('total_disbursed')
    ).where(Loan.branch_id == employee.branch_id)
    
    result = await db.execute(loans_query)
    loan_stats = result.one()
    
    # Collections in their branch
    collections_query = select(
        func.count(Payment.id).label('payment_count'),
        func.sum(Payment.amount).label('total_collected')
    ).join(Loan).where(
        and_(
            Loan.branch_id == employee.branch_id,
            Payment.status == PaymentStatus.COMPLETED
        )
    )
    
    result = await db.execute(collections_query)
    collection_stats = result.one()
    
    return {
        "employee_id": employee.id,
        "employee_name": employee.full_name,
        "branch_id": employee.branch_id,
        "performance": {
            "loans_processed": loan_stats.total_loans or 0,
            "loans_approved": loan_stats.approved or 0,
            "active_loans": loan_stats.active or 0,
            "total_disbursed": float(loan_stats.total_disbursed or 0),
            "payments_received": collection_stats.payment_count or 0,
            "total_collected": float(collection_stats.total_collected or 0)
        },
        "account_info": {
            "is_active": employee.is_active,
            "last_login": employee.last_login.isoformat() if employee.last_login else None,
            "created_at": employee.created_at.isoformat()
        }
    }


@router.post("/register", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new user (farmer, employee, or admin)
    """
    from app.services.notification_service import NotificationService
    
    # Check if user already exists
    result = await db.execute(
        select(User).where(
            or_(
                User.email == user_data.email,
                User.mobile == user_data.mobile
            )
        )
    )
    existing_user = result.scalars().first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email or mobile already exists"
        )
    
    # Validate Aadhaar if provided
    if user_data.aadhaar_number:
        result = await db.execute(
            select(User).where(User.aadhaar_number == user_data.aadhaar_number)
        )
        if result.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Aadhaar number already registered"
            )
    
    # Store the plain password before hashing (for email notification)
    plain_password = user_data.password
    
    # Create user
    user = User(
        email=user_data.email,
        mobile=user_data.mobile,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        role=user_data.role,
        aadhaar_number=user_data.aadhaar_number,
        pan_number=user_data.pan_number,
        address=user_data.address,
        village=user_data.village,
        mandal=user_data.mandal,
        district=user_data.district,
        state=user_data.state,
        pincode=user_data.pincode,
        land_area=user_data.land_area,
        crop_type=user_data.crop_type,
        preferred_language=user_data.preferred_language,
        branch_id=user_data.branch_id,
        is_active=True,
        is_verified=False
    )
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    # Send credentials via email
    try:
        role_name = "Farmer" if user.role.value == "farmer" else "Employee" if user.role.value == "employee" else "Admin"
        subject = f"Welcome to DCCB PACS - Your {role_name} Account Credentials"
        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #4F46E5; text-align: center;">Welcome to DCCB PACS Loan Management System</h2>
                
                <p>Dear <strong>{user.full_name}</strong>,</p>
                
                <p>Your account has been successfully created as a <strong>{role_name}</strong>.</p>
                
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #4F46E5;">Your Login Credentials:</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Email:</td>
                            <td style="padding: 8px 0; font-family: monospace;">{user.email}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Mobile:</td>
                            <td style="padding: 8px 0; font-family: monospace;">{user.mobile}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Password:</td>
                            <td style="padding: 8px 0;">
                                <code style="background: #FEF3C7; padding: 8px 12px; font-size: 18px; font-weight: bold; color: #92400E; border-radius: 4px; display: inline-block;">{plain_password}</code>
                            </td>
                        </tr>
                    </table>
                </div>
                
                <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; color: #92400E;">
                        <strong>⚠️ Important:</strong> You can login using either your <strong>email</strong> or <strong>mobile number</strong> along with the password above.
                    </p>
                </div>
                
                <div style="text-align: center; margin: 20px 0;">
                    <a href="http://localhost:5173/login" 
                       style="display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                        Login Now
                    </a>
                </div>
                
                <div style="background: #FEE2E2; border-left: 4px solid #EF4444; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; color: #991B1B;">
                        <strong>🔒 Security Notice:</strong> Please change your password immediately after your first login.
                    </p>
                </div>
                
                <p style="color: #666; font-size: 14px;">
                    If you did not request this account or have any questions, please contact your branch administrator immediately.
                </p>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                
                <p style="color: #666; font-size: 12px; text-align: center;">
                    Best regards,<br>
                    <strong>DCCB PACS Team</strong>
                </p>
            </div>
        </body>
        </html>
        """
        
        print(f"\n{'='*80}")
        print(f"Attempting to send credentials email to: {user.email}")
        print(f"Subject: {subject}")
        print(f"{'='*80}\n")
        
        await NotificationService.send_email(user.email, subject, body)
        
        print(f"\n{'='*80}")
        print(f"✅ Email sent successfully to: {user.email}")
        print(f"{'='*80}\n")
        
    except Exception as e:
        print(f"\n{'='*80}")
        print(f"❌ Failed to send credentials email to {user.email}")
        print(f"Error: {str(e)}")
        import traceback
        print(traceback.format_exc())
        print(f"{'='*80}\n")
        # Don't fail the registration if email fails
    
    return user


@router.post("/login", response_model=Token)
async def login(
    username: str = Form(...),
    password: str = Form(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Login with email/mobile and password
    Returns JWT access token
    """
    # Find user by email or mobile
    result = await db.execute(
        select(User).where(
            or_(
                User.email == username,
                User.mobile == username
            )
        )
    )
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    await db.commit()
    
    # Create access token
    access_token = create_access_token(
        data={
            "user_id": user.id,
            "email": user.email,
            "role": user.role.value
        }
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": None  # Non-expiring token
    }


@router.get("/me", response_model=UserSchema)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current logged-in user information"""
    return current_user


@router.put("/me", response_model=UserSchema)
async def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update current user profile"""
    
    # Update fields if provided
    update_data = user_update.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    current_user.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(current_user)
    
    return current_user


@router.post("/change-password")
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Change password for current user"""
    
    # Verify old password
    if not verify_password(password_data.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
    
    # Update password
    current_user.hashed_password = get_password_hash(password_data.new_password)
    await db.commit()
    
    return {"message": "Password changed successfully"}


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """
    Logout (client should discard token)
    For non-expiring tokens, implement token blacklist if needed
    """
    return {"message": "Logged out successfully"}


# ============================================================================
# OTP-BASED PASSWORD RESET (Email & SMS)
# ============================================================================

@router.post("/forgot-password")
async def forgot_password(
    request: dict,
    db: AsyncSession = Depends(get_db)
):
    """
    Initiate password reset - Send OTP via Email or SMS
    Request body: {
        "identifier": "email@example.com or 1234567890",
        "method": "email" or "sms"
    }
    """
    from app.services.otp_service import OTPService
    
    identifier = request.get("identifier")
    method = request.get("method", "email")
    
    if not identifier:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or mobile number is required"
        )
    
    result = await OTPService.initiate_password_reset(db, identifier, method)
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )
    
    return result


@router.post("/verify-otp-reset-password")
async def verify_otp_and_reset(
    request: dict,
    db: AsyncSession = Depends(get_db)
):
    """
    Verify OTP and reset password
    Request body: {
        "identifier": "email@example.com or 1234567890",
        "otp": "123456",
        "new_password": "NewPassword@123"
    }
    """
    from app.services.otp_service import OTPService
    
    identifier = request.get("identifier")
    otp = request.get("otp")
    new_password = request.get("new_password")
    
    if not all([identifier, otp, new_password]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="identifier, otp, and new_password are required"
        )
    
    result = await OTPService.verify_otp_and_reset_password(
        db, identifier, otp, new_password
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )
    
    return {
        "message": "Password reset successful",
        "success": True
    }


@router.post("/resend-otp")
async def resend_otp(
    request: dict,
    db: AsyncSession = Depends(get_db)
):
    """
    Resend OTP for password reset
    Request body: {
        "identifier": "email@example.com or 1234567890",
        "method": "email" or "sms"
    }
    """
    from app.services.otp_service import OTPService
    
    identifier = request.get("identifier")
    method = request.get("method", "email")
    
    if not identifier:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or mobile number is required"
        )
    
    result = await OTPService.resend_otp(db, identifier, method)
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )
    
    return result


# ============================================================================
# EMPLOYEE CREATES FARMER ACCOUNT
# ============================================================================

@router.post("/create-farmer-account")
async def create_farmer_account(
    farmer_data: dict,
    current_user: User = Depends(require_admin_or_employee),
    db: AsyncSession = Depends(get_db)
):
    """
    Employee/Admin creates farmer account with auto-generated password
    Password sent via email/SMS
    """
    import traceback
    import sys
    try:
        print("\n" + "="*80)
        print("CREATE FARMER DEBUG INFO:")
        print(f"farmer_data received: {farmer_data}")
        print(f"current_user: {current_user.email} (role: {current_user.role})")
        print("="*80 + "\n")
        sys.stdout.flush()
        
        from app.services.otp_service import OTPService
        import secrets
        
        # Check if user already exists
        result = await db.execute(
            select(User).where(
                or_(
                    User.email == farmer_data.get("email"),
                    User.mobile == farmer_data.get("mobile")
                )
            )
        )
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email or mobile already exists"
            )
        
        # Generate farmer_id (FMR + 4 digits)
        # Get the count of existing farmers to generate next ID
        farmer_count_result = await db.execute(
            select(User).where(User.role == 'farmer')
        )
        farmer_count = len(farmer_count_result.scalars().all())
        farmer_id = f"FMR{farmer_count + 1:04d}"  # FMR0001, FMR0002, etc.
        
        # Generate temporary password
        temp_password = secrets.token_urlsafe(12)[:12]  # 12 character password
        
        # Helper function to convert empty strings to None
        def get_or_none(value):
            return value if value and value.strip() else None
        
        # Create farmer account
        from app.models.user import UserRole
        new_farmer = User(
            farmer_id=farmer_id,
            email=farmer_data.get("email"),
            mobile=farmer_data.get("mobile"),
            hashed_password=get_password_hash(temp_password),
            full_name=farmer_data.get("full_name"),
            role=UserRole.FARMER,
            is_active=True,
            is_verified=True,
            aadhaar_number=get_or_none(farmer_data.get("aadhaar_number")),
            village=get_or_none(farmer_data.get("village")),
            mandal=get_or_none(farmer_data.get("mandal")),
            district=get_or_none(farmer_data.get("district")),
            state=get_or_none(farmer_data.get("state")),
            land_area=get_or_none(farmer_data.get("land_area")),
            crop_type=get_or_none(farmer_data.get("crop_type")),
            branch_id=farmer_data.get("branch_id") or current_user.branch_id,
            created_at=datetime.utcnow()
        )
        
        db.add(new_farmer)
        await db.commit()
        await db.refresh(new_farmer)
        
        # Send credentials via email/SMS
        send_via = farmer_data.get("send_credentials_via", "email")
        
        # Send via email
        if send_via in ["email", "both"]:
            from app.services.notification_service import NotificationService
            email_body = f"""
            <html>
            <body>
                <h2>Welcome to COOPERATIVE PACS Loan Management System</h2>
                <p>Dear {new_farmer.full_name},</p>
                <p>Your farmer account has been created successfully by {current_user.full_name}.</p>
                <br>
                <h3>Your Account Details:</h3>
                <p><strong>Farmer ID:</strong> <span style="background: #e0f2ff; padding: 5px 10px; font-size: 16px; font-weight: bold; color: #0066cc;">{new_farmer.farmer_id}</span></p>
                <p><strong>Email:</strong> {new_farmer.email}</p>
                <p><strong>Mobile:</strong> {new_farmer.mobile}</p>
                <p><strong>Temporary Password:</strong> <code style="background: #f0f0f0; padding: 5px 10px; font-size: 18px;">{temp_password}</code></p>
                <br>
                <p><strong style="color: red;">⚠️ IMPORTANT: Please change your password immediately after first login.</strong></p>
                <p>You can login at: <a href="http://localhost:5173">http://localhost:5173</a></p>
                <br>
                <p>To reset your password, use the "Forgot Password" option on the login page.</p>
                <br>
                <p>Regards,<br>COOPERATIVE PACS Loan Team</p>
            </body>
            </html>
            """
            
            try:
                await NotificationService.send_email(
                    to_email=new_farmer.email,
                    subject="Your COOPERATIVE PACS Loan Account Credentials",
                    body=email_body
                )
            except Exception as e:
                pass  # Continue even if email fails
        
        # Send via SMS
        if send_via in ["sms", "both"]:
            from app.services.notification_service import NotificationService
            sms_message = f"Welcome to COOPERATIVE PACS Loan! Farmer ID: {new_farmer.farmer_id}. Login credentials - Email: {new_farmer.email}, Password: {temp_password}. Please change password after login. Login at: http://localhost:5173"
            
            try:
                await NotificationService.send_sms(new_farmer.mobile, sms_message)
            except Exception as e:
                pass  # Continue even if SMS fails
        
        # Return user data with temporary password
        from pydantic import BaseModel
        class FarmerCreationResponse(BaseModel):
            id: int
            farmer_id: str
            email: str
            mobile: str
            full_name: str
            role: str
            temporary_password: str
            
            class Config:
                from_attributes = True
        
        return {
            "id": new_farmer.id,
            "farmer_id": new_farmer.farmer_id,
            "email": new_farmer.email,
            "mobile": new_farmer.mobile,
            "full_name": new_farmer.full_name,
            "role": new_farmer.role.value,
            "temporary_password": temp_password
        }
    
    except Exception as e:
        import traceback
        print("\n" + "="*80)
        print("ERROR in create_farmer_account:")
        print(traceback.format_exc())
        print("="*80 + "\n")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    force: bool = False,
    current_user: User = Depends(require_admin_or_employee),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a user (soft delete by deactivating)
    Admin/Employee only
    
    - force=False (default): Prevents deletion if user has active/pending loans
    - force=True: Allows deletion and automatically rejects all pending loans, closes active loans
    """
    # Get the user
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Don't allow deleting yourself
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    # Check if user has active loans
    from app.models.loan import Loan, LoanStatus
    loan_result = await db.execute(
        select(Loan).where(
            Loan.farmer_id == user_id,
            Loan.status.in_([LoanStatus.ACTIVE, LoanStatus.PENDING_APPROVAL])
        )
    )
    active_loans = loan_result.scalars().all()
    
    if active_loans and not force:
        # Provide detailed information about the loans
        loan_details = [
            {
                "loan_number": loan.loan_number,
                "status": loan.status.value,
                "amount": float(loan.principal_amount),
                "type": loan.loan_type.value
            }
            for loan in active_loans
        ]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": f"Cannot delete user with {len(active_loans)} active/pending loan(s).",
                "loans": loan_details,
                "suggestion": "Please reject or close these loans first, or use force=true to automatically handle them."
            }
        )
    
    # If force=True and there are active loans, handle them
    if active_loans and force:
        for loan in active_loans:
            if loan.status == LoanStatus.PENDING_APPROVAL:
                loan.status = LoanStatus.REJECTED
                loan.approval_remarks = f"Auto-rejected due to farmer account deletion by {current_user.full_name}"
            elif loan.status == LoanStatus.ACTIVE:
                loan.status = LoanStatus.CLOSED
                # Note: In production, you'd want to handle outstanding amounts properly
        
        await db.commit()
    
    # Soft delete - deactivate the user
    user.is_active = False
    await db.commit()
    
    message = "User deleted successfully"
    if active_loans and force:
        message += f" ({len(active_loans)} loan(s) automatically handled)"
    
    return {"message": message, "user_id": user_id}
