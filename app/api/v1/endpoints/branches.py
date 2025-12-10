"""
Endpoints for branch management and statistics
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict

from app.db.session import get_db
from app.models.user import User, UserRole
from app.api.deps import get_current_user
from app.services.branch_service import BranchService

router = APIRouter()


@router.get("/")
async def get_branches(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get list of all branches
    """
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    from app.models.user import Branch
    
    result = await db.execute(select(Branch).options(selectinload(Branch.manager)))
    branches = result.scalars().all()
    
    return [
        {
            "id": branch.id,
            "name": branch.name,
            "code": branch.code,
            "address": branch.address,
            "contact_number": branch.contact_number,
            "manager_name": branch.manager.full_name if branch.manager else None
        }
        for branch in branches
    ]


@router.get("/statistics/{branch_id}", response_model=Dict)
async def get_branch_statistics(
    branch_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get comprehensive statistics for a specific branch
    Employee/Admin only
    """
    if current_user.role not in [UserRole.EMPLOYEE, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employees and admins can view branch statistics"
        )
    
    # Employees can only view their own branch
    if current_user.role == UserRole.EMPLOYEE and current_user.branch_id != branch_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Employees can only view their own branch statistics"
        )
    
    stats = await BranchService.get_branch_statistics(db, branch_id)
    return stats


@router.get("/comparison", response_model=List[Dict])
async def get_branches_comparison(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get comparative statistics for all branches
    Admin only
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can view branch comparison"
        )
    
    comparison = await BranchService.get_all_branches_comparison(db)
    return comparison


@router.get("/top-performing", response_model=List[Dict])
async def get_top_performing_branches(
    limit: int = 5,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get top performing branches by disbursement
    Admin only
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can view top performing branches"
        )
    
    top_branches = await BranchService.get_top_performing_branches(db, limit)
    return top_branches


@router.get("/trend/{branch_id}", response_model=List[Dict])
async def get_branch_monthly_trend(
    branch_id: int,
    months: int = 6,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get monthly disbursement trend for a branch
    Employee/Admin only
    """
    if current_user.role not in [UserRole.EMPLOYEE, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employees and admins can view branch trends"
        )
    
    # Employees can only view their own branch
    if current_user.role == UserRole.EMPLOYEE and current_user.branch_id != branch_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Employees can only view their own branch trends"
        )
    
    trend = await BranchService.get_branch_monthly_trend(db, branch_id, months)
    return trend
