"""Check loans for a specific user"""
import asyncio
import sys
from pathlib import Path

project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.models.loan import Loan, LoanStatus

async def check_user_loans():
    async with AsyncSessionLocal() as db:
        user_id = 14
        
        # Get user
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        
        if not user:
            print(f"❌ User {user_id} not found")
            return
        
        print(f"\n{'='*80}")
        print(f"USER INFO")
        print(f"{'='*80}")
        print(f"ID: {user.id}")
        print(f"Email: {user.email}")
        print(f"Name: {user.full_name}")
        print(f"Role: {user.role}")
        print(f"Active: {user.is_active}")
        
        # Get all loans for this user
        loan_result = await db.execute(
            select(Loan).where(Loan.farmer_id == user_id)
        )
        loans = loan_result.scalars().all()
        
        print(f"\n{'='*80}")
        print(f"LOANS FOR USER {user_id}")
        print(f"{'='*80}")
        print(f"Total loans: {len(loans)}\n")
        
        for loan in loans:
            print(f"Loan ID: {loan.id}")
            print(f"Loan Number: {loan.loan_number}")
            print(f"Amount: ₹{loan.principal_amount:,.2f}")
            print(f"Status: {loan.status}")
            print(f"Type: {loan.loan_type}")
            print("-" * 80)
        
        # Check active loans specifically
        active_result = await db.execute(
            select(Loan).where(
                Loan.farmer_id == user_id,
                Loan.status.in_([LoanStatus.ACTIVE, LoanStatus.PENDING_APPROVAL])
            )
        )
        active_loans = active_result.scalars().all()
        
        if active_loans:
            print(f"\n⚠️  ACTIVE/PENDING LOANS: {len(active_loans)}")
            print("Cannot delete user until these loans are closed/rejected:")
            for loan in active_loans:
                print(f"  - {loan.loan_number} ({loan.status})")
        else:
            print(f"\n✅ No active/pending loans - user can be deleted")
        
        print(f"{'='*80}\n")

if __name__ == "__main__":
    asyncio.run(check_user_loans())
