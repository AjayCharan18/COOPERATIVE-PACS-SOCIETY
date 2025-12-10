import asyncio
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.db.session import AsyncSessionLocal
from app.models.loan import Loan


async def check_farmer_associations():
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Loan).options(selectinload(Loan.farmer)).where(Loan.id.in_([6, 7]))
        )
        loans = result.scalars().all()

        print("\nLoan-Farmer Associations:")
        for loan in loans:
            farmer_name = (
                loan.farmer.full_name if loan.farmer else "No farmer associated"
            )
            print(
                f"  {loan.loan_number}: Farmer ID={loan.farmer_id}, Name={farmer_name}"
            )


if __name__ == "__main__":
    asyncio.run(check_farmer_associations())
