"""
Service for loan rescheduling operations
"""

from datetime import date, datetime, timedelta
from typing import Dict, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.loan import Loan, LoanStatus, EMISchedule, LoanTypeConfig
from app.services.interest_calculator import InterestCalculator
from app.services.loan_service import LoanService


class LoanReschedulingService:
    """Service for rescheduling loans"""

    @staticmethod
    async def reschedule_loan(
        db: AsyncSession,
        loan_id: int,
        new_tenure_months: Optional[int] = None,
        new_interest_rate: Optional[float] = None,
        restructure_date: date = None,
        reason: str = None,
    ) -> Loan:
        """
        Reschedule a loan with new terms
        Recalculates EMI and generates new schedule
        """
        # Get loan
        result = await db.execute(select(Loan).where(Loan.id == loan_id))
        loan = result.scalar_one_or_none()

        if not loan:
            raise ValueError("Loan not found")

        if loan.status not in [LoanStatus.ACTIVE, LoanStatus.APPROVED]:
            raise ValueError(f"Cannot reschedule loan in {loan.status} status")

        if not restructure_date:
            restructure_date = date.today()

        # Store original terms for history
        original_tenure = loan.tenure_months
        original_rate = loan.interest_rate
        original_emi = loan.emi_amount

        # Update loan terms
        if new_tenure_months:
            loan.tenure_months = new_tenure_months

        if new_interest_rate:
            loan.interest_rate = new_interest_rate

        # Calculate remaining principal
        remaining_principal = loan.outstanding_principal

        # Recalculate EMI if it's an EMI loan
        if loan.emi_amount and loan.emi_amount > 0:
            new_emi = InterestCalculator.calculate_emi(
                principal=remaining_principal,
                annual_rate=loan.interest_rate,
                tenure_months=loan.tenure_months,
            )
            loan.emi_amount = new_emi
            loan.number_of_emis = loan.tenure_months

        # Calculate new total payable
        if loan.emi_amount:
            loan.total_amount_payable = loan.emi_amount * loan.number_of_emis
        else:
            # For non-EMI loans, recalculate simple interest
            interest = InterestCalculator.calculate_simple_interest(
                principal=remaining_principal,
                annual_rate=loan.interest_rate,
                tenure_months=loan.tenure_months,
            )
            loan.total_amount_payable = remaining_principal + interest

        # Update outstanding interest
        loan.outstanding_interest = loan.total_amount_payable - remaining_principal

        # Update maturity date
        loan.maturity_date = restructure_date + timedelta(days=loan.tenure_months * 30)

        # Mark as rescheduled
        loan.status = LoanStatus.RESCHEDULED

        # Delete old EMI schedule
        await db.execute(
            EMISchedule.__table__.delete().where(
                EMISchedule.loan_id == loan_id, EMISchedule.is_paid == False
            )
        )

        # Generate new EMI schedule if applicable
        if loan.emi_amount:
            loan.first_emi_date = restructure_date + timedelta(days=30)
            await LoanService.generate_emi_schedule(db, loan)

        await db.commit()
        await db.refresh(loan)

        return loan

    @staticmethod
    async def get_rescheduling_options(db: AsyncSession, loan_id: int) -> Dict:
        """
        Get available rescheduling options for a loan
        Shows different scenarios with new EMI amounts
        """
        # Get loan
        result = await db.execute(select(Loan).where(Loan.id == loan_id))
        loan = result.scalar_one_or_none()

        if not loan:
            raise ValueError("Loan not found")

        remaining_principal = loan.outstanding_principal
        current_tenure = loan.tenure_months
        current_rate = loan.interest_rate

        # Calculate options
        options = []

        # Option 1: Extend tenure by 6 months
        if loan.emi_amount:
            new_tenure_6m = current_tenure + 6
            new_emi_6m = InterestCalculator.calculate_emi(
                remaining_principal, current_rate, new_tenure_6m
            )
            options.append(
                {
                    "option": "Extend tenure by 6 months",
                    "new_tenure_months": new_tenure_6m,
                    "new_interest_rate": current_rate,
                    "new_emi_amount": round(new_emi_6m, 2),
                    "total_payable": round(new_emi_6m * new_tenure_6m, 2),
                    "savings_per_month": round(loan.emi_amount - new_emi_6m, 2),
                }
            )

            # Option 2: Extend tenure by 12 months
            new_tenure_12m = current_tenure + 12
            new_emi_12m = InterestCalculator.calculate_emi(
                remaining_principal, current_rate, new_tenure_12m
            )
            options.append(
                {
                    "option": "Extend tenure by 12 months",
                    "new_tenure_months": new_tenure_12m,
                    "new_interest_rate": current_rate,
                    "new_emi_amount": round(new_emi_12m, 2),
                    "total_payable": round(new_emi_12m * new_tenure_12m, 2),
                    "savings_per_month": round(loan.emi_amount - new_emi_12m, 2),
                }
            )

            # Option 3: Reduce tenure by 6 months (if possible)
            if current_tenure > 12:
                new_tenure_reduce = current_tenure - 6
                new_emi_reduce = InterestCalculator.calculate_emi(
                    remaining_principal, current_rate, new_tenure_reduce
                )
                options.append(
                    {
                        "option": "Reduce tenure by 6 months",
                        "new_tenure_months": new_tenure_reduce,
                        "new_interest_rate": current_rate,
                        "new_emi_amount": round(new_emi_reduce, 2),
                        "total_payable": round(new_emi_reduce * new_tenure_reduce, 2),
                        "additional_per_month": round(
                            new_emi_reduce - loan.emi_amount, 2
                        ),
                    }
                )

        return {
            "loan_id": loan_id,
            "loan_number": loan.loan_number,
            "current_outstanding_principal": round(remaining_principal, 2),
            "current_tenure_months": current_tenure,
            "current_interest_rate": current_rate,
            "current_emi_amount": (
                round(loan.emi_amount, 2) if loan.emi_amount else None
            ),
            "rescheduling_options": options,
        }

    @staticmethod
    async def get_rescheduled_loans(db: AsyncSession) -> list:
        """Get all rescheduled loans"""
        result = await db.execute(
            select(Loan).where(Loan.status == LoanStatus.RESCHEDULED)
        )
        return result.scalars().all()
