"""Fix loan - add disbursement date"""
import asyncio
from datetime import date
from sqlalchemy import select, update
from app.db.session import AsyncSessionLocal
from app.models.loan import Loan

async def fix_loans():
    async with AsyncSessionLocal() as db:
        # Get all active loans without disbursement date
        result = await db.execute(
            select(Loan).where(
                Loan.status == 'active',
                Loan.disbursement_date.is_(None)
            )
        )
        loans = result.scalars().all()
        
        print(f'\nFound {len(loans)} active loans without disbursement date')
        
        for loan in loans:
            # Set disbursement date to sanction date or today
            disbursement_date = loan.sanction_date if loan.sanction_date else date.today()
            
            print(f'\nUpdating Loan #{loan.loan_number}:')
            print(f'  Setting disbursement_date = {disbursement_date}')
            
            loan.disbursement_date = disbursement_date
            
        await db.commit()
        print(f'\n✅ Updated {len(loans)} loans with disbursement dates')
        
        # Verify
        result = await db.execute(
            select(Loan).where(
                Loan.disbursement_date.isnot(None)
            )
        )
        loans_with_date = result.scalars().all()
        print(f'\n✅ Total loans with disbursement date: {len(loans_with_date)}')

if __name__ == '__main__':
    asyncio.run(fix_loans())
