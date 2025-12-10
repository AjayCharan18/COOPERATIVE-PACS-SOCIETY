"""
Endpoints for loan closure operations
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Dict, Optional

from app.db.session import get_db
from app.models.user import User, UserRole
from app.api.deps import get_current_user
from app.services.loan_closure_service import LoanClosureService

router = APIRouter()


class LoanClosureRequest(BaseModel):
    """Request model for loan closure"""
    closure_amount: float
    payment_mode: str = "cash"
    remarks: Optional[str] = None


@router.get("/calculate/{loan_id}", response_model=Dict)
async def calculate_closure_amount(
    loan_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Calculate the amount required to close a loan
    Employees and admins can calculate for any loan
    Farmers can calculate for their own loans
    """
    from app.models.loan import Loan
    from sqlalchemy import select
    
    # Get loan to check ownership
    result = await db.execute(select(Loan).where(Loan.id == loan_id))
    loan = result.scalar_one_or_none()
    
    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan not found"
        )
    
    # Check authorization
    if current_user.role == UserRole.FARMER and loan.farmer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own loans"
        )
    
    try:
        closure_details = await LoanClosureService.calculate_closure_amount(db, loan_id)
        return closure_details
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/close/{loan_id}")
async def close_loan(
    loan_id: int,
    closure_request: LoanClosureRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Close a loan after receiving full payment
    Employee/Admin only
    """
    if current_user.role not in [UserRole.EMPLOYEE, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employees and admins can close loans"
        )
    
    try:
        closed_loan = await LoanClosureService.close_loan(
            db,
            loan_id,
            closure_request.closure_amount,
            closure_request.payment_mode,
            closure_request.remarks
        )
        
        return {
            "message": "Loan closed successfully",
            "loan_id": closed_loan.id,
            "loan_number": closed_loan.loan_number,
            "status": closed_loan.status,
            "closure_date": closed_loan.updated_at
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/summary")
async def get_closed_loans_summary(
    branch_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get summary of all closed loans
    Employee/Admin only
    """
    if current_user.role not in [UserRole.EMPLOYEE, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employees and admins can view closure summary"
        )
    
    summary = await LoanClosureService.get_closed_loans_summary(db, branch_id)
    return summary
