"""
Payment API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional

from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.payment import Payment, PaymentStatus
from app.schemas.payment import (
    PaymentCreate,
    Payment as PaymentSchema,
    LoanLedgerSummary,
)
from app.api.deps import get_current_user, require_admin_or_employee
from app.services.payment_service import PaymentService

router = APIRouter()


@router.post("/", response_model=PaymentSchema, status_code=status.HTTP_201_CREATED)
async def create_payment(
    payment_data: PaymentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Process a loan payment
    Farmers can pay their own loans, employees can process any payment
    """
    # Process payment
    received_by = (
        current_user
        if current_user.role in [UserRole.ADMIN, UserRole.EMPLOYEE]
        else None
    )

    payment = await PaymentService.process_payment(
        db, payment_data, current_user, received_by
    )

    return payment


@router.get("/", response_model=List[PaymentSchema])
async def get_payments(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    loan_id: Optional[int] = None,
    status: Optional[PaymentStatus] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get payment history based on role:
    - Farmer: Only their payments
    - Employee: Payments in their branch
    - Admin: All payments
    """
    from app.models.loan import Loan
    from sqlalchemy.orm import joinedload

    query = select(Payment).options(joinedload(Payment.loan))

    # Filter by user role
    if current_user.role == UserRole.FARMER:
        # Farmers see only their own payments
        query = query.where(Payment.paid_by_user_id == current_user.id)
    elif current_user.role == UserRole.EMPLOYEE:
        # Employees see payments for loans in their branch
        query = query.join(Loan).where(Loan.branch_id == current_user.branch_id)
    # Admin sees all payments (no filter)

    if loan_id:
        query = query.where(Payment.loan_id == loan_id)

    if status:
        query = query.where(Payment.status == status)

    query = query.offset(skip).limit(limit).order_by(Payment.created_at.desc())

    result = await db.execute(query)
    payments = result.scalars().all()

    return payments


@router.get("/{payment_id}", response_model=PaymentSchema)
async def get_payment(
    payment_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get payment details"""

    result = await db.execute(select(Payment).where(Payment.id == payment_id))
    payment = result.scalar_one_or_none()

    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found"
        )

    return payment


@router.get("/receipt/{payment_id}")
async def download_receipt(
    payment_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Download payment receipt PDF"""

    result = await db.execute(select(Payment).where(Payment.id == payment_id))
    payment = result.scalar_one_or_none()

    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found"
        )

    # Generate PDF receipt (implement PDF service)
    # For now, return receipt data
    return {
        "receipt_number": payment.receipt_number,
        "transaction_id": payment.transaction_id,
        "amount": payment.amount,
        "payment_date": payment.payment_date,
        "status": payment.status,
    }


@router.get("/ledger/{loan_id}", response_model=LoanLedgerSummary)
async def get_loan_ledger(
    loan_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get complete loan ledger"""

    ledger_entries = await PaymentService.get_loan_ledger(db, loan_id)

    # Get loan details
    from app.models.loan import Loan

    result = await db.execute(select(Loan).where(Loan.id == loan_id))
    loan = result.scalar_one_or_none()

    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Loan not found"
        )

    return LoanLedgerSummary(
        loan_number=loan.loan_number,
        farmer_name=loan.farmer.full_name if loan.farmer else "N/A",
        principal_amount=loan.principal_amount,
        total_interest=loan.outstanding_interest
        + (loan.total_paid - loan.outstanding_principal),
        total_paid=loan.total_paid,
        outstanding=loan.total_outstanding,
        entries=[entry for entry in ledger_entries],
    )
