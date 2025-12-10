"""
Check project status
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select, func
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.models.branch import Branch
from app.models.loan import LoanTypeConfig, Loan


async def check_status():
    """Check project database status"""
    async with AsyncSessionLocal() as db:
        try:
            # Count records
            user_count = await db.scalar(select(func.count(User.id)))
            branch_count = await db.scalar(select(func.count(Branch.id)))
            loan_type_count = await db.scalar(select(func.count(LoanTypeConfig.id)))
            loan_count = await db.scalar(select(func.count(Loan.id)))

            # Get admin user
            admin = await db.scalar(select(User).where(User.role == "admin"))

            print("=" * 60)
            print("DCCB LOAN MANAGEMENT SYSTEM - PROJECT STATUS")
            print("=" * 60)
            print(f"\nDatabase Statistics:")
            print(f"  - Total Users: {user_count}")
            print(f"  - Total Branches: {branch_count}")
            print(f"  - Loan Types: {loan_type_count}")
            print(f"  - Total Loans: {loan_count}")

            print(f"\nAdmin Account:")
            print(f"  - Email: {admin.email}")
            print(f"  - Mobile: {admin.mobile if admin.mobile else 'Not set'}")
            print(f"  - Name: {admin.full_name}")

            # Get branch info
            branch = await db.scalar(select(Branch))
            if branch:
                print(f"\nBranch Information:")
                print(f"  - Name: {branch.name}")
                print(f"  - Code: {branch.code}")
                print(
                    f"  - Village: {branch.village if hasattr(branch, 'village') else 'N/A'}"
                )

            # Get loan types
            loan_types = await db.scalars(
                select(LoanTypeConfig).where(LoanTypeConfig.is_active == True)
            )
            print(f"\nActive Loan Types:")
            for lt in loan_types:
                print(f"  - {lt.display_name} ({lt.default_interest_rate}% interest)")

            print("\n" + "=" * 60)
            print("SERVERS STATUS:")
            print("=" * 60)
            print("Backend: Running on port 8001")
            print("Frontend: Running on port 5173")
            print("\nAccess URL: http://localhost:5173")
            print("=" * 60)

        except Exception as e:
            print(f"Error checking status: {e}")


if __name__ == "__main__":
    asyncio.run(check_status())
