"""
Celery tasks for interest calculation
"""
from datetime import date
from sqlalchemy import select
from app.core.celery_app import celery_app
from app.db.session import AsyncSessionLocal
from app.models.loan import Loan, LoanStatus
from app.services.interest_calculator import InterestCalculator


@celery_app.task(name="app.tasks.interest_calculation.calculate_daily_interest")
def calculate_daily_interest():
    """
    Calculate and update accrued interest for all active loans
    Runs daily at midnight
    """
    import asyncio
    
    async def process():
        async with AsyncSessionLocal() as db:
            # Get all active loans
            result = await db.execute(
                select(Loan).where(Loan.status == LoanStatus.ACTIVE)
            )
            active_loans = result.scalars().all()
            
            updated_count = 0
            
            for loan in active_loans:
                if loan.disbursement_date:
                    # Recalculate outstanding
                    outstanding_data = await InterestCalculator.recalculate_loan_outstanding(loan)
                    
                    loan.outstanding_interest = outstanding_data["outstanding_interest"]
                    loan.penal_interest = outstanding_data["penal_interest"]
                    loan.total_outstanding = outstanding_data["total_outstanding"]
                    
                    updated_count += 1
            
            await db.commit()
            
            return f"Updated interest for {updated_count} active loans"
    
    result = asyncio.run(process())
    return result
