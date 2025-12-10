"""
Smart Calculator API Endpoints
Provides calculation and simulation capabilities for farmers and employees
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from datetime import date, datetime, timedelta
from decimal import Decimal
from pydantic import BaseModel, Field

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.services.smart_calculator import SmartCalculator
from app.services.daily_accrual_service import DailyAccrualService

router = APIRouter()


# ==================== REQUEST/RESPONSE MODELS ====================

class ProRataInterestRequest(BaseModel):
    loan_id: int
    from_date: Optional[date] = None
    to_date: Optional[date] = None

class InterestProjectionRequest(BaseModel):
    loan_id: int

class OverdueCalculationRequest(BaseModel):
    loan_id: int
    overdue_amount: Decimal = Field(gt=0)
    overdue_days: int = Field(ge=0)

class PenaltyCalculationRequest(BaseModel):
    loan_id: int
    overdue_amount: Decimal = Field(gt=0)
    overdue_days: int = Field(ge=0)

class LoanLedgerRequest(BaseModel):
    loan_id: int

class EMIAmortizationRequest(BaseModel):
    loan_id: int

class LoanComparisonRequest(BaseModel):
    principal_amount: Decimal = Field(gt=0)
    tenure_months: int = Field(gt=0, le=120)
    loan_types: List[str] = Field(description="List of loan types to compare")

class SmartRecommendationRequest(BaseModel):
    loan_id: int
    farmer_monthly_income: Optional[Decimal] = None

class SimulatePaymentRequest(BaseModel):
    loan_id: int
    payment_amount: Decimal = Field(gt=0)
    payment_date: date
    simulation_type: str = Field(description="early_payment or prepayment")
    reduce_emi: Optional[bool] = True

class AIExplanationRequest(BaseModel):
    loan_id: int
    query: Optional[str] = None

class RepaymentPlanRequest(BaseModel):
    loan_id: int
    extra_payment: Optional[Decimal] = Field(default=None, gt=0)

class InterestForDaysRequest(BaseModel):
    loan_type: str
    principal_amount: Decimal = Field(gt=0)
    days: int = Field(gt=0)
    disbursement_date: Optional[date] = None


# ==================== CORE CALCULATIONS ====================

@router.get("/loans")
async def get_calculator_loans(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get loans accessible to current user for calculator
    """
    from app.models.loan import Loan, LoanStatus
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    
    query = select(Loan).options(selectinload(Loan.farmer))
    
    # Filter based on user role
    if current_user.role.value == "farmer":
        # Farmers see loans where farmer_id matches their user ID
        query = query.where(Loan.farmer_id == current_user.id)
    elif current_user.role.value == "employee":
        if current_user.branch_id:
            query = query.where(Loan.branch_id == current_user.branch_id)
    # Admin sees all loans
    
    # Only show active loans with disbursement date (approved loans that have been disbursed)
    query = query.where(
        Loan.status.in_([LoanStatus.ACTIVE, LoanStatus.APPROVED]),
        Loan.disbursement_date.isnot(None)
    )
    
    result = await db.execute(query)
    loans = result.scalars().all()
    
    # Return all loans that match the criteria (active/approved with disbursement date)
    active_loans = []
    for loan in loans:
        # Check if loan has outstanding balance or is newly disbursed
        outstanding = loan.total_outstanding if loan.total_outstanding else loan.principal_amount
        
        active_loans.append({
            "id": loan.id,
            "loan_number": loan.loan_number,
            "farmer_name": loan.farmer.full_name if loan.farmer else "Unknown",
            "loan_type": loan.loan_type.value,
            "principal_amount": float(loan.principal_amount),
            "interest_rate": float(loan.interest_rate),
            "outstanding_balance": float(outstanding),
            "status": loan.status.value,
            "disbursement_date": loan.disbursement_date.isoformat() if loan.disbursement_date else None,
            "tenure_months": loan.tenure_months,
            "emi_amount": float(loan.emi_amount) if loan.emi_amount else None,
        })
    
    return active_loans


@router.post("/calculate/pro-rata-interest")
async def calculate_pro_rata_interest(
    request: ProRataInterestRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    ✔ Calculate pro-rata (daily) interest for exact date range
    ✔ Automatically switches rate if loan crosses 1 year
    ✔ Handles any period: 1 month 10 days, 95 days, etc.
    
    Example: Farmer takes ₹50,000 loan
    - 1 month 10 days
    - 3 days late
    - 95 days overdue
    
    Calculator computes exact interest automatically
    """
    calculator = SmartCalculator(db)
    
    try:
        result = await calculator.calculate_pro_rata_interest(
            loan_id=request.loan_id,
            from_date=request.from_date,
            to_date=request.to_date
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/calculate/interest-for-days")
async def calculate_interest_for_days(
    request: InterestForDaysRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    ✔ Calculate interest for any loan type, amount, and number of days
    ✔ Automatically switches rate if period crosses 1 year
    ✔ Perfect for showing farmers before loan disbursement
    
    Used by Admin/Employee dashboards to demonstrate interest charges
    """
    from app.models.loan import LoanTypeConfig
    from sqlalchemy import select
    import logging
    
    logger = logging.getLogger(__name__)
    
    try:
        # Get loan type configuration
        query = select(LoanTypeConfig).where(LoanTypeConfig.loan_type == request.loan_type)
        result = await db.execute(query)
        loan_config = result.scalar_one_or_none()
        
        if not loan_config:
            raise HTTPException(status_code=404, detail=f"Loan type {request.loan_type} not found")
        
        # Set start date
        start_date = request.disbursement_date or date.today()
        end_date = start_date + timedelta(days=request.days)
        
        # Get interest rates
        base_rate = float(loan_config.default_interest_rate)
        
        # Rate after 1 year based on loan type (matching smart_calculator.py logic)
        loan_type_value = request.loan_type if isinstance(request.loan_type, str) else request.loan_type.value
        if loan_type_value == "sao":
            rate_after = 13.75
        elif loan_type_value in ["rythu_bandhu", "rythu_nethany"]:
            rate_after = 14.5
        elif loan_type_value == "long_term_emi":
            rate_after = 12.75
        elif loan_type_value == "amul_loan":
            rate_after = 14.0
        else:
            rate_after = base_rate + 2.0  # Default +2%
        
        principal = float(request.principal_amount)
        
        # Calculate interest with rate switching
        rate_breakdown = []
        total_interest = 0.0
        
        if request.days <= 365:
            # All days in first year - use base rate
            daily_rate = base_rate / 365 / 100
            interest = principal * daily_rate * request.days
            total_interest = interest
            
            rate_breakdown.append({
                "days": request.days,
                "rate": base_rate,
                "interest": round(interest, 2)
            })
        else:
            # Period crosses 1 year - split calculation
            # First 365 days at base rate
            daily_rate_base = base_rate / 365 / 100
            interest_year_1 = principal * daily_rate_base * 365
            total_interest += interest_year_1
            
            rate_breakdown.append({
                "days": 365,
                "rate": base_rate,
                "interest": round(interest_year_1, 2)
            })
            
            # Remaining days at higher rate
            remaining_days = request.days - 365
            daily_rate_after = rate_after / 365 / 100
            interest_year_2 = principal * daily_rate_after * remaining_days
            total_interest += interest_year_2
            
            rate_breakdown.append({
                "days": remaining_days,
                "rate": rate_after,
                "interest": round(interest_year_2, 2)
            })
        
        # Calculate daily interest (average across period)
        daily_interest = total_interest / request.days
        
        return {
            "loan_type": request.loan_type,
            "loan_name": loan_config.display_name,
            "principal_amount": principal,
            "days": request.days,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "total_interest": round(total_interest, 2),
            "daily_interest": round(daily_interest, 2),
            "total_amount": round(principal + total_interest, 2),
            "rate_breakdown": rate_breakdown,
            "base_rate": base_rate,
            "rate_after_year": rate_after
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error calculating interest for days: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error calculating interest: {str(e)}")


@router.post("/calculate/interest-projections")
async def calculate_interest_projections(
    request: InterestProjectionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    ✔ Calculate what farmer owes:
    - Today
    - Tomorrow
    - After 10 days
    - Next month
    
    Very useful for PACS employees!
    """
    calculator = SmartCalculator(db)
    
    try:
        result = await calculator.calculate_interest_today_tomorrow_future(request.loan_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/calculate/overdue-with-penalty")
async def calculate_overdue_with_penalty(
    request: OverdueCalculationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    ✔ Calculate overdue interest with tiered penalty
    
    Example: Farmer delayed EMI by 35 days
    - Normal EMI
    - Overdue interest
    - Penalty (if >90 days)
    - Updated outstanding
    """
    calculator = SmartCalculator(db)
    
    try:
        result = await calculator.calculate_overdue_with_penalty(
            loan_id=request.loan_id,
            overdue_amount=request.overdue_amount,
            overdue_days=request.overdue_days
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ==================== LEDGER & EMI TABLES ====================

@router.post("/generate/loan-ledger")
async def generate_loan_ledger(
    request: LoanLedgerRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    ✔ Generate full loan ledger like banks
    
    | Date | Description | Credit | Debit | Interest | Balance |
    
    Includes:
    - Opening balance
    - Interest accrued
    - Payments received
    - EMI adjustments
    - Closing balance
    """
    calculator = SmartCalculator(db)
    
    try:
        result = await calculator.generate_full_loan_ledger(request.loan_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/generate/emi-amortization")
async def generate_emi_amortization(
    request: EMIAmortizationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    ✔ Generate EMI amortization table (HDFC/Union Bank style)
    
    Shows for each month:
    - Monthly EMI
    - Principal vs Interest split
    - Outstanding balance
    - Closing balance
    - Total payable
    - Total interest paid
    """
    calculator = SmartCalculator(db)
    
    try:
        result = await calculator.generate_emi_amortization_table(request.loan_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ==================== LOAN COMPARISON & RECOMMENDATIONS ====================

@router.post("/compare/loan-schemes")
async def compare_loan_schemes(
    request: LoanComparisonRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    ✔ Compare multiple loan schemes for same amount
    
    Example: SAO vs Rythu Bandhu vs Long Term EMI
    Shows:
    - Total interest
    - Monthly EMI
    - Total payable
    - Best scheme recommendation
    """
    calculator = SmartCalculator(db)
    
    try:
        result = await calculator.compare_loan_schemes(
            principal=request.principal_amount,
            tenure_months=request.tenure_months,
            loan_types=request.loan_types
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/recommendations/smart")
async def get_smart_recommendations(
    request: SmartRecommendationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    ✔ AI-powered smart recommendations using Gemini
    
    Examples:
    - "Farmer will save ₹1,200 if pays on 25th instead of 31st"
    - "Better to convert SAO into Long-Term EMI"
    - "Consider part-payment of ₹10,000"
    """
    calculator = SmartCalculator(db)
    
    try:
        result = await calculator.get_smart_recommendations(
            loan_id=request.loan_id,
            farmer_monthly_income=request.farmer_monthly_income
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ==================== SIMULATION / WHAT-IF ====================

@router.post("/simulate/payment")
async def simulate_payment(
    request: SimulatePaymentRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Simulate effect of payment on loan
    Shows new interest, EMI, maturity date
    
    Supports:
    - Early payment
    - Prepayment (with EMI reduction or tenure reduction)
    """
    calculator = SmartCalculator(db)
    
    try:
        if request.simulation_type == "early_payment":
            result = await calculator.simulate_early_payment(
                loan_id=request.loan_id,
                payment_amount=request.payment_amount,
                payment_date=request.payment_date
            )
        elif request.simulation_type == "prepayment":
            result = await calculator.simulate_prepayment(
                loan_id=request.loan_id,
                prepayment_amount=request.payment_amount,
                prepayment_date=request.payment_date,
                reduce_emi=request.reduce_emi
            )
        else:
            raise HTTPException(
                status_code=400, 
                detail="Invalid simulation_type. Use 'early_payment' or 'prepayment'"
            )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ==================== RATE SWITCHING & PENALTIES ====================

@router.get("/rate/check-switching/{loan_id}")
async def check_rate_switching(
    loan_id: int,
    as_of_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Check if rate switching applies for loan
    Shows current rate, new rate, and switching logic
    """
    calculator = SmartCalculator(db)
    as_of_date = as_of_date or date.today()
    
    try:
        result = await calculator.apply_rate_switching(loan_id, as_of_date)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/penalty/calculate")
async def calculate_penalty(
    request: PenaltyCalculationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Calculate tiered penalty based on overdue buckets
    0-30 days: 2%
    31-90 days: 4%
    >90 days: 6%
    """
    calculator = SmartCalculator(db)
    
    try:
        result = await calculator.calculate_penalty(
            loan_id=request.loan_id,
            overdue_days=request.overdue_days,
            overdue_amount=request.overdue_amount
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ==================== AI ASSISTANCE ====================

@router.post("/ai/explain")
async def ai_explain_calculation(
    request: AIExplanationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Use Gemini AI to explain calculation in simple terms
    Supports multiple languages for farmers
    """
    calculator = SmartCalculator(db)
    
    try:
        explanation = await calculator.explain_with_ai(
            calculation_data=request.calculation_data,
            language=request.language
        )
        return {
            "explanation": explanation,
            "language": request.language,
            "original_data": request.calculation_data
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/ai/suggest-repayment")
async def suggest_repayment_plan(
    request: RepaymentPlanRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Use AI to suggest optimal repayment plan
    Considers farmer's income and loan details
    """
    calculator = SmartCalculator(db)
    
    try:
        suggestion = await calculator.suggest_repayment_plan(
            loan_id=request.loan_id,
            farmer_income=request.farmer_income
        )
        return suggestion
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ==================== COMPREHENSIVE LOAN ANALYSIS ====================

@router.get("/analyze/{loan_id}")
async def comprehensive_loan_analysis(
    loan_id: int,
    include_ai: bool = Query(False, description="Include AI explanations"),
    language: str = Query("english", description="Language for AI explanation"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Complete loan analysis with all calculations
    Used in dashboards for quick overview
    """
    calculator = SmartCalculator(db)
    
    try:
        # Basic calculations
        tomorrow_interest = await calculator.calculate_interest_for_tomorrow(loan_id)
        current_schedule = await calculator.get_emi_schedule_as_of_date(
            loan_id, date.today()
        )
        rate_info = await calculator.apply_rate_switching(loan_id, date.today())
        
        analysis = {
            "loan_id": loan_id,
            "analysis_date": date.today().isoformat(),
            "tomorrow_interest": tomorrow_interest,
            "current_schedule": current_schedule,
            "rate_info": rate_info
        }
        
        # Add AI explanation if requested
        if include_ai:
            ai_explanation = await calculator.explain_with_ai(analysis, language)
            analysis["ai_explanation"] = ai_explanation
        
        return analysis
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ==================== BATCH & ADMIN OPERATIONS ====================

@router.post("/admin/run-daily-accrual")
async def run_daily_accrual(
    accrual_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Manually trigger daily accrual job
    Admin only - posts interest to ledger for all loans
    """
    # Check admin permission
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    accrual_service = DailyAccrualService(db)
    
    try:
        result = await accrual_service.run_daily_accrual(accrual_date)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/admin/batch-calculation")
async def run_batch_calculation(
    calculation_type: str = Query(..., description="outstanding or penalty"),
    as_of_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Run batch calculation across all loans
    Admin only - for reporting and accounting
    """
    # Check admin permission
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    accrual_service = DailyAccrualService(db)
    
    try:
        result = await accrual_service.run_batch_calculation(
            calculation_type=calculation_type,
            as_of_date=as_of_date
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/admin/accrual-history")
async def get_accrual_history(
    days: int = Query(7, gt=0, le=90),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get history of accrual job executions
    Shows processing status and results
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    from app.models.loan_ledger import AccrualJob
    from sqlalchemy import select, desc
    
    try:
        start_date = date.today() - timedelta(days=days)
        
        result = await db.execute(
            select(AccrualJob)
            .where(AccrualJob.job_date >= start_date)
            .order_by(desc(AccrualJob.job_date))
        )
        jobs = result.scalars().all()
        
        return {
            "period_days": days,
            "total_jobs": len(jobs),
            "jobs": [
                {
                    "id": job.id,
                    "job_date": job.job_date.isoformat(),
                    "status": job.status,
                    "loans_processed": job.loans_processed,
                    "total_accrual": float(job.total_accrual_amount) if job.total_accrual_amount else 0,
                    "errors_count": job.errors_count,
                    "duration_seconds": job.duration_seconds,
                    "started_at": job.started_at.isoformat() if job.started_at else None,
                    "completed_at": job.completed_at.isoformat() if job.completed_at else None
                }
                for job in jobs
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
