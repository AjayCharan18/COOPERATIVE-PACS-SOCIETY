"""
Celery tasks for notifications
"""

from datetime import date, timedelta
from sqlalchemy import select
from app.core.celery_app import celery_app
from app.db.session import AsyncSessionLocal
from app.models.loan import Loan, LoanStatus, EMISchedule
from app.models.user import User
from app.services.notification_service import NotificationService


@celery_app.task(name="app.tasks.notifications.send_emi_reminders")
def send_emi_reminders():
    """
    Send EMI reminders 3 days before due date
    Runs daily
    """
    import asyncio

    async def process():
        async with AsyncSessionLocal() as db:
            # Get EMIs due in 3 days
            due_date = date.today() + timedelta(days=3)

            result = await db.execute(
                select(EMISchedule).where(
                    EMISchedule.due_date == due_date, EMISchedule.is_paid == False
                )
            )
            upcoming_emis = result.scalars().all()

            for emi in upcoming_emis:
                # Get loan and farmer
                loan_result = await db.execute(
                    select(Loan).where(Loan.id == emi.loan_id)
                )
                loan = loan_result.scalar_one_or_none()

                if loan:
                    farmer_result = await db.execute(
                        select(User).where(User.id == loan.farmer_id)
                    )
                    farmer = farmer_result.scalar_one_or_none()

                    if farmer:
                        await NotificationService.send_emi_reminder(
                            db, loan, farmer, days_before=3
                        )

    asyncio.run(process())
    return f"Sent EMI reminders for {date.today() + timedelta(days=3)}"


@celery_app.task(name="app.tasks.notifications.check_overdue_loans")
def check_overdue_loans():
    """
    Check for overdue loans and send alerts
    Runs daily
    """
    import asyncio

    async def process():
        async with AsyncSessionLocal() as db:
            # Get overdue loans
            result = await db.execute(
                select(Loan).where(
                    Loan.status == LoanStatus.ACTIVE, Loan.maturity_date < date.today()
                )
            )
            overdue_loans = result.scalars().all()

            for loan in overdue_loans:
                overdue_days = (date.today() - loan.maturity_date).days

                # Send alert every 7 days
                if overdue_days % 7 == 0:
                    farmer_result = await db.execute(
                        select(User).where(User.id == loan.farmer_id)
                    )
                    farmer = farmer_result.scalar_one_or_none()

                    if farmer:
                        await NotificationService.send_overdue_alert(
                            db, loan, farmer, loan.total_outstanding, overdue_days
                        )

    asyncio.run(process())
    return f"Checked overdue loans on {date.today()}"
