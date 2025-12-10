"""Test the loan-types endpoint"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.loan import LoanTypeConfig

async def test_loan_types():
    async with AsyncSessionLocal() as db:
        try:
            # Query all active loan types
            query = select(LoanTypeConfig).where(LoanTypeConfig.is_active == True)
            result = await db.execute(query)
            loan_types = result.scalars().all()
            
            print(f"\n✅ Found {len(loan_types)} active loan types:")
            for lt in loan_types:
                print(f"   - {lt.display_name} ({lt.loan_type})")
                print(f"     Rate: {lt.default_interest_rate}%")
                print(f"     Min: ₹{lt.min_amount:,.0f}, Max: ₹{lt.max_amount:,.0f if lt.max_amount else 0}")
                print(f"     Tenure: {lt.default_tenure_months} months")
                print()
            
            if len(loan_types) == 0:
                print("⚠️ No active loan types found in database!")
                
        except Exception as e:
            print(f"\n❌ Error querying loan types: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_loan_types())
