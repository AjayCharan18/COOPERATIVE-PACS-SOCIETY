"""Check loans in database"""
import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.loan import Loan, LoanStatus
from app.models.user import User

async def check_loans():
    async with AsyncSessionLocal() as db:
        # Check total loans
        result = await db.execute(select(Loan))
        loans = result.scalars().all()
        print(f'\n=== TOTAL LOANS IN DATABASE: {len(loans)} ===\n')
        
        # Check active/approved loans with disbursement
        result = await db.execute(
            select(Loan).where(
                Loan.status.in_([LoanStatus.ACTIVE, LoanStatus.APPROVED]),
                Loan.disbursement_date.isnot(None)
            )
        )
        active_loans = result.scalars().all()
        print(f'=== ACTIVE/APPROVED LOANS WITH DISBURSEMENT: {len(active_loans)} ===\n')
        
        # Display first 5 loans
        print('=== FIRST 5 LOANS ===')
        for loan in loans[:5]:
            print(f'ID: {loan.id}')
            print(f'  Loan Number: {loan.loan_number}')
            print(f'  Farmer ID: {loan.farmer_id}')
            print(f'  Status: {loan.status.value}')
            print(f'  Disbursement Date: {loan.disbursement_date}')
            print(f'  Principal: ₹{loan.principal_amount:,.2f}')
            print(f'  Total Outstanding: ₹{loan.total_outstanding:,.2f}')
            print(f'  Branch ID: {loan.branch_id}')
            print()
        
        # Check users
        result = await db.execute(select(User))
        users = result.scalars().all()
        print(f'\n=== TOTAL USERS: {len(users)} ===')
        for user in users[:5]:
            print(f'ID: {user.id}, Name: {user.full_name}, Role: {user.role.value}, Branch: {user.branch_id}')

if __name__ == '__main__':
    asyncio.run(check_loans())
