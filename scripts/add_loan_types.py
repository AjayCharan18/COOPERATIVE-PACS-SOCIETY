"""
Script to add loan type configurations based on the requirements
"""
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.models.loan import LoanTypeConfig, LoanType, InterestCalculationType


async def add_loan_types():
    """Add loan type configurations"""
    async with AsyncSessionLocal() as db:
        # Check if loan types already exist
        result = await db.execute(select(LoanTypeConfig))
        existing = result.scalars().all()
        
        if existing:
            print("⚠️  Loan types already exist. Skipping deletion to preserve foreign key relationships.")
            print("   Please update loan types manually through the API if needed.\n")
            
            # Display existing loan types
            print("=" * 80)
            for config in existing:
                print(f"\n📋 {config.display_name} ({config.loan_type.value})")
                print(f"   Interest: {config.default_interest_rate}%")
                print(f"   Amount: ₹{config.min_amount:,} - ₹{config.max_amount:,}")
                print(f"   Tenure: {config.default_tenure_months} months")
                print(f"   Calculation: {config.interest_calculation_type.value}")
            print("\n" + "=" * 80)
            return
        
        # Define loan types based on the image
        loan_types = [
            {
                "loan_type": LoanType.SAO,
                "name": "Short Term (STD)",
                "description": "Short-term Agricultural Operations loan",
                "min_amount": 1000,
                "max_amount": 500000,
                "min_tenure_months": 3,
                "max_tenure_months": 12,
                "interest_rate_up_to_1_year": 7.0,
                "interest_rate_above_1_year": 13.45,
                "interest_calculation_type": InterestCalculationType.SIMPLE,
                "requires_guarantor": False,
                "requires_collateral": False,
                "processing_fee_percentage": 0.5,
                "penal_interest_rate": 2.0,
                "grace_period_days": 0,
                "is_active": True
            },
            {
                "loan_type": LoanType.LONG_TERM_EMI,
                "name": "Long Term - EMI",
                "description": "Long-term loan with EMI instalments (9 years)",
                "min_amount": 50000,
                "max_amount": 5000000,
                "min_tenure_months": 13,
                "max_tenure_months": 108,  # 9 years
                "interest_rate_up_to_1_year": 12.0,
                "interest_rate_above_1_year": 0.75,
                "interest_calculation_type": InterestCalculationType.EMI,
                "requires_guarantor": True,
                "requires_collateral": True,
                "processing_fee_percentage": 1.0,
                "penal_interest_rate": 2.0,
                "grace_period_days": 0,
                "is_active": True
            },
            {
                "loan_type": LoanType.RYTHU_BANDHU,
                "name": "Rythu Bandhu",
                "description": "Rythu Bandhu loan scheme with EMI (10 years)",
                "min_amount": 10000,
                "max_amount": 1000000,
                "min_tenure_months": 3,
                "max_tenure_months": 120,  # 10 years
                "interest_rate_up_to_1_year": 12.50,
                "interest_rate_above_1_year": 14.50,
                "interest_calculation_type": InterestCalculationType.EMI,
                "requires_guarantor": True,
                "requires_collateral": False,
                "processing_fee_percentage": 0.5,
                "penal_interest_rate": 2.0,
                "grace_period_days": 0,
                "is_active": True
            },
            {
                "loan_type": LoanType.RYTHU_NETHANY,
                "name": "Rythu Nathany",
                "description": "Rythu Nathany agricultural loan",
                "min_amount": 10000,
                "max_amount": 1000000,
                "min_tenure_months": 3,
                "max_tenure_months": 120,  # 10 years
                "interest_rate_up_to_1_year": 12.50,
                "interest_rate_above_1_year": 14.50,
                "interest_calculation_type": InterestCalculationType.EMI,
                "requires_guarantor": True,
                "requires_collateral": False,
                "processing_fee_percentage": 0.5,
                "penal_interest_rate": 2.0,
                "grace_period_days": 0,
                "is_active": True
            },
            {
                "loan_type": LoanType.AMUL_LOAN,
                "name": "Amul Loans",
                "description": "Amul dairy loan with EMI (10 months)",
                "min_amount": 5000,
                "max_amount": 500000,
                "min_tenure_months": 3,
                "max_tenure_months": 10,  # 10 months
                "interest_rate_up_to_1_year": 12.0,
                "interest_rate_above_1_year": 14.0,
                "interest_calculation_type": InterestCalculationType.EMI,
                "requires_guarantor": False,
                "requires_collateral": False,
                "processing_fee_percentage": 0.5,
                "penal_interest_rate": 2.0,
                "grace_period_days": 0,
                "is_active": True
            }
        ]
        
        # Add loan types to database
        for loan_type_data in loan_types:
            config = LoanTypeConfig(**loan_type_data)
            db.add(config)
        
        await db.commit()
        
        # Display created loan types
        result = await db.execute(select(LoanTypeConfig))
        configs = result.scalars().all()
        
        print("\n✅ Loan types configured successfully!\n")
        print("=" * 80)
        for config in configs:
            print(f"\n📋 {config.name} ({config.loan_type.value})")
            print(f"   Interest: {config.interest_rate_up_to_1_year}% (≤1 year), "
                  f"{config.interest_rate_above_1_year}% (>1 year)")
            print(f"   Amount: ₹{config.min_amount:,} - ₹{config.max_amount:,}")
            print(f"   Tenure: {config.min_tenure_months} - {config.max_tenure_months} months")
            print(f"   Calculation: {config.interest_calculation_type.value}")
        print("\n" + "=" * 80)


if __name__ == "__main__":
    asyncio.run(add_loan_types())
