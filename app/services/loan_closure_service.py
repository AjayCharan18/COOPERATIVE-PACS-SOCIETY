"""
Service for loan closure operations
"""

from datetime import date, datetime
from typing import Dict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.loan import Loan, LoanStatus, EMISchedule
from app.models.payment import Payment, PaymentType


class LoanClosureService:
    """Service for closing loans"""

    @staticmethod
    async def calculate_closure_amount(db: AsyncSession, loan_id: int) -> Dict:
        """
        Calculate the total amount required to close a loan
        Includes outstanding principal, interest, penal interest, and any unpaid EMIs
        """
        # Get loan
        result = await db.execute(select(Loan).where(Loan.id == loan_id))
        loan = result.scalar_one_or_none()

        if not loan:
            raise ValueError("Loan not found")

        if loan.status not in [LoanStatus.ACTIVE, LoanStatus.APPROVED]:
            raise ValueError(f"Cannot close loan in {loan.status} status")

        # Get all unpaid EMIs
        emi_result = await db.execute(
            select(EMISchedule).where(
                EMISchedule.loan_id == loan_id, EMISchedule.is_paid == False
            )
        )
        unpaid_emis = emi_result.scalars().all()

        # Calculate totals
        total_emi_outstanding = sum(
            emi.emi_amount - emi.paid_amount for emi in unpaid_emis
        )
        total_penal_interest = sum(emi.penal_interest for emi in unpaid_emis)

        closure_amount = (
            loan.outstanding_principal
            + loan.outstanding_interest
            + total_penal_interest
        )

        return {
            "loan_id": loan_id,
            "loan_number": loan.loan_number,
            "outstanding_principal": round(loan.outstanding_principal, 2),
            "outstanding_interest": round(loan.outstanding_interest, 2),
            "penal_interest": round(total_penal_interest, 2),
            "total_closure_amount": round(closure_amount, 2),
            "unpaid_emis_count": len(unpaid_emis),
            "calculation_date": date.today(),
        }

    @staticmethod
    async def close_loan(
        db: AsyncSession,
        loan_id: int,
        closure_amount: float,
        payment_mode: str = "cash",
        remarks: str = None,
    ) -> Loan:
        """
        Close a loan after receiving full payment
        Updates loan status and marks all EMIs as paid
        """
        # Get loan
        result = await db.execute(select(Loan).where(Loan.id == loan_id))
        loan = result.scalar_one_or_none()

        if not loan:
            raise ValueError("Loan not found")

        if loan.status not in [LoanStatus.ACTIVE, LoanStatus.APPROVED]:
            raise ValueError(f"Cannot close loan in {loan.status} status")

        # Calculate required closure amount
        closure_details = await LoanClosureService.calculate_closure_amount(db, loan_id)
        required_amount = closure_details["total_closure_amount"]

        if closure_amount < required_amount:
            raise ValueError(
                f"Insufficient amount. Required: ₹{required_amount}, Provided: ₹{closure_amount}"
            )

        # Mark all unpaid EMIs as paid
        emi_result = await db.execute(
            select(EMISchedule).where(
                EMISchedule.loan_id == loan_id, EMISchedule.is_paid == False
            )
        )
        unpaid_emis = emi_result.scalars().all()

        for emi in unpaid_emis:
            emi.is_paid = True
            emi.paid_date = date.today()
            emi.paid_amount = emi.emi_amount

        # Update loan status
        loan.status = LoanStatus.CLOSED
        loan.outstanding_principal = 0.0
        loan.outstanding_interest = 0.0
        loan.penal_interest = 0.0
        loan.total_paid = loan.total_amount_payable

        # Add remarks if provided
        if not remarks:
            remarks = f"Loan closed with final payment of ₹{closure_amount}"

        await db.commit()
        await db.refresh(loan)

        return loan

    @staticmethod
    async def get_closed_loans_summary(db: AsyncSession, branch_id: int = None) -> Dict:
        """Get summary of all closed loans"""
        query = select(Loan).where(Loan.status == LoanStatus.CLOSED)

        if branch_id:
            query = query.where(Loan.branch_id == branch_id)

        result = await db.execute(query)
        closed_loans = result.scalars().all()

        total_disbursed = sum(loan.principal_amount for loan in closed_loans)
        total_collected = sum(loan.total_paid for loan in closed_loans)

        return {
            "total_closed_loans": len(closed_loans),
            "total_principal_disbursed": round(total_disbursed, 2),
            "total_amount_collected": round(total_collected, 2),
            "average_loan_amount": (
                round(total_disbursed / len(closed_loans), 2) if closed_loans else 0
            ),
            "closure_rate": (
                round(
                    (len(closed_loans) / await db.scalar(select(Loan).count())) * 100, 2
                )
                if await db.scalar(select(Loan).count()) > 0
                else 0
            ),
        }
