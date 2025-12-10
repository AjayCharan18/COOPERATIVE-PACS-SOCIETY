import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.loan import Loan, LoanStatus


async def check_loans():
    async with AsyncSessionLocal() as db:
        # Check all loans
        result = await db.execute(select(Loan))
        all_loans = result.scalars().all()
        print(f"\nTotal loans in database: {len(all_loans)}")

        # Check active loans
        result = await db.execute(select(Loan).where(Loan.status == LoanStatus.ACTIVE))
        active_loans = result.scalars().all()
        print(f"Active loans: {len(active_loans)}")

        # Check active loans with disbursement date
        result = await db.execute(
            select(Loan).where(
                Loan.status == LoanStatus.ACTIVE, Loan.disbursement_date.isnot(None)
            )
        )
        disbursed_loans = result.scalars().all()
        print(f"Active disbursed loans: {len(disbursed_loans)}\n")

        if disbursed_loans:
            print("Available loans for calculator:")
            for loan in disbursed_loans:
                print(f"  - ID: {loan.id}")
                print(f"    Loan Number: {loan.loan_number}")
                print(f"    Type: {loan.loan_type.value}")
                print(f"    Principal: ₹{loan.principal_amount}")
                print(f"    Interest Rate: {loan.interest_rate}%")
                print(f"    Disbursement Date: {loan.disbursement_date}")
                print(f"    Branch ID: {loan.branch_id}")
                print(f"    Farmer ID: {loan.farmer_id}")
                print()
        else:
            print("No active disbursed loans found!")
            print("\nAll loans status:")
            for loan in all_loans:
                print(
                    f"  - {loan.loan_number}: Status={loan.status.value}, Disbursed={loan.disbursement_date}"
                )


if __name__ == "__main__":
    asyncio.run(check_loans())
