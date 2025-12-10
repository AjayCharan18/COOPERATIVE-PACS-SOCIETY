"""
Payment and transaction models
"""
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date, DateTime, Text, Enum as SQLEnum, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.db.base import Base, TimestampMixin


class PaymentMode(str, enum.Enum):
    """Payment method types"""
    CASH = "cash"
    CHEQUE = "cheque"
    NEFT = "neft"
    RTGS = "rtgs"
    IMPS = "imps"
    UPI = "upi"
    DEBIT_CARD = "debit_card"
    CREDIT_CARD = "credit_card"
    NET_BANKING = "net_banking"


class PaymentStatus(str, enum.Enum):
    """Payment processing status"""
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"
    REVERSED = "reversed"


class PaymentType(str, enum.Enum):
    """Type of payment"""
    EMI = "emi"
    PRINCIPAL = "principal"
    INTEREST = "interest"
    PENAL_INTEREST = "penal_interest"
    PART_PAYMENT = "part_payment"
    FULL_PAYMENT = "full_payment"
    FORECLOSURE = "foreclosure"


class Payment(Base, TimestampMixin):
    """Payment transactions"""
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String(100), unique=True, index=True, nullable=False)
    
    # Loan reference
    loan_id = Column(Integer, ForeignKey("loans.id"), nullable=False)
    loan = relationship("Loan", back_populates="payments")
    
    # Payment details
    payment_date = Column(Date, nullable=False)
    payment_mode = Column(SQLEnum(PaymentMode), nullable=False)
    payment_type = Column(SQLEnum(PaymentType), nullable=False)
    amount = Column(Float, nullable=False)
    
    # Payment breakdown
    principal_paid = Column(Float, default=0.0)
    interest_paid = Column(Float, default=0.0)
    penal_interest_paid = Column(Float, default=0.0)
    
    # Status
    status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING)
    
    # Reference details
    reference_number = Column(String(100), nullable=True)  # Cheque no, UTR, etc.
    bank_name = Column(String, nullable=True)
    
    # UPI details
    upi_id = Column(String, nullable=True)
    
    # Processed by
    received_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    received_by = relationship("User", foreign_keys=[received_by_id])
    
    # Paid by
    paid_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    paid_by_user = relationship("User", back_populates="payments", foreign_keys=[paid_by_user_id])
    
    # Receipt
    receipt_number = Column(String(50), unique=True, nullable=True)
    receipt_generated = Column(Boolean, default=False)
    receipt_url = Column(String, nullable=True)
    
    # Remarks
    remarks = Column(Text, nullable=True)
    
    # Reconciliation
    is_reconciled = Column(Boolean, default=False)
    reconciled_date = Column(DateTime, nullable=True)
    
    def __repr__(self):
        return f"<Payment {self.transaction_id} - ₹{self.amount}>"
