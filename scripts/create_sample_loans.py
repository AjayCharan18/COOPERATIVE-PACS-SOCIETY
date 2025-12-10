"""
Create sample loans to test the dashboard
"""
import sys
import os
import asyncio
from datetime import datetime, timedelta
from decimal import Decimal

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.loan import Loan
from app.models.user import User


async def create_sample_loans():
    async with AsyncSessionLocal() as db:
        try:
            # Get a farmer user (assuming the first user is a farmer)
            result = await db.execute(select(User).filter(User.role == 'farmer'))
            farmer = result.scalars().first()
        
            if not farmer:
                print("❌ No farmer user found. Please create a farmer user first.")
                print("You can register one at: http://localhost:5174/register")
                return
            
            # Check branch_id - use default branch 1 if not set
            branch_id = farmer.branch_id if farmer.branch_id else 1
            
            # Check if loans already exist
            result = await db.execute(select(Loan).filter(Loan.farmer_id == farmer.id))
            existing_loans = len(result.scalars().all())
            if existing_loans > 0:
                print(f"✅ Found {existing_loans} existing loans for farmer: {farmer.full_name}")
                return
        
            # Sample loan data for all 5 types
            sample_loans = [
                {
                    "loan_type": "sao",
                    "principal_amount": Decimal("25000.00"),
                    "interest_rate": Decimal("7.00"),
                    "tenure_months": 12,
                    "status": "active"
                },
                {
                    "loan_type": "long_term_emi",
                    "principal_amount": Decimal("200000.00"),
                    "interest_rate": Decimal("12.00"),
                    "tenure_months": 108,
                    "status": "active"
                },
                {
                    "loan_type": "rythu_bandhu",
                    "principal_amount": Decimal("50000.00"),
                    "interest_rate": Decimal("12.50"),
                    "tenure_months": 120,
                    "status": "pending_approval"
                },
                {
                    "loan_type": "rythu_nethany",
                    "principal_amount": Decimal("75000.00"),
                    "interest_rate": Decimal("12.50"),
                    "tenure_months": 120,
                    "status": "active"
                },
                {
                    "loan_type": "amul_loan",
                    "principal_amount": Decimal("15000.00"),
                    "interest_rate": Decimal("12.00"),
                    "tenure_months": 10,
                    "status": "closed"
                }
            ]
            
            print(f"📝 Creating sample loans for farmer: {farmer.full_name} (ID: {farmer.id})")
            
            for idx, loan_data in enumerate(sample_loans, 1):
                # Calculate total amount
                principal = loan_data["principal_amount"]
                rate = loan_data["interest_rate"]
                months = loan_data["tenure_months"]
                
                # Simple interest calculation
                interest = (principal * rate * months) / (Decimal("100") * Decimal("12"))
                total_amount = principal + interest
                
                # Set dates
                application_date = datetime.utcnow() - timedelta(days=30)
                disbursement_date = datetime.utcnow() - timedelta(days=20) if loan_data["status"] in ["active", "closed"] else None
                
                loan = Loan(
                    loan_number=f"LOAN{datetime.now().year}{idx:04d}",
                    farmer_id=farmer.id,
                    branch_id=branch_id,
                    loan_type=loan_data["loan_type"],
                    principal_amount=float(principal),
                    interest_rate=float(rate),
                    tenure_months=months,
                    total_amount_payable=float(total_amount),
                    outstanding_principal=float(principal) if loan_data["status"] == "active" else 0.0,
                    outstanding_interest=float(interest) if loan_data["status"] == "active" else 0.0,
                    total_outstanding=float(total_amount) if loan_data["status"] == "active" else 0.0,
                    status=loan_data["status"],
                    sanction_date=application_date.date(),
                    disbursement_date=disbursement_date.date() if disbursement_date else None,
                    maturity_date=(application_date + timedelta(days=months*30)).date(),
                    purpose=f"{loan_data['loan_type']} - Sample loan for testing",
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                
                db.add(loan)
                print(f"  ✅ Created {loan_data['loan_type']} loan: ₹{principal:,.2f}")
            
            await db.commit()
            print(f"\n🎉 Successfully created {len(sample_loans)} sample loans!")
            print(f"\n📌 Next steps:")
            print(f"1. Go to: http://localhost:5174/")
            print(f"2. Login with farmer credentials")
            print(f"3. You should see the dashboard with all 5 loan types displayed!")
            
        except Exception as e:
            print(f"❌ Error creating sample loans: {e}")
            await db.rollback()
            raise


if __name__ == "__main__":
    asyncio.run(create_sample_loans())
