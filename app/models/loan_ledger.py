"""
Loan Ledger Model
Records all financial transactions and accruals for audit trail
"""
from sqlalchemy import Column, Integer, String, Numeric, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.base import Base


class LoanLedger(Base):
    """
    Ledger entries for loan transactions and accruals
    Enables historical reporting and complete audit trail
    """
    __tablename__ = "loan_ledgers"

    id = Column(Integer, primary_key=True, index=True)
    loan_id = Column(Integer, ForeignKey("loans.id"), nullable=False, index=True)
    
    # Transaction details
    transaction_date = Column(Date, nullable=False, index=True)
    transaction_type = Column(String(50), nullable=False)  # ACCRUAL, PAYMENT, RATE_CHANGE, etc.
    
    # Amounts
    debit_amount = Column(Numeric(15, 2), default=0)  # Interest accrued, fees
    credit_amount = Column(Numeric(15, 2), default=0)  # Payments received
    balance = Column(Numeric(15, 2), nullable=False)  # Running balance
    
    # Reference
    reference_type = Column(String(50))  # PAYMENT, DAILY_ACCRUAL, MANUAL
    reference_id = Column(Integer)  # Payment ID, Job ID, etc.
    
    # Description and metadata
    description = Column(Text)
    narration = Column(Text)  # Human-readable explanation
    
    # Rate information
    interest_rate_applied = Column(Numeric(5, 2))
    days_calculated = Column(Integer)
    
    # Audit
    created_by = Column(String(100), default="system")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    loan = relationship("Loan", back_populates="ledger_entries")


class AccrualJob(Base):
    """
    Track daily accrual job executions
    Ensures idempotency and tracks processing status
    """
    __tablename__ = "accrual_jobs"

    id = Column(Integer, primary_key=True, index=True)
    
    # Job details
    job_date = Column(Date, nullable=False, unique=True, index=True)
    job_type = Column(String(50), default="DAILY_ACCRUAL")
    
    # Status
    status = Column(String(20), default="pending")  # pending, running, completed, failed
    
    # Results
    loans_processed = Column(Integer, default=0)
    total_accrual_amount = Column(Numeric(15, 2), default=0)
    errors_count = Column(Integer, default=0)
    error_details = Column(Text)
    
    # Timing
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    duration_seconds = Column(Integer)
    
    # Audit
    triggered_by = Column(String(100), default="system")
    created_at = Column(DateTime, default=datetime.utcnow)


class CalculationCache(Base):
    """
    Cache calculation results for performance
    Invalidated when loan or payments change
    """
    __tablename__ = "calculation_cache"

    id = Column(Integer, primary_key=True, index=True)
    
    # Cache key
    loan_id = Column(Integer, ForeignKey("loans.id"), nullable=False, index=True)
    as_of_date = Column(Date, nullable=False)
    calculation_type = Column(String(50), nullable=False)  # INTEREST, EMI_SCHEDULE, OUTSTANDING
    
    # Cached data
    result_json = Column(Text, nullable=False)  # JSON string of calculation result
    
    # Metadata
    cache_hash = Column(String(64))  # Hash of loan state + payments
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)
    accessed_count = Column(Integer, default=0)
    last_accessed_at = Column(DateTime)
    
    # Relationships
    loan = relationship("Loan")


class AuditLog(Base):
    """
    Comprehensive audit trail for all automated actions
    """
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    
    # Actor
    actor_type = Column(String(20), nullable=False)  # user, system, worker
    actor_id = Column(Integer)  # User ID if applicable
    actor_name = Column(String(100))
    
    # Action
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50))  # loan, payment, user
    entity_id = Column(Integer)
    
    # Changes
    old_value = Column(Text)  # JSON
    new_value = Column(Text)  # JSON
    
    # Context
    rule_applied = Column(String(100))  # Which business rule triggered this
    ip_address = Column(String(45))
    user_agent = Column(String(255))
    
    # Details
    description = Column(Text)
    extra_data = Column(Text)  # JSON for additional context
    
    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
