"""
Update loan type configurations to match requirements
"""
import asyncio
from app.db.session import AsyncSessionLocal
from app.models.loan import LoanTypeConfig, LoanType, InterestCalculationType
from sqlalchemy import select


async def update_configs():
    async with AsyncSessionLocal() as db:
        # Get all existing configs
        result = await db.execute(select(LoanTypeConfig))
        configs = result.scalars().all()
        
        # Update existing configs
        for config in configs:
            if config.loan_type == LoanType.SAO:
                config.default_interest_rate = 7.0
                config.default_tenure_months = 12
                config.description = "Short-term crop loans - 1 year: 7%, Above 1 year: 8.5%"
                config.interest_calculation_type = InterestCalculationType.SIMPLE
                print(f"✅ Updated SAO")
                
            elif config.loan_type == LoanType.LONG_TERM_EMI:
                config.default_interest_rate = 12.0
                config.default_tenure_months = 108
                config.description = "Long-term loan with 12% interest, EMI installments over 9 years, 0.75% after 1 year"
                print(f"✅ Updated Long Term EMI")
                
            elif config.loan_type == LoanType.RYTHU_BANDHU:
                config.default_interest_rate = 12.50
                config.default_tenure_months = 12
                config.description = "Government-supported farmer scheme - 1 year: 12.50%, Above 1 year: 14.50%"
                print(f"✅ Updated Rythu Bandhu")
                
            elif config.loan_type == LoanType.AMUL_LOAN:
                config.default_interest_rate = 12.0
                config.default_tenure_months = 10
                config.description = "Dairy farming loan with EMI over 10 months - Rate: 12%, Above 1 year: 14%"
                print(f"✅ Updated Amul Loan")
        
        await db.commit()
        
        # Check if Rythu Nethany exists
        result = await db.execute(
            select(LoanTypeConfig).where(LoanTypeConfig.loan_type == LoanType.RYTHU_NETHANY)
        )
        existing = result.scalar_one_or_none()
        
        if not existing:
            # Add Rythu Nethany
            new_config = LoanTypeConfig(
                loan_type=LoanType.RYTHU_NETHANY,
                display_name="Rythu Nethany Scheme",
                description="EMI installment over 10 years - 1 year: 12.50%, Above 1 year: 14.50%",
                default_interest_rate=12.50,
                default_tenure_months=120,
                min_amount=50000,
                max_amount=3000000,
                interest_calculation_type=InterestCalculationType.EMI,
                requires_emi=True,
                is_active=True
            )
            db.add(new_config)
            await db.commit()
            print(f"✅ Added Rythu Nethany")
        else:
            # Update existing Rythu Nethany
            existing.default_interest_rate = 12.50
            existing.default_tenure_months = 120
            existing.description = "EMI installment over 10 years - 1 year: 12.50%, Above 1 year: 14.50%"
            existing.min_amount = 50000
            existing.max_amount = 3000000
            await db.commit()
            print(f"✅ Updated Rythu Nethany")
        
        print("\n🎉 All loan configurations updated successfully!")


if __name__ == "__main__":
    asyncio.run(update_configs())
