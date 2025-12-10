import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.models.loan import Loan

async def check_farmer():
    async with AsyncSessionLocal() as db:
        # Get the farmer user
        result = await db.execute(select(User).where(User.email == 'adiajay8684@gmail.com'))
        user = result.scalar_one_or_none()
        
        if user:
            print(f"\n=== User Details ===")
            print(f"User ID: {user.id}")
            print(f"Farmer ID (String): {user.farmer_id}")
            print(f"Role: {user.role.value}")
            print(f"Name: {user.full_name}")
            
            # Check loans for this user
            print(f"\n=== Loans Filtering ===")
            result = await db.execute(select(Loan).where(Loan.farmer_id == user.farmer_id))
            loans_by_farmer_id = result.scalars().all()
            print(f"Loans where farmer_id == user.farmer_id ({user.farmer_id}): {len(loans_by_farmer_id)}")
            
            # Check loans for user ID 5
            result = await db.execute(select(Loan).where(Loan.farmer_id == 5))
            loans_by_id = result.scalars().all()
            print(f"Loans where farmer_id == 5: {len(loans_by_id)}")
            for loan in loans_by_id:
                print(f"  - {loan.loan_number}: farmer_id={loan.farmer_id}, status={loan.status.value}, disbursed={loan.disbursement_date}")

if __name__ == "__main__":
    asyncio.run(check_farmer())
