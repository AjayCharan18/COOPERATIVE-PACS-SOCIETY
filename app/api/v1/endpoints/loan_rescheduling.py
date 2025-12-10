"""
Endpoints for loan rescheduling
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Dict, Optional
from datetime import date

from app.db.session import get_db
from app.models.user import User, UserRole
from app.api.deps import get_current_user
from app.services.loan_rescheduling_service import LoanReschedulingService

router = APIRouter()


class LoanReschedulingRequest(BaseModel):
    """Request model for loan rescheduling"""
    new_tenure_months: Optional[int] = None
    new_interest_rate: Optional[float] = None
    restructure_date: Optional[date] = None
    reason: Optional[str] = None


@router.get("/options/{loan_id}", response_model=Dict)
async def get_rescheduling_options(
    loan_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get available rescheduling options for a loan
    Employee/Admin only
    """
    if current_user.role not in [UserRole.EMPLOYEE, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employees and admins can view rescheduling options"
        )
    
    try:
        options = await LoanReschedulingService.get_rescheduling_options(db, loan_id)
        return options
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/reschedule/{loan_id}")
async def reschedule_loan(
    loan_id: int,
    reschedule_request: LoanReschedulingRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Reschedule a loan with new terms
    Admin only
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can reschedule loans"
        )
    
    if not reschedule_request.new_tenure_months and not reschedule_request.new_interest_rate:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one of new_tenure_months or new_interest_rate must be provided"
        )
    
    try:
        rescheduled_loan = await LoanReschedulingService.reschedule_loan(
            db,
            loan_id,
            reschedule_request.new_tenure_months,
            reschedule_request.new_interest_rate,
            reschedule_request.restructure_date,
            reschedule_request.reason
        )
        
        return {
            "message": "Loan rescheduled successfully",
            "loan_id": rescheduled_loan.id,
            "loan_number": rescheduled_loan.loan_number,
            "new_emi_amount": rescheduled_loan.emi_amount,
            "new_tenure_months": rescheduled_loan.tenure_months,
            "new_total_payable": rescheduled_loan.total_amount_payable,
            "status": rescheduled_loan.status
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/list")
async def get_rescheduled_loans(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get list of all rescheduled loans
    Employee/Admin only
    """
    if current_user.role not in [UserRole.EMPLOYEE, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employees and admins can view rescheduled loans"
        )
    
    loans = await LoanReschedulingService.get_rescheduled_loans(db)
    
    return {
        "total_rescheduled_loans": len(loans),
        "loans": [
            {
                "id": loan.id,
                "loan_number": loan.loan_number,
                "farmer_id": loan.farmer_id,
                "principal_amount": loan.principal_amount,
                "outstanding_principal": loan.outstanding_principal,
                "tenure_months": loan.tenure_months,
                "interest_rate": loan.interest_rate,
                "emi_amount": loan.emi_amount,
                "status": loan.status
            }
            for loan in loans
        ]
    }
