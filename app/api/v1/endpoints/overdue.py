"""
Endpoints for overdue EMI tracking and management
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict
import pandas as pd
import io

from app.db.session import get_db
from app.models.user import User, UserRole
from app.api.deps import get_current_user
from app.services.overdue_service import OverdueService

router = APIRouter()


@router.post("/check-overdue", response_model=Dict)
async def check_overdue_emis(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    """
    Check and update overdue EMIs for all active loans
    Employee/Admin only
    """
    if current_user.role not in [UserRole.EMPLOYEE, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employees and admins can check overdue EMIs",
        )

    summary = await OverdueService.check_and_update_overdue_emis(db)
    return {"message": "Overdue EMI check completed", "summary": summary}


@router.get("/summary", response_model=Dict)
async def get_overdue_summary(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    """
    Get summary of all overdue loans
    Employee/Admin only
    """
    if current_user.role not in [UserRole.EMPLOYEE, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employees and admins can view overdue summary",
        )

    summary = await OverdueService.get_overdue_loans_summary(db)
    return summary


@router.get("/loan/{loan_id}")
async def get_loan_overdue_emis(
    loan_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get overdue EMIs for a specific loan
    Farmers can view their own loans, employees/admins can view all
    """
    from app.models.loan import Loan
    from sqlalchemy import select

    # Get loan
    result = await db.execute(select(Loan).where(Loan.id == loan_id))
    loan = result.scalar_one_or_none()

    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Loan not found"
        )

    # Check authorization
    if current_user.role == UserRole.FARMER and loan.farmer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own loans",
        )

    overdue_emis = await OverdueService.get_overdue_emis_for_loan(db, loan_id)

    return {
        "loan_id": loan_id,
        "loan_number": loan.loan_number,
        "overdue_count": len(overdue_emis),
        "overdue_emis": [
            {
                "installment_number": emi.installment_number,
                "due_date": emi.due_date,
                "emi_amount": emi.emi_amount,
                "paid_amount": emi.paid_amount,
                "outstanding": emi.emi_amount - emi.paid_amount,
                "overdue_days": emi.overdue_days,
                "penal_interest": emi.penal_interest,
            }
            for emi in overdue_emis
        ],
    }


@router.post("/mark-defaulted/{loan_id}")
async def mark_loan_defaulted(
    loan_id: int,
    days_threshold: int = 90,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Mark a loan as defaulted if overdue exceeds threshold
    Admin only
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can mark loans as defaulted",
        )

    marked = await OverdueService.mark_loan_as_defaulted(db, loan_id, days_threshold)

    if not marked:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Loan not found or does not meet criteria for default",
        )

    return {"message": "Loan marked as defaulted", "loan_id": loan_id}


@router.post("/import-excel")
async def import_overdue_excel(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Import overdue loan data from Excel file
    Employee/Admin only
    Expected columns: Loan Number, Farmer Name, Overdue Amount, Days Overdue, etc.
    """
    if current_user.role not in [UserRole.EMPLOYEE, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employees and admins can import overdue data",
        )

    # Validate file type
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only Excel files (.xlsx, .xls) are supported",
        )

    try:
        # Read Excel file
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))

        # Process the data
        imported_count = 0
        errors = []

        from app.models.loan import Loan
        from sqlalchemy import select, update

        for index, row in df.iterrows():
            try:
                # Map Excel columns - adjust based on your Excel structure
                loan_number = str(
                    row.get(
                        "Loan Number", row.get("LOAN NO", row.get("Loan_Number", ""))
                    )
                )

                if not loan_number:
                    errors.append(f"Row {index + 2}: Missing loan number")
                    continue

                # Find loan by loan number
                result = await db.execute(
                    select(Loan).where(Loan.loan_number == loan_number)
                )
                loan = result.scalar_one_or_none()

                if not loan:
                    errors.append(f"Row {index + 2}: Loan {loan_number} not found")
                    continue

                # Update loan status if overdue
                overdue_days = int(row.get("Days Overdue", row.get("OVERDUE DAYS", 0)))
                if overdue_days > 0:
                    await db.execute(
                        update(Loan).where(Loan.id == loan.id).values(status="overdue")
                    )
                    imported_count += 1

            except Exception as e:
                errors.append(f"Row {index + 2}: {str(e)}")
                continue

        await db.commit()

        return {
            "message": f"Successfully imported {imported_count} overdue records",
            "imported_count": imported_count,
            "total_rows": len(df),
            "errors": errors[:10] if errors else [],  # Return first 10 errors
        }

    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process Excel file: {str(e)}",
        )
