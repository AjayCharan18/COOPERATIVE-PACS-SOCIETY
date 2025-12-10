"""
Loan models for different loan types and configurations
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, Enum as SQLEnum, ForeignKey, Date, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime, date
import enum

from app.db.base import Base, TimestampMixin


class LoanType(str, enum.Enum):
    """Types of loans offered"""
    SAO = "sao"  # Short-term Agricultural Operations
    LONG_TERM_EMI = "long_term_emi"  # 9 years
    RYTHU_BANDHU = "rythu_bandhu"
    RYTHU_NETHANY = "rythu_nethany"  # 10 years EMI
    AMUL_LOAN = "amul_loan"  # 10 months EMI
    CUSTOM = "custom"


class LoanStatus(str, enum.Enum):
    """Loan application and repayment status"""
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    ACTIVE = "active"
    CLOSED = "closed"
    DEFAULTED = "defaulted"
    REJECTED = "rejected"
    RESCHEDULED = "rescheduled"


class InterestCalculationType(str, enum.Enum):
    """How interest is calculated"""
    SIMPLE = "simple"
    COMPOUND = "compound"
    PRORATA_DAILY = "prorata_daily"
    EMI = "emi"


class Loan(Base, TimestampMixin):
    """Main loan model"""
    __tablename__ = "loans"
    
    id = Column(Integer, primary_key=True, index=True)
    loan_number = Column(String(50), unique=True, index=True, nullable=False)
    
    # Farmer details
    farmer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    farmer = relationship("User", back_populates="loans", foreign_keys=[farmer_id])
    
    # Branch
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    branch = relationship("Branch", back_populates="loans")
    
    # Loan type and configuration
    loan_type = Column(SQLEnum(LoanType), nullable=False)
    loan_type_config_id = Column(Integer, ForeignKey("loan_type_configs.id"), nullable=True)
    loan_type_config = relationship("LoanTypeConfig")
    
    # Financial details
    principal_amount = Column(Float, nullable=False)
    interest_rate = Column(Float, nullable=False)  # Annual rate
    penal_interest_rate = Column(Float, default=2.0)
    tenure_months = Column(Integer, nullable=False)
    
    # Calculation method
    interest_calculation_type = Column(SQLEnum(InterestCalculationType), default=InterestCalculationType.PRORATA_DAILY)
    
    # Dates
    sanction_date = Column(Date, nullable=False)
    disbursement_date = Column(Date, nullable=True)
    first_emi_date = Column(Date, nullable=True)
    maturity_date = Column(Date, nullable=False)
    
    # Status
    status = Column(SQLEnum(LoanStatus), default=LoanStatus.PENDING_APPROVAL)
    
    # Outstanding amounts
    total_amount_payable = Column(Float, default=0.0)  # Principal + Interest
    total_paid = Column(Float, default=0.0)
    outstanding_principal = Column(Float, default=0.0)
    outstanding_interest = Column(Float, default=0.0)
    penal_interest = Column(Float, default=0.0)
    total_outstanding = Column(Float, default=0.0)
    
    # EMI details (if applicable)
    emi_amount = Column(Float, nullable=True)
    number_of_emis = Column(Integer, nullable=True)
    emis_paid = Column(Integer, default=0)
    
    # Purpose
    purpose = Column(String, nullable=False)
    crop_season = Column(String, nullable=True)
    
    # Documents
    documents_verified = Column(Boolean, default=False)
    collateral_details = Column(Text, nullable=True)
    
    # Subsidy tracking
    subsidy_amount = Column(Float, default=0.0)
    subsidy_received = Column(Boolean, default=False)
    subsidy_scheme = Column(String, nullable=True)
    
    # Risk assessment
    risk_score = Column(Float, nullable=True)  # ML-based risk score
    predicted_default_probability = Column(Float, nullable=True)
    
    # Approval
    approved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_by = relationship("User", foreign_keys=[approved_by_id])
    approval_date = Column(DateTime, nullable=True)
    approval_remarks = Column(Text, nullable=True)
    
    # Rescheduling
    is_rescheduled = Column(Boolean, default=False)
    original_loan_id = Column(Integer, ForeignKey("loans.id"), nullable=True)
    reschedule_reason = Column(Text, nullable=True)
    
    # Relationships
    payments = relationship("Payment", back_populates="loan", cascade="all, delete-orphan")
    ledger_entries = relationship("LoanLedger", back_populates="loan", cascade="all, delete-orphan")
    emi_schedule = relationship("EMISchedule", back_populates="loan", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Loan {self.loan_number} - {self.loan_type}>"


class LoanTypeConfig(Base, TimestampMixin):
    """Configuration for different loan types"""
    __tablename__ = "loan_type_configs"
    
    id = Column(Integer, primary_key=True, index=True)
    loan_type = Column(SQLEnum(LoanType), unique=True, nullable=False)
    display_name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    
    # Default values
    default_interest_rate = Column(Float, nullable=False)
    default_tenure_months = Column(Integer, nullable=False)
    min_amount = Column(Float, default=0.0)
    max_amount = Column(Float, nullable=True)
    
    # Interest calculation
    interest_calculation_type = Column(SQLEnum(InterestCalculationType), default=InterestCalculationType.PRORATA_DAILY)
    
    # Penalty
    penal_interest_rate = Column(Float, default=2.0)
    overdue_days_for_penalty = Column(Integer, default=90)
    
    # EMI
    requires_emi = Column(Boolean, default=False)
    emi_frequency = Column(String, default="monthly")  # monthly, quarterly, etc.
    
    # Eligibility
    min_land_area = Column(Float, nullable=True)
    eligible_crops = Column(Text, nullable=True)  # JSON array
    
    # Active status
    is_active = Column(Boolean, default=True)
    
    def __repr__(self):
        return f"<LoanTypeConfig {self.display_name}>"


class EMISchedule(Base, TimestampMixin):
    """EMI payment schedule for loans"""
    __tablename__ = "emi_schedules"
    
    id = Column(Integer, primary_key=True, index=True)
    loan_id = Column(Integer, ForeignKey("loans.id"), nullable=False)
    loan = relationship("Loan", back_populates="emi_schedule")
    
    installment_number = Column(Integer, nullable=False)
    due_date = Column(Date, nullable=False)
    
    # EMI breakdown
    emi_amount = Column(Float, nullable=False)
    principal_component = Column(Float, nullable=False)
    interest_component = Column(Float, nullable=False)
    
    # Outstanding at that point
    outstanding_principal = Column(Float, nullable=False)
    
    # Payment status
    is_paid = Column(Boolean, default=False)
    paid_date = Column(Date, nullable=True)
    paid_amount = Column(Float, default=0.0)
    
    # Overdue
    is_overdue = Column(Boolean, default=False)
    overdue_days = Column(Integer, default=0)
    penal_interest = Column(Float, default=0.0)
    
    def __repr__(self):
        return f"<EMI {self.loan.loan_number} - Installment {self.installment_number}>"
