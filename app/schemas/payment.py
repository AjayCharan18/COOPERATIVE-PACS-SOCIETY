"""
Pydantic schemas for Payment models
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime
from app.models.payment import PaymentMode, PaymentStatus, PaymentType


class PaymentBase(BaseModel):
    loan_id: int
    payment_date: date
    payment_mode: PaymentMode
    payment_type: PaymentType
    amount: float = Field(..., gt=0)
    reference_number: Optional[str] = None
    bank_name: Optional[str] = None
    upi_id: Optional[str] = None
    remarks: Optional[str] = None


class PaymentCreate(PaymentBase):
    principal_paid: Optional[float] = Field(default=0.0, ge=0)
    interest_paid: Optional[float] = Field(default=0.0, ge=0)
    penal_interest_paid: Optional[float] = Field(default=0.0, ge=0)


class PaymentUpdate(BaseModel):
    status: Optional[PaymentStatus] = None
    remarks: Optional[str] = None


class Payment(PaymentBase):
    id: int
    transaction_id: str
    principal_paid: float
    interest_paid: float
    penal_interest_paid: float
    status: PaymentStatus
    paid_by_user_id: int
    received_by_id: Optional[int] = None
    receipt_number: Optional[str] = None
    receipt_generated: bool
    receipt_url: Optional[str] = None
    is_reconciled: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PaymentReceipt(BaseModel):
    """Receipt data for PDF generation"""

    receipt_number: str
    transaction_id: str
    payment_date: date
    farmer_name: str
    loan_number: str
    amount: float
    payment_mode: str
    principal_paid: float
    interest_paid: float
    penal_interest_paid: float
    outstanding_amount: float


# Loan Ledger schemas
class LoanLedgerEntry(BaseModel):
    id: int
    loan_id: int
    entry_date: date
    transaction_type: str
    debit: float
    credit: float
    principal_amount: float
    interest_amount: float
    penal_interest_amount: float
    outstanding_principal: float
    outstanding_interest: float
    total_outstanding: float
    narration: str
    created_at: datetime

    class Config:
        from_attributes = True


class LoanLedgerSummary(BaseModel):
    """Ledger summary with all entries"""

    loan_number: str
    farmer_name: str
    principal_amount: float
    total_interest: float
    total_paid: float
    outstanding: float
    entries: list[LoanLedgerEntry] = []
