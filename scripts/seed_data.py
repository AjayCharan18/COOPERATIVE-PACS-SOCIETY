"""
Database initialization and seeding script
Run this to create initial data for testing
"""
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date, timedelta

from app.db.session import AsyncSessionLocal
from app.models.user import User, Branch, UserRole
from app.models.loan import LoanTypeConfig, LoanType, InterestCalculationType
from app.models.notification import NotificationTemplate, NotificationType, NotificationPurpose
from app.core.security import get_password_hash


async def seed_data():
    """Seed initial data"""
    async with AsyncSessionLocal() as db:
        # Create branches
        branch1 = Branch(
            name="Hyderabad Main Branch",
            code="HYD001",
            address="Street No. 1, Hyderabad",
            district="Hyderabad",
            state="Telangana",
            pincode="500001",
            contact_number="9876543210",
            email="hyderabad@dccb.com",
            ifsc_code="DCCB0001001"
        )
        db.add(branch1)
        await db.flush()
        
        # Create users
        admin = User(
            email="admin@dccb.com",
            mobile="9999999999",
            hashed_password=get_password_hash("Admin@123"),
            full_name="System Administrator",
            role=UserRole.ADMIN,
            is_active=True,
            is_verified=True,
            district="Hyderabad",
            state="Telangana"
        )
        
        employee = User(
            email="employee@dccb.com",
            mobile="9999999998",
            hashed_password=get_password_hash("Employee@123"),
            full_name="Branch Employee",
            role=UserRole.EMPLOYEE,
            is_active=True,
            is_verified=True,
            branch_id=branch1.id,
            district="Hyderabad",
            state="Telangana"
        )
        
        farmer = User(
            email="farmer@dccb.com",
            mobile="9999999997",
            hashed_password=get_password_hash("Farmer@123"),
            full_name="Test Farmer",
            role=UserRole.FARMER,
            is_active=True,
            is_verified=True,
            aadhaar_number="123456789012",
            village="Kondapur",
            mandal="Serilingampally",
            district="Hyderabad",
            state="Telangana",
            land_area="5.5",
            crop_type="Rice"
        )
        
        db.add_all([admin, employee, farmer])
        
        # Create loan type configs
        loan_types = [
            LoanTypeConfig(
                loan_type=LoanType.SAO,
                display_name="Short-term Agricultural Operations (SAO)",
                description="Short-term crop loans - 1 year: 7%, Above 1 year: 8.5%",
                default_interest_rate=7.0,
                default_tenure_months=12,
                min_amount=10000,
                max_amount=500000,
                interest_calculation_type=InterestCalculationType.SIMPLE,
                requires_emi=False
            ),
            LoanTypeConfig(
                loan_type=LoanType.LONG_TERM_EMI,
                display_name="Long-term EMI Loan (9 years)",
                description="Long-term loan with 12% interest, EMI installments over 9 years, 0.75% after 1 year",
                default_interest_rate=12.0,
                default_tenure_months=108,
                min_amount=100000,
                max_amount=5000000,
                interest_calculation_type=InterestCalculationType.EMI,
                requires_emi=True
            ),
            LoanTypeConfig(
                loan_type=LoanType.RYTHU_BANDHU,
                display_name="Rythu Bandhu Scheme",
                description="Government-supported farmer scheme - 1 year: 12.50%, Above 1 year: 14.50%",
                default_interest_rate=12.50,
                default_tenure_months=12,
                min_amount=5000,
                max_amount=200000,
                interest_calculation_type=InterestCalculationType.SIMPLE,
                requires_emi=False
            ),
            LoanTypeConfig(
                loan_type=LoanType.RYTHU_NETHANY,
                display_name="Rythu Nethany Scheme",
                description="EMI installment over 10 years - 1 year: 12.50%, Above 1 year: 14.50%",
                default_interest_rate=12.50,
                default_tenure_months=120,
                min_amount=50000,
                max_amount=3000000,
                interest_calculation_type=InterestCalculationType.EMI,
                requires_emi=True
            ),
            LoanTypeConfig(
                loan_type=LoanType.AMUL_LOAN,
                display_name="Amul Dairy Loan (10 months)",
                description="Dairy farming loan with EMI over 10 months - Rate: 12%, Above 1 year: 14%",
                default_interest_rate=12.0,
                default_tenure_months=10,
                min_amount=50000,
                max_amount=1000000,
                interest_calculation_type=InterestCalculationType.EMI,
                requires_emi=True
            )
        ]
        
        db.add_all(loan_types)
        
        # Create notification templates
        templates = [
            NotificationTemplate(
                template_key="emi_reminder",
                purpose=NotificationPurpose.EMI_REMINDER,
                notification_type=NotificationType.WHATSAPP,
                template_english="Dear {farmer_name}, Your EMI of {emi_amount} for loan {loan_number} is due on {due_date}. Please pay on time to avoid penalty.",
                template_telugu="ప్రియమైన {farmer_name}, మీ రుణం {loan_number} కోసం {emi_amount} EMI {due_date}న చెల్లించవలసి ఉంది.",
                subject_english="EMI Payment Reminder"
            ),
            NotificationTemplate(
                template_key="overdue_alert",
                purpose=NotificationPurpose.OVERDUE_ALERT,
                notification_type=NotificationType.SMS,
                template_english="URGENT: Your loan {loan_number} is overdue by {overdue_days} days. Outstanding: {overdue_amount}. Pay immediately to avoid penalty.",
                template_telugu="ముఖ్యం: మీ రుణం {loan_number} {overdue_days} రోజులు బకాయి ఉంది. బకాయి మొత్తం: {overdue_amount}.",
                subject_english="Overdue Payment Alert"
            )
        ]
        
        db.add_all(templates)
        
        await db.commit()
        print("✅ Database seeded successfully!")
        print("\n📝 Default credentials:")
        print("Admin: admin@dccb.com / Admin@123")
        print("Employee: employee@dccb.com / Employee@123")
        print("Farmer: farmer@dccb.com / Farmer@123")


if __name__ == "__main__":
    print("🌱 Seeding database...")
    asyncio.run(seed_data())
