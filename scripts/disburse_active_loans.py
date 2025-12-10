import asyncio
from datetime import date
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.loan import Loan, LoanStatus

async def disburse_loan():
    async with AsyncSessionLocal() as db:
        # Find active loans without disbursement date
        result = await db.execute(
            select(Loan).where(
                Loan.status == LoanStatus.ACTIVE,
                Loan.disbursement_date.is_(None)
            )
        )
        loans = result.scalars().all()
        
        if not loans:
            print("No active loans found without disbursement date")
            return
        
        print(f"Found {len(loans)} active loans without disbursement date:\n")
        for i, loan in enumerate(loans, 1):
            print(f"{i}. {loan.loan_number} - ₹{loan.principal_amount} @ {loan.interest_rate}%")
        
        # Disburse all active loans
        print(f"\nDisbursing all {len(loans)} loans with today's date ({date.today()})...")
        
        for loan in loans:
            loan.disbursement_date = date.today()
            print(f"  ✓ Disbursed {loan.loan_number}")
        
        await db.commit()
        print("\n✅ Successfully disbursed all active loans!")

if __name__ == "__main__":
    asyncio.run(disburse_loan())
