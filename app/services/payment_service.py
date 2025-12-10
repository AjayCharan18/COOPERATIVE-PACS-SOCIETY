"""
Payment processing service
"""
from typing import Optional
from datetime import date, datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid

from app.models.payment import Payment, PaymentStatus, PaymentMode, PaymentType
from app.models.loan_ledger import LoanLedger
from app.models.loan import Loan, LoanStatus, EMISchedule
from app.models.user import User
from app.schemas.payment import PaymentCreate
from app.services.interest_calculator import InterestCalculator


class PaymentService:
    """Service for payment processing"""
    
    @staticmethod
    async def process_payment(
        db: AsyncSession,
        payment_data: PaymentCreate,
        paid_by: User,
        received_by: Optional[User] = None
    ) -> Payment:
        """Process a loan payment"""
        
        # Get loan
        result = await db.execute(select(Loan).where(Loan.id == payment_data.loan_id))
        loan = result.scalar_one_or_none()
        
        if not loan:
            raise ValueError("Loan not found")
        
        if loan.status not in [LoanStatus.ACTIVE, LoanStatus.DEFAULTED]:
            raise ValueError("Loan is not active")
        
        # Generate transaction ID
        transaction_id = f"TXN{datetime.now().strftime('%Y%m%d%H%M%S')}{str(uuid.uuid4())[:6].upper()}"
        
        # Calculate payment allocation
        allocation = await PaymentService._allocate_payment(
            loan,
            payment_data.amount,
            payment_data.payment_date
        )
        
        # Create payment record
        payment = Payment(
            transaction_id=transaction_id,
            loan_id=loan.id,
            payment_date=payment_data.payment_date,
            payment_mode=payment_data.payment_mode,
            payment_type=payment_data.payment_type,
            amount=payment_data.amount,
            principal_paid=allocation["principal"],
            interest_paid=allocation["interest"],
            penal_interest_paid=allocation["penal"],
            status=PaymentStatus.SUCCESS,
            reference_number=payment_data.reference_number,
            bank_name=payment_data.bank_name,
            upi_id=payment_data.upi_id,
            remarks=payment_data.remarks,
            paid_by_user_id=paid_by.id,
            received_by_id=received_by.id if received_by else None,
            receipt_number=f"RCP{datetime.now().strftime('%Y%m%d')}{str(uuid.uuid4())[:8].upper()}"
        )
        
        db.add(payment)
        await db.flush()
        
        # Update loan outstanding
        loan.total_paid += payment_data.amount
        loan.outstanding_principal -= allocation["principal"]
        loan.outstanding_interest -= allocation["interest"]
        loan.penal_interest -= allocation["penal"]
        loan.total_outstanding = (
            loan.outstanding_principal + 
            loan.outstanding_interest + 
            loan.penal_interest
        )
        
        # Check if loan is fully paid
        if loan.total_outstanding <= 0:
            loan.status = LoanStatus.CLOSED
        
        # Update EMI schedule if applicable
        if loan.emi_amount:
            await PaymentService._update_emi_schedule(db, loan, payment)
        
        # Create ledger entry
        ledger_entry = LoanLedger(
            loan_id=loan.id,
            entry_date=payment_data.payment_date,
            transaction_type="PAYMENT",
            debit=0.0,
            credit=payment_data.amount,
            principal_amount=allocation["principal"],
            interest_amount=allocation["interest"],
            penal_interest_amount=allocation["penal"],
            outstanding_principal=loan.outstanding_principal,
            outstanding_interest=loan.outstanding_interest,
            total_outstanding=loan.total_outstanding,
            payment_id=payment.id,
            narration=f"Payment received - {payment.transaction_id}"
        )
        db.add(ledger_entry)
        
        await db.commit()
        await db.refresh(payment)
        
        return payment
    
    @staticmethod
    async def _allocate_payment(
        loan: Loan,
        amount: float,
        payment_date: date
    ) -> dict:
        """
        Allocate payment to penal interest, interest, and principal
        Priority: Penal Interest > Interest > Principal
        """
        remaining = amount
        
        # First, pay penal interest
        penal_paid = min(remaining, loan.penal_interest)
        remaining -= penal_paid
        
        # Then, pay interest
        # Recalculate accrued interest till payment date
        if loan.disbursement_date:
            accrued_interest = InterestCalculator.calculate_prorata_interest(
                loan.outstanding_principal,
                loan.interest_rate,
                loan.disbursement_date,
                payment_date
            )
        else:
            accrued_interest = loan.outstanding_interest
        
        interest_paid = min(remaining, accrued_interest)
        remaining -= interest_paid
        
        # Finally, pay principal
        principal_paid = min(remaining, loan.outstanding_principal)
        
        return {
            "penal": round(penal_paid, 2),
            "interest": round(interest_paid, 2),
            "principal": round(principal_paid, 2)
        }
    
    @staticmethod
    async def _update_emi_schedule(
        db: AsyncSession,
        loan: Loan,
        payment: Payment
    ):
        """Update EMI schedule after payment"""
        # Find unpaid EMIs
        result = await db.execute(
            select(EMISchedule)
            .where(
                EMISchedule.loan_id == loan.id,
                EMISchedule.is_paid == False
            )
            .order_by(EMISchedule.due_date)
        )
        unpaid_emis = result.scalars().all()
        
        if unpaid_emis:
            # Mark first unpaid EMI as paid (simplified logic)
            first_unpaid = unpaid_emis[0]
            first_unpaid.is_paid = True
            first_unpaid.paid_date = payment.payment_date
            first_unpaid.paid_amount = payment.amount
            
            loan.emis_paid += 1
    
    @staticmethod
    async def get_loan_ledger(
        db: AsyncSession,
        loan_id: int
    ) -> list[LoanLedger]:
        """Get complete loan ledger"""
        result = await db.execute(
            select(LoanLedger)
            .where(LoanLedger.loan_id == loan_id)
            .order_by(LoanLedger.entry_date, LoanLedger.created_at)
        )
        return result.scalars().all()
