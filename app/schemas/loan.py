"""
Pydantic schemas for Loan models
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import date, datetime
from app.models.loan import LoanType, LoanStatus, InterestCalculationType


# Loan Type Config schemas
class LoanTypeConfigBase(BaseModel):
    loan_type: LoanType
    display_name: str
    description: Optional[str] = None
    default_interest_rate: float = Field(..., gt=0, le=100)
    default_tenure_months: int = Field(..., gt=0)
    min_amount: float = Field(default=0.0, ge=0)
    max_amount: Optional[float] = Field(None, gt=0)
    interest_calculation_type: InterestCalculationType = InterestCalculationType.PRORATA_DAILY
    penal_interest_rate: float = Field(default=2.0, ge=0)
    overdue_days_for_penalty: int = Field(default=90, gt=0)
    requires_emi: bool = False
    emi_frequency: str = "monthly"
    min_land_area: Optional[float] = None
    eligible_crops: Optional[str] = None


class LoanTypeConfigCreate(LoanTypeConfigBase):
    pass


class LoanTypeConfigUpdate(BaseModel):
    display_name: Optional[str] = None
    description: Optional[str] = None
    default_interest_rate: Optional[float] = Field(None, gt=0, le=100)
    default_tenure_months: Optional[int] = Field(None, gt=0)
    min_amount: Optional[float] = Field(None, ge=0)
    max_amount: Optional[float] = Field(None, gt=0)
    penal_interest_rate: Optional[float] = Field(None, ge=0)
    is_active: Optional[bool] = None


class LoanTypeConfig(LoanTypeConfigBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Loan schemas
class LoanBase(BaseModel):
    loan_type: LoanType
    principal_amount: float = Field(..., gt=0)
    interest_rate: float = Field(..., gt=0, le=100)
    tenure_months: int = Field(..., gt=0)
    purpose: str
    crop_season: Optional[str] = None
    collateral_details: Optional[str] = None


class LoanCreate(LoanBase):
    farmer_id: int
    branch_id: int
    sanction_date: date
    first_emi_date: Optional[date] = None
    penal_interest_rate: Optional[float] = Field(default=2.0, ge=0)
    interest_calculation_type: InterestCalculationType = InterestCalculationType.PRORATA_DAILY
    subsidy_scheme: Optional[str] = None


class LoanUpdate(BaseModel):
    interest_rate: Optional[float] = Field(None, gt=0, le=100)
    status: Optional[LoanStatus] = None
    documents_verified: Optional[bool] = None
    collateral_details: Optional[str] = None
    approval_remarks: Optional[str] = None


class LoanApproval(BaseModel):
    loan_id: int
    approved: bool
    remarks: Optional[str] = None
    disbursement_date: Optional[date] = None


class LoanReschedule(BaseModel):
    loan_id: int
    new_tenure_months: int = Field(..., gt=0)
    new_interest_rate: Optional[float] = Field(None, gt=0, le=100)
    reason: str


class Loan(LoanBase):
    id: int
    loan_number: str
    farmer_id: int
    branch_id: int
    status: LoanStatus
    sanction_date: date
    disbursement_date: Optional[date] = None
    maturity_date: date
    total_amount_payable: float
    total_paid: float
    outstanding_principal: float
    outstanding_interest: float
    penal_interest: float
    total_outstanding: float
    emi_amount: Optional[float] = None
    number_of_emis: Optional[int] = None
    emis_paid: int
    subsidy_amount: float
    subsidy_received: bool
    risk_score: Optional[float] = None
    predicted_default_probability: Optional[float] = None
    is_rescheduled: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class LoanDetail(Loan):
    """Extended loan info with relationships"""
    farmer_name: Optional[str] = None
    branch_name: Optional[str] = None
    approved_by_name: Optional[str] = None
    emi_schedule: List['EMISchedule'] = []


class LoanSummary(BaseModel):
    """Summary statistics for loans"""
    total_loans: int
    active_loans: int
    total_disbursed: float
    total_outstanding: float
    total_collected: float
    overdue_loans: int
    overdue_amount: float
    npa_loans: int
    npa_amount: float


# EMI Schedule schemas
class EMIScheduleBase(BaseModel):
    installment_number: int
    due_date: date
    emi_amount: float
    principal_component: float
    interest_component: float
    outstanding_principal: float


class EMISchedule(EMIScheduleBase):
    id: int
    loan_id: int
    is_paid: bool
    paid_date: Optional[date] = None
    paid_amount: float
    is_overdue: bool
    overdue_days: int
    penal_interest: float
    
    class Config:
        from_attributes = True


class LoanWithSchedule(Loan):
    """Loan with EMI schedule"""
    emi_schedule: List[EMISchedule] = []


# Update forward references
LoanDetail.model_rebuild()
LoanWithSchedule.model_rebuild()
