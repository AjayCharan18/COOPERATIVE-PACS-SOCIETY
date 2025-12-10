"""
Reports and export API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from datetime import date, datetime
from typing import Optional, List
import csv
import io

from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.loan import Loan, LoanStatus, LoanType
from app.api.deps import get_current_user, require_admin_or_employee

router = APIRouter()


@router.get("/loans/export")
async def export_loans_csv(
    status_filter: Optional[LoanStatus] = None,
    loan_type_filter: Optional[LoanType] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    current_user: User = Depends(require_admin_or_employee),
    db: AsyncSession = Depends(get_db),
):
    """
    Export loans data to CSV
    """

    # Build query
    query = select(Loan).options(selectinload(Loan.farmer), selectinload(Loan.branch))

    # Apply role-based filtering
    filters = []
    if current_user.role == UserRole.EMPLOYEE:
        filters.append(Loan.branch_id == current_user.branch_id)

    # Apply optional filters
    if status_filter:
        filters.append(Loan.status == status_filter)
    if loan_type_filter:
        filters.append(Loan.loan_type == loan_type_filter)
    if from_date:
        filters.append(
            Loan.created_at >= datetime.combine(from_date, datetime.min.time())
        )
    if to_date:
        filters.append(
            Loan.created_at <= datetime.combine(to_date, datetime.max.time())
        )

    if filters:
        query = query.where(and_(*filters))

    query = query.order_by(Loan.created_at.desc())

    result = await db.execute(query)
    loans = result.scalars().all()

    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)

    # Write header
    writer.writerow(
        [
            "Loan Number",
            "Farmer Name",
            "Branch Name",
            "Loan Type",
            "Principal Amount",
            "Interest Rate",
            "Tenure (Months)",
            "EMI Amount",
            "Total Payable",
            "Total Outstanding",
            "Status",
            "Sanction Date",
            "Disbursement Date",
            "Created At",
        ]
    )

    # Write data
    for loan in loans:
        writer.writerow(
            [
                loan.loan_number,
                loan.farmer.full_name if loan.farmer else "",
                loan.branch.name if loan.branch else "",
                loan.loan_type.value,
                f"{loan.principal_amount:.2f}",
                f"{loan.interest_rate:.2f}",
                loan.tenure_months,
                f"{loan.emi_amount:.2f}" if loan.emi_amount else "",
                f"{loan.total_amount_payable:.2f}",
                f"{loan.total_outstanding:.2f}",
                loan.status.value,
                loan.sanction_date.isoformat() if loan.sanction_date else "",
                loan.disbursement_date.isoformat() if loan.disbursement_date else "",
                loan.created_at.isoformat(),
            ]
        )

    # Return CSV file
    csv_content = output.getvalue()
    output.close()

    filename = f"loans_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/emi-schedule/export/{loan_id}")
async def export_emi_schedule_csv(
    loan_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Export EMI schedule for a specific loan to CSV
    """

    # Get loan with EMI schedule
    result = await db.execute(
        select(Loan)
        .options(selectinload(Loan.emi_schedule), selectinload(Loan.farmer))
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

    if not loan.emi_schedule:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No EMI schedule available for this loan",
        )

    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)

    # Write header
    writer.writerow(
        [
            "Loan Number",
            "Farmer Name",
            "Installment Number",
            "Due Date",
            "EMI Amount",
            "Principal Component",
            "Interest Component",
            "Outstanding Principal",
            "Is Paid",
            "Paid Date",
            "Paid Amount",
            "Is Overdue",
            "Overdue Days",
        ]
    )

    # Write EMI schedule data
    for emi in sorted(loan.emi_schedule, key=lambda x: x.installment_number):
        writer.writerow(
            [
                loan.loan_number,
                loan.farmer.full_name if loan.farmer else "",
                emi.installment_number,
                emi.due_date.isoformat(),
                f"{emi.emi_amount:.2f}",
                f"{emi.principal_component:.2f}",
                f"{emi.interest_component:.2f}",
                f"{emi.outstanding_principal:.2f}",
                "Yes" if emi.is_paid else "No",
                emi.paid_date.isoformat() if emi.paid_date else "",
                f"{emi.paid_amount:.2f}" if emi.paid_amount else "",
                "Yes" if emi.is_overdue else "No",
                emi.overdue_days or 0,
            ]
        )

    # Return CSV file
    csv_content = output.getvalue()
    output.close()

    filename = (
        f"emi_schedule_{loan.loan_number}_{datetime.now().strftime('%Y%m%d')}.csv"
    )

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/summary")
async def get_loan_summary_report(
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    current_user: User = Depends(require_admin_or_employee),
    db: AsyncSession = Depends(get_db),
):
    """
    Get comprehensive loan summary report
    """

    # Base filter
    filters = []
    if current_user.role == UserRole.EMPLOYEE:
        filters.append(Loan.branch_id == current_user.branch_id)

    if from_date:
        filters.append(
            Loan.created_at >= datetime.combine(from_date, datetime.min.time())
        )
    if to_date:
        filters.append(
            Loan.created_at <= datetime.combine(to_date, datetime.max.time())
        )

    # Build query
    query = select(Loan)
    if filters:
        query = query.where(and_(*filters))

    result = await db.execute(query)
    loans = result.scalars().all()

    # Calculate summary statistics
    total_loans = len(loans)
    total_principal = sum(loan.principal_amount for loan in loans)
    total_disbursed = sum(
        loan.principal_amount for loan in loans if loan.disbursement_date
    )
    total_outstanding = sum(
        loan.total_outstanding for loan in loans if loan.status == LoanStatus.ACTIVE
    )

    # Group by status
    status_breakdown = {}
    for loan in loans:
        status = loan.status.value
        if status not in status_breakdown:
            status_breakdown[status] = {"count": 0, "amount": 0}
        status_breakdown[status]["count"] += 1
        status_breakdown[status]["amount"] += loan.principal_amount

    # Group by loan type
    type_breakdown = {}
    for loan in loans:
        loan_type = loan.loan_type.value
        if loan_type not in type_breakdown:
            type_breakdown[loan_type] = {"count": 0, "amount": 0}
        type_breakdown[loan_type]["count"] += 1
        type_breakdown[loan_type]["amount"] += loan.principal_amount

    return {
        "report_period": {
            "from_date": from_date.isoformat() if from_date else None,
            "to_date": to_date.isoformat() if to_date else None,
            "generated_at": datetime.now().isoformat(),
        },
        "summary": {
            "total_loans": total_loans,
            "total_principal_amount": round(total_principal, 2),
            "total_disbursed_amount": round(total_disbursed, 2),
            "total_outstanding_amount": round(total_outstanding, 2),
        },
        "breakdown_by_status": status_breakdown,
        "breakdown_by_type": type_breakdown,
    }


@router.get("/monthly")
async def get_monthly_report(
    year: Optional[int] = None,
    month: Optional[int] = None,
    current_user: User = Depends(require_admin_or_employee),
    db: AsyncSession = Depends(get_db),
):
    """
    Get monthly performance report
    If year/month not provided, uses current month
    """
    try:
        from calendar import monthrange
        import sys

        # Use current year/month if not provided
        if not year or not month:
            today = date.today()
            year = year or today.year
            month = month or today.month

        # Validate month
        if month < 1 or month > 12:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Month must be between 1 and 12",
            )

        # Calculate date range for the month
        first_day = date(year, month, 1)
        last_day = date(year, month, monthrange(year, month)[1])

        print(
            f"DEBUG: Generating report for {first_day} to {last_day}", file=sys.stderr
        )
        sys.stderr.flush()

        # Base filter
        filters = [
            Loan.created_at >= datetime.combine(first_day, datetime.min.time()),
            Loan.created_at <= datetime.combine(last_day, datetime.max.time()),
        ]

        if current_user.role == UserRole.EMPLOYEE:
            filters.append(Loan.branch_id == current_user.branch_id)

        # Get loans for the month
        query = select(Loan).where(and_(*filters))
        result = await db.execute(query)
        loans = result.scalars().all()

        print(f"DEBUG: Found {len(loans)} loans", file=sys.stderr)
        sys.stderr.flush()

        # Calculate statistics
        total_loans_created = len(loans)
        total_amount_sanctioned = sum(float(loan.principal_amount) for loan in loans)

        loans_by_status = {}
        for loan in loans:
            status_val = loan.status.value
            loans_by_status[status_val] = loans_by_status.get(status_val, 0) + 1

        # Get disbursed loans in the month
        disbursement_filters = [
            Loan.disbursement_date >= first_day,
            Loan.disbursement_date <= last_day,
        ]
        if current_user.role == UserRole.EMPLOYEE:
            disbursement_filters.append(Loan.branch_id == current_user.branch_id)

        disbursed_query = select(Loan).where(and_(*disbursement_filters))
        disbursed_result = await db.execute(disbursed_query)
        disbursed_loans = disbursed_result.scalars().all()

        total_disbursed = len(disbursed_loans)
        total_disbursed_amount = sum(
            float(loan.principal_amount) for loan in disbursed_loans
        )

        print(f"DEBUG: {total_disbursed} disbursed loans", file=sys.stderr)
        sys.stderr.flush()

        # Get payments for the month
        from app.models.payment import Payment, PaymentStatus

        payment_query = select(Payment).where(
            Payment.payment_date >= first_day,
            Payment.payment_date <= last_day,
            Payment.status == PaymentStatus.SUCCESS,
        )

        payment_result = await db.execute(payment_query)
        all_payments = payment_result.scalars().all()

        # Filter by branch if employee
        if current_user.role == UserRole.EMPLOYEE:
            branch_loan_result = await db.execute(
                select(Loan.id).where(Loan.branch_id == current_user.branch_id)
            )
            branch_loan_ids = {lid for (lid,) in branch_loan_result.all()}
            payments = [p for p in all_payments if p.loan_id in branch_loan_ids]
        else:
            payments = all_payments

        total_payments = len(payments)
        total_payment_amount = sum(float(payment.amount) for payment in payments)

        print(f"DEBUG: {total_payments} payments", file=sys.stderr)
        sys.stderr.flush()

        # Calculate collection efficiency
        from app.models.loan import EMISchedule

        emi_query = select(EMISchedule).where(
            EMISchedule.due_date >= first_day, EMISchedule.due_date <= last_day
        )

        emi_result = await db.execute(emi_query)
        all_emis = emi_result.scalars().all()

        # Filter by branch if employee
        if current_user.role == UserRole.EMPLOYEE:
            emis_due = [emi for emi in all_emis if emi.loan_id in branch_loan_ids]
        else:
            emis_due = all_emis

        print(f"DEBUG: {len(emis_due)} EMIs due", file=sys.stderr)
        sys.stderr.flush()

        total_emis_due = len(emis_due)
        total_amount_due = sum(float(emi.emi_amount) for emi in emis_due)
        emis_paid = sum(1 for emi in emis_due if emi.is_paid)
        amount_collected = sum(
            float(emi.paid_amount or 0) for emi in emis_due if emi.is_paid
        )

        collection_rate = (
            (emis_paid / total_emis_due * 100) if total_emis_due > 0 else 0
        )
        collection_efficiency = (
            (amount_collected / total_amount_due * 100) if total_amount_due > 0 else 0
        )

        print(f"DEBUG: Returning report data", file=sys.stderr)
        sys.stderr.flush()

        return {
            "report_period": {
                "month": month,
                "year": year,
                "month_name": date(year, month, 1).strftime("%B %Y"),
                "generated_at": datetime.now().isoformat(),
            },
            "loan_statistics": {
                "loans_created": total_loans_created,
                "amount_sanctioned": round(total_amount_sanctioned, 2),
                "loans_disbursed": total_disbursed,
                "amount_disbursed": round(total_disbursed_amount, 2),
                "loans_by_status": loans_by_status,
            },
            "collection_statistics": {
                "emis_due": total_emis_due,
                "amount_due": round(total_amount_due, 2),
                "emis_paid": emis_paid,
                "amount_collected": round(amount_collected, 2),
                "collection_rate_percentage": round(collection_rate, 2),
                "collection_efficiency_percentage": round(collection_efficiency, 2),
            },
            "payment_statistics": {
                "total_payments": total_payments,
                "total_amount": round(total_payment_amount, 2),
            },
        }

    except Exception as e:
        import traceback
        import sys

        error_msg = traceback.format_exc()
        print("\n" + "=" * 80, file=sys.stderr)
        print("ERROR in get_monthly_report:", file=sys.stderr)
        print(error_msg, file=sys.stderr)
        print("=" * 80 + "\n", file=sys.stderr)
        sys.stderr.flush()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating monthly report: {str(e)}",
        )
