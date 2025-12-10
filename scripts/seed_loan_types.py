"""Add loan type configurations to the database"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.loan import LoanTypeConfig, LoanType, InterestCalculationType

async def add_loan_types():
    async with AsyncSessionLocal() as db:
        try:
            # Check if loan types already exist
            result = await db.execute(select(LoanTypeConfig))
            existing = result.scalars().all()
            
            if existing:
                print(f"⚠️ Found {len(existing)} existing loan types. Skipping...")
                return
            
            print("🔧 Adding loan type configurations...")
            
            loan_types = [
                {
                    "loan_type": LoanType.SAO,
                    "display_name": "SAO (Short Term Agricultural Operation)",
                    "description": "Short term agricultural operation loan with pro-rata daily interest",
                    "default_interest_rate": 7.0,
                    "default_tenure_months": 12,
                    "min_amount": 5000.0,
                    "max_amount": 500000.0,
                    "interest_calculation_type": InterestCalculationType.PRORATA_DAILY,
                    "penal_interest_rate": 2.0,
                    "overdue_days_for_penalty": 90,
                    "requires_emi": False,
                    "emi_frequency": "monthly",
                    "is_active": True
                },
                {
                    "loan_type": LoanType.LONG_TERM_EMI,
                    "display_name": "Long Term EMI Loan",
                    "description": "Long term loan with EMI payments",
                    "default_interest_rate": 12.0,
                    "default_tenure_months": 60,
                    "min_amount": 10000.0,
                    "max_amount": 1000000.0,
                    "interest_calculation_type": InterestCalculationType.EMI,
                    "penal_interest_rate": 2.0,
                    "overdue_days_for_penalty": 90,
                    "requires_emi": True,
                    "emi_frequency": "monthly",
                    "is_active": True
                },
                {
                    "loan_type": LoanType.RYTHU_BANDHU,
                    "display_name": "Rythu Bandhu",
                    "description": "Rythu Bandhu scheme loan with seasonal interest",
                    "default_interest_rate": 12.5,
                    "default_tenure_months": 12,
                    "min_amount": 5000.0,
                    "max_amount": 300000.0,
                    "interest_calculation_type": InterestCalculationType.PRORATA_DAILY,
                    "penal_interest_rate": 2.0,
                    "overdue_days_for_penalty": 90,
                    "requires_emi": False,
                    "emi_frequency": "monthly",
                    "is_active": True
                },
                {
                    "loan_type": LoanType.RYTHU_NETHANY,
                    "display_name": "Rythu Nethany",
                    "description": "Rythu Nethany government scheme loan",
                    "default_interest_rate": 12.5,
                    "default_tenure_months": 12,
                    "min_amount": 5000.0,
                    "max_amount": 300000.0,
                    "interest_calculation_type": InterestCalculationType.PRORATA_DAILY,
                    "penal_interest_rate": 2.0,
                    "overdue_days_for_penalty": 90,
                    "requires_emi": False,
                    "emi_frequency": "monthly",
                    "is_active": True
                },
                {
                    "loan_type": LoanType.AMUL_LOAN,
                    "display_name": "Amul Dairy Loan",
                    "description": "Amul dairy loan with EMI (up to 10 months)",
                    "default_interest_rate": 12.0,
                    "default_tenure_months": 10,
                    "min_amount": 5000.0,
                    "max_amount": 500000.0,
                    "interest_calculation_type": InterestCalculationType.EMI,
                    "penal_interest_rate": 2.0,
                    "overdue_days_for_penalty": 90,
                    "requires_emi": True,
                    "emi_frequency": "monthly",
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
                print(f"\n📋 {config.display_name} ({config.loan_type.value})")
                print(f"   Interest: {config.default_interest_rate}%")
                print(f"   Amount: ₹{config.min_amount:,.0f} - ₹{config.max_amount:,.0f}")
                print(f"   Tenure: {config.default_tenure_months} months")
                print(f"   Calculation: {config.interest_calculation_type.value}")
                print(f"   Requires EMI: {config.requires_emi}")
            print("\n" + "=" * 80)
            
        except Exception as e:
            print(f"\n❌ Error adding loan types: {e}")
            import traceback
            traceback.print_exc()
            await db.rollback()

if __name__ == "__main__":
    asyncio.run(add_loan_types())
