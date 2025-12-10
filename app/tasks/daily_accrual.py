"""
Scheduled Task for Daily Interest Accrual
Runs daily via cron/scheduler to post interest entries
"""
from datetime import date, datetime
import logging
import asyncio

from app.db.session import async_session_maker
from app.services.daily_accrual_service import DailyAccrualService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def run_daily_accrual_task():
    """
    Main task to run daily interest accrual
    Should be scheduled to run daily (e.g., at 00:05 AM)
    """
    logger.info(f"Starting daily accrual task for {date.today()}")
    
    async with async_session_maker() as session:
        try:
            service = DailyAccrualService(session)
            result = await service.run_daily_accrual()
            
            logger.info(
                f"Daily accrual completed: {result['loans_processed']} loans processed, "
                f"Total accrual: ₹{result['total_accrual']}"
            )
            
            if result.get('errors'):
                logger.warning(f"Errors encountered: {len(result['errors'])} loans failed")
                for error in result['errors'][:5]:  # Log first 5 errors
                    logger.error(f"Loan {error['loan_id']}: {error['error']}")
            
            await session.commit()
            return result
            
        except Exception as e:
            logger.error(f"Daily accrual task failed: {str(e)}", exc_info=True)
            await session.rollback()
            raise


async def run_penalty_calculation_task():
    """
    Calculate penalties for overdue loans
    Should run daily after accrual
    """
    logger.info(f"Starting penalty calculation task for {date.today()}")
    
    async with async_session_maker() as session:
        try:
            service = DailyAccrualService(session)
            result = await service.run_batch_calculation(
                calculation_type="penalty",
                as_of_date=date.today()
            )
            
            logger.info(
                f"Penalty calculation completed: {result['processed']} loans processed"
            )
            
            await session.commit()
            return result
            
        except Exception as e:
            logger.error(f"Penalty calculation failed: {str(e)}", exc_info=True)
            await session.rollback()
            raise


if __name__ == "__main__":
    # Run accrual task
    asyncio.run(run_daily_accrual_task())
    
    # Run penalty calculation
    asyncio.run(run_penalty_calculation_task())
