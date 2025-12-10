"""
Loan management API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload
from typing import Optional, List
from datetime import datetime

from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.loan import Loan, LoanStatus, LoanType, LoanTypeConfig
from app.schemas.loan import (
    LoanCreate,
    Loan as LoanSchema,
    LoanUpdate,
    LoanApproval,
    LoanReschedule,
    LoanDetail,
    LoanSummary,
    LoanWithSchedule,
)
from app.api.deps import get_current_user, require_admin_or_employee, require_admin
from app.services.loan_service import LoanService
from app.services.ml_service import MLService
from pydantic import BaseModel, Field

router = APIRouter()


class LoanTypeConfigResponse(BaseModel):
    id: int
    loan_type: str
    display_name: str
    description: Optional[str]
    default_interest_rate: float
    base_interest_rate: float  # For Year 1
    interest_rate_after_year: float  # After 1 Year
    name: str  # Alias for display_name
    max_tenure_months: int  # Alias for default_tenure_months
    default_tenure_months: int
    min_amount: float
    max_amount: Optional[float]
    interest_calculation_type: str
    penal_interest_rate: float
    overdue_days_for_penalty: int
    requires_emi: bool
    emi_frequency: str
    min_land_area: Optional[float]
    eligible_crops: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True


@router.get("/loan-types", response_model=List[LoanTypeConfigResponse])
async def get_loan_types(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    """
    Get all active loan type configurations
    Available to all authenticated users (admin, employee, farmer)
    """
    query = select(LoanTypeConfig).where(LoanTypeConfig.is_active == True)
    result = await db.execute(query)
    loan_types = result.scalars().all()

    # Add calculated fields for each loan type
    response_data = []
    for lt in loan_types:
        # Calculate rate after 1 year based on loan type
        base_rate = float(lt.default_interest_rate)
        loan_type_value = (
            lt.loan_type.value if hasattr(lt.loan_type, "value") else str(lt.loan_type)
        )

        if loan_type_value == "sao":
            rate_after = 13.75
        elif loan_type_value in ["rythu_bandhu", "rythu_nethany"]:
            rate_after = 14.5
        elif loan_type_value == "long_term_emi":
            rate_after = 12.75
        elif loan_type_value == "amul_loan":
            rate_after = 14.0
        else:
            rate_after = base_rate + 2.0

        response_data.append(
            {
                "id": lt.id,
                "loan_type": loan_type_value,
                "display_name": lt.display_name,
                "name": lt.display_name,
                "description": lt.description,
                "default_interest_rate": base_rate,
                "base_interest_rate": base_rate,
                "interest_rate_after_year": rate_after,
                "default_tenure_months": lt.default_tenure_months,
                "max_tenure_months": lt.default_tenure_months,
                "min_amount": float(lt.min_amount),
                "max_amount": float(lt.max_amount) if lt.max_amount else None,
                "interest_calculation_type": (
                    lt.interest_calculation_type.value
                    if hasattr(lt.interest_calculation_type, "value")
                    else str(lt.interest_calculation_type)
                ),
                "penal_interest_rate": float(lt.penal_interest_rate),
                "overdue_days_for_penalty": lt.overdue_days_for_penalty,
                "requires_emi": lt.requires_emi,
                "emi_frequency": lt.emi_frequency,
                "min_land_area": float(lt.min_land_area) if lt.min_land_area else None,
                "eligible_crops": lt.eligible_crops,
                "is_active": lt.is_active,
            }
        )

    return response_data


@router.post("/", response_model=LoanSchema, status_code=status.HTTP_201_CREATED)
async def create_loan(
    loan_data: LoanCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new loan application
    Farmers can create for themselves, employees/admin can create for any farmer
    """
    # Check authorization
    if current_user.role == UserRole.FARMER:
        if loan_data.farmer_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Farmers can only create loans for themselves",
            )

    # Create loan
    loan = await LoanService.create_loan(db, loan_data, current_user)

    return loan


@router.get("/", response_model=List[LoanDetail])
async def get_loans(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[LoanStatus] = None,
    loan_type: Optional[LoanType] = None,
    farmer_id: Optional[int] = None,
    branch_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get list of loans with filters
    Farmers see only their loans, employees see branch loans, admin sees all
    """
    query = select(Loan).options(selectinload(Loan.farmer), selectinload(Loan.branch))

    # Apply role-based filtering
    if current_user.role == UserRole.FARMER:
        query = query.where(Loan.farmer_id == current_user.id)
    elif current_user.role == UserRole.EMPLOYEE:
        query = query.where(Loan.branch_id == current_user.branch_id)

    # Apply filters
    if status:
        query = query.where(Loan.status == status)
    if loan_type:
        query = query.where(Loan.loan_type == loan_type)
    if farmer_id and current_user.role != UserRole.FARMER:
        query = query.where(Loan.farmer_id == farmer_id)
    if branch_id and current_user.role == UserRole.ADMIN:
        query = query.where(Loan.branch_id == branch_id)

    # Pagination
    query = query.offset(skip).limit(limit).order_by(Loan.created_at.desc())

    result = await db.execute(query)
    loans = result.scalars().all()

    # Convert to LoanDetail with farmer and branch names
    loan_details = []
    for loan in loans:
        loan_detail = LoanDetail(
            **loan.__dict__,
            farmer_name=loan.farmer.full_name if loan.farmer else None,
            branch_name=loan.branch.name if loan.branch else None
        )
        loan_details.append(loan_detail)

    return loan_details


@router.get("/search/{loan_number}", response_model=LoanDetail)
async def search_loan_by_number(
    loan_number: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Search loan by loan number"""

    result = await db.execute(
        select(Loan)
        .options(selectinload(Loan.farmer), selectinload(Loan.branch))
        .where(Loan.loan_number == loan_number)
    )
    loan = result.scalar_one_or_none()

    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Loan not found"
        )

    # Check authorization
    if current_user.role == UserRole.FARMER and loan.farmer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this loan",
        )

    loan_detail = LoanDetail(
        **loan.__dict__,
        farmer_name=loan.farmer.full_name if loan.farmer else None,
        branch_name=loan.branch.name if loan.branch else None
    )

    return loan_detail


@router.get("/{loan_id}", response_model=LoanDetail)
async def get_loan(
    loan_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get loan details with EMI schedule"""

    result = await db.execute(
        select(Loan)
        .options(
            selectinload(Loan.emi_schedule),
            selectinload(Loan.farmer),
            selectinload(Loan.branch),
        )
        .where(Loan.id == loan_id)
    )
    loan = result.scalar_one_or_none()

    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Loan not found"
        )

    # Authorization check
    if current_user.role == UserRole.FARMER and loan.farmer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )

    loan_detail = LoanDetail(
        **loan.__dict__,
        farmer_name=loan.farmer.full_name if loan.farmer else None,
        branch_name=loan.branch.name if loan.branch else None
    )

    return loan_detail


@router.put("/{loan_id}", response_model=LoanSchema)
async def update_loan(
    loan_id: int,
    loan_update: LoanUpdate,
    current_user: User = Depends(require_admin_or_employee),
    db: AsyncSession = Depends(get_db),
):
    """Update loan details (employee/admin only)"""

    result = await db.execute(select(Loan).where(Loan.id == loan_id))
    loan = result.scalar_one_or_none()

    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Loan not found"
        )

    # Update fields
    update_data = loan_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(loan, field, value)

    await db.commit()
    await db.refresh(loan)

    return loan


@router.get("/{loan_id}/emi-schedule")
async def get_loan_emi_schedule(
    loan_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get EMI schedule for a loan"""
    from app.models.loan import EMISchedule

    result = await db.execute(select(Loan).where(Loan.id == loan_id))
    loan = result.scalar_one_or_none()

    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")

    # Get EMI schedules
    result = await db.execute(
        select(EMISchedule)
        .where(EMISchedule.loan_id == loan_id)
        .order_by(EMISchedule.installment_number)
    )
    schedules = result.scalars().all()

    return [
        {
            "installment_number": sch.installment_number,
            "due_date": sch.due_date.isoformat() if sch.due_date else None,
            "principal_amount": float(sch.principal_amount),
            "interest_amount": float(sch.interest_amount),
            "total_amount": float(sch.total_amount),
            "paid_amount": float(sch.paid_amount or 0),
            "balance_amount": float(sch.balance_amount or 0),
            "status": sch.status.value if sch.status else "pending",
            "payment_date": sch.payment_date.isoformat() if sch.payment_date else None,
        }
        for sch in schedules
    ]


@router.post("/{loan_id}/approve")
async def approve_specific_loan(
    loan_id: int,
    approval_data: dict,
    current_user: User = Depends(require_admin_or_employee),
    db: AsyncSession = Depends(get_db),
):
    """Approve a specific loan by ID"""
    result = await db.execute(select(Loan).where(Loan.id == loan_id))
    loan = result.scalar_one_or_none()

    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")

    loan.status = LoanStatus.ACTIVE
    loan.approved_by_id = current_user.id

    await db.commit()
    await db.refresh(loan)

    return {"message": "Loan approved successfully", "loan": loan}


@router.post("/{loan_id}/reject")
async def reject_specific_loan(
    loan_id: int,
    rejection_data: dict,
    current_user: User = Depends(require_admin_or_employee),
    db: AsyncSession = Depends(get_db),
):
    """Reject a specific loan by ID"""
    result = await db.execute(select(Loan).where(Loan.id == loan_id))
    loan = result.scalar_one_or_none()

    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")

    loan.status = LoanStatus.REJECTED
    loan.approved_by_id = current_user.id

    await db.commit()
    await db.refresh(loan)

    return {"message": "Loan rejected", "loan": loan}


@router.post("/{loan_id}/disburse")
async def disburse_loan(
    loan_id: int,
    current_user: User = Depends(require_admin_or_employee),
    db: AsyncSession = Depends(get_db),
):
    """Disburse an approved loan"""
    result = await db.execute(select(Loan).where(Loan.id == loan_id))
    loan = result.scalar_one_or_none()

    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")

    if loan.status != LoanStatus.ACTIVE:
        raise HTTPException(
            status_code=400, detail="Only approved loans can be disbursed"
        )

    if loan.disbursement_date:
        raise HTTPException(status_code=400, detail="Loan already disbursed")

    from datetime import date

    loan.disbursement_date = date.today()

    await db.commit()
    await db.refresh(loan)

    return {"message": "Loan disbursed successfully", "loan": loan}


@router.post("/approve", response_model=LoanSchema)
async def approve_loan(
    approval_data: LoanApproval,
    current_user: User = Depends(require_admin_or_employee),
    db: AsyncSession = Depends(get_db),
):
    """Approve or reject loan application"""

    loan = await LoanService.approve_loan(db, approval_data, current_user)
    return loan


@router.post("/reschedule", response_model=LoanSchema)
async def reschedule_loan(
    reschedule_data: LoanReschedule,
    current_user: User = Depends(require_admin_or_employee),
    db: AsyncSession = Depends(get_db),
):
    """Reschedule an existing loan"""

    loan = await LoanService.reschedule_loan(db, reschedule_data, current_user)
    return loan


@router.get("/summary/statistics", response_model=LoanSummary)
async def get_loan_summary(
    branch_id: Optional[int] = None,
    farmer_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get loan summary statistics"""

    filters = {}

    if current_user.role == UserRole.FARMER:
        filters["farmer_id"] = current_user.id
    elif current_user.role == UserRole.EMPLOYEE:
        filters["branch_id"] = current_user.branch_id
    elif branch_id:
        filters["branch_id"] = branch_id

    if farmer_id and current_user.role != UserRole.FARMER:
        filters["farmer_id"] = farmer_id

    summary = await LoanService.get_loan_summary(db, filters)
    return summary


@router.get("/{loan_id}/risk-assessment")
async def get_risk_assessment(
    loan_id: int,
    current_user: User = Depends(require_admin_or_employee),
    db: AsyncSession = Depends(get_db),
):
    """Get ML-based risk assessment for a loan"""

    result = await db.execute(
        select(Loan).options(selectinload(Loan.farmer)).where(Loan.id == loan_id)
    )
    loan = result.scalar_one_or_none()

    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Loan not found"
        )

    # Get risk prediction
    risk_data = await MLService.predict_default_risk(
        db, loan.farmer, loan.principal_amount, loan.tenure_months, loan.loan_type.value
    )

    return risk_data


# Loan Type Config endpoints
@router.get("/config/types", response_model=List[dict])
async def get_loan_types(db: AsyncSession = Depends(get_db)):
    """Get all active loan type configurations"""

    result = await db.execute(
        select(LoanTypeConfig).where(LoanTypeConfig.is_active == True)
    )
    configs = result.scalars().all()

    return [
        {
            "loan_type": config.loan_type.value,
            "display_name": config.display_name,
            "description": config.description,
            "default_interest_rate": config.default_interest_rate,
            "default_tenure_months": config.default_tenure_months,
            "min_amount": config.min_amount,
            "max_amount": config.max_amount,
        }
        for config in configs
    ]
