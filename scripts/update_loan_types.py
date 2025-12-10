"""
Script to update loan type configurations with new interest rates
Based on the handwritten requirements
"""
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.db.session import AsyncSessionLocal
from app.models.loan import LoanTypeConfig, LoanType


async def update_loan_types():
    """Update loan type configurations with new interest rates"""
    async with AsyncSessionLocal() as db:
        print("\n🔄 Updating loan type configurations...\n")
        
        # Update STD (SAO) - 7% up to 1 year, 13.45% above 1 year
        await db.execute(
            update(LoanTypeConfig)
            .where(LoanTypeConfig.loan_type == LoanType.SAO)
            .values(
                display_name="Short Term (STD)",
                description="Short-term Agricultural Operations - 7% (≤1 year), 13.45% (>1 year)",
                default_interest_rate=7.0,
                min_amount=1000,
                max_amount=500000,
                default_tenure_months=12
            )
        )
        print("✅ Updated: Short Term (STD) - 7% (≤1 year), 13.45% (>1 year)")
        
        # Update Long Term EMI - 12% first year, 0.75% after (9 years)
        await db.execute(
            update(LoanTypeConfig)
            .where(LoanTypeConfig.loan_type == LoanType.LONG_TERM_EMI)
            .values(
                display_name="Long Term - EMI",
                description="Long-term loan with EMI instalments (9 years) - 12% first year, 0.75% after",
                default_interest_rate=12.0,
                min_amount=50000,
                max_amount=5000000,
                default_tenure_months=108  # 9 years
            )
        )
        print("✅ Updated: Long Term EMI - 12% (1st year), 0.75% (after)")
        
        # Update Rythu Bandh - 12.50% up to 1 year, 14.50% above (10 years EMI)
        await db.execute(
            update(LoanTypeConfig)
            .where(LoanTypeConfig.loan_type == LoanType.RYTHU_BANDHU)
            .values(
                display_name="Rythu Bandhu",
                description="Rythu Bandhu loan scheme (10 years EMI) - 12.50% (≤1 year), 14.50% (>1 year)",
                default_interest_rate=12.50,
                min_amount=10000,
                max_amount=1000000,
                default_tenure_months=120  # 10 years
            )
        )
        print("✅ Updated: Rythu Bandhu - 12.50% (≤1 year), 14.50% (>1 year)")
        
        # Update Rythu Nathany - 12.50% up to 1 year, 14.50% above
        await db.execute(
            update(LoanTypeConfig)
            .where(LoanTypeConfig.loan_type == LoanType.RYTHU_NETHANY)
            .values(
                display_name="Rythu Nathany",
                description="Rythu Nathany agricultural loan - 12.50% (≤1 year), 14.50% (>1 year)",
                default_interest_rate=12.50,
                min_amount=10000,
                max_amount=1000000,
                default_tenure_months=120  # 10 years
            )
        )
        print("✅ Updated: Rythu Nathany - 12.50% (≤1 year), 14.50% (>1 year)")
        
        # Update Amul Loans - 12% up to 1 year, 14% above (10 months EMI)
        await db.execute(
            update(LoanTypeConfig)
            .where(LoanTypeConfig.loan_type == LoanType.AMUL_LOAN)
            .values(
                display_name="Amul Loans",
                description="Amul dairy loan with EMI (10 months) - 12% (≤1 year), 14% (>1 year)",
                default_interest_rate=12.0,
                min_amount=5000,
                max_amount=500000,
                default_tenure_months=10  # 10 months
            )
        )
        print("✅ Updated: Amul Loans - 12% (≤1 year), 14% (>1 year)")
        
        await db.commit()
        
        # Display updated loan types
        result = await db.execute(select(LoanTypeConfig))
        configs = result.scalars().all()
        
        print("\n" + "=" * 80)
        print("📊 UPDATED LOAN TYPES")
        print("=" * 80)
        for config in configs:
            print(f"\n📋 {config.display_name} ({config.loan_type.value})")
            print(f"   {config.description}")
            print(f"   Interest Rate: {config.default_interest_rate}%")
            print(f"   Amount Range: ₹{config.min_amount:,} - ₹{config.max_amount:,}")
            print(f"   Tenure: {config.default_tenure_months} months")
            print(f"   Calculation: {config.interest_calculation_type.value}")
        print("\n" + "=" * 80)
        print("\n✅ All loan types updated successfully!")


if __name__ == "__main__":
    asyncio.run(update_loan_types())
