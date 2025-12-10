"""
Celery tasks for overdue EMI management
"""
from datetime import date
from sqlalchemy import select
from app.core.celery_app import celery_app
from app.db.session import AsyncSessionLocal
from app.services.overdue_service import OverdueService


@celery_app.task(name="app.tasks.overdue_tasks.check_overdue_emis_task")
def check_overdue_emis_task():
    """
    Check and update overdue EMIs daily
    Runs at 6 AM every day
    """
    import asyncio
    
    async def process():
        async with AsyncSessionLocal() as db:
            summary = await OverdueService.check_and_update_overdue_emis(db)
            return summary
    
    result = asyncio.run(process())
    return f"Overdue check completed: {result['total_overdue']} overdue EMIs, {result['loans_affected']} loans affected"
