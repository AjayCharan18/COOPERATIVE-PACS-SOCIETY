"""
Dashboard and analytics API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, case, or_
from datetime import date, datetime, timedelta
from typing import Dict, Any, List
from decimal import Decimal

from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.loan import Loan, LoanStatus, LoanType
from app.models.payment import Payment, PaymentStatus
from app.api.deps import get_current_user, require_admin_or_employee, require_admin

router = APIRouter()


@router.get("/stats")
async def get_dashboard_stats(
    current_user: User = Depends(require_admin_or_employee),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Alias for /stats/overview - Get dashboard overview statistics
    """
    return await get_dashboard_overview(current_user, db)


@router.get("/stats/overview")
async def get_dashboard_overview(
    current_user: User = Depends(require_admin_or_employee),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get dashboard overview statistics
    Employee sees branch stats, Admin sees all
    """

    # Base query filter
    base_filter = []
    if current_user.role == UserRole.EMPLOYEE:
        base_filter.append(Loan.branch_id == current_user.branch_id)

    # Total loans count by status
    status_query = select(Loan.status, func.count(Loan.id).label("count")).group_by(
        Loan.status
    )

    if base_filter:
        status_query = status_query.where(and_(*base_filter))

    result = await db.execute(status_query)
    status_counts = {row.status.value: row.count for row in result.all()}

    # Pending approvals
    pending_approvals = status_counts.get("pending_approval", 0)

    # Total farmers in branch/system
    from app.models.user import User as UserModel

    farmers_query = select(func.count(UserModel.id)).where(
        UserModel.role == UserRole.FARMER
    )
    if current_user.role == UserRole.EMPLOYEE:
        farmers_query = farmers_query.where(
            UserModel.branch_id == current_user.branch_id
        )
    result = await db.execute(farmers_query)
    total_farmers = result.scalar() or 0

    # Total disbursed amount (this month)
    from datetime import date

    first_day_of_month = date.today().replace(day=1)
    disbursed_query = select(
        func.sum(Loan.principal_amount).label("total_disbursed"),
        func.count(Loan.id).label("count"),
    ).where(
        and_(
            Loan.disbursement_date >= first_day_of_month,
            Loan.disbursement_date.isnot(None),
        )
    )

    if base_filter:
        disbursed_query = disbursed_query.where(and_(*base_filter))

    result = await db.execute(disbursed_query)
    disbursed_data = result.one()

    # Overdue loans count
    overdue_query = select(func.count(Loan.id)).where(
        and_(Loan.status == LoanStatus.ACTIVE, Loan.total_outstanding > 0)
    )

    if base_filter:
        overdue_query = overdue_query.where(and_(*base_filter))

    result = await db.execute(overdue_query)
    overdue_loans = result.scalar() or 0

    # Outstanding amount
    outstanding_query = select(
        func.sum(Loan.total_outstanding).label("total_outstanding")
    ).where(Loan.status == LoanStatus.ACTIVE)

    if base_filter:
        outstanding_query = outstanding_query.where(and_(*base_filter))

    result = await db.execute(outstanding_query)
    outstanding_amount = result.scalar() or 0

    # Loans by type
    type_query = select(
        Loan.loan_type,
        func.count(Loan.id).label("count"),
        func.sum(Loan.principal_amount).label("total_amount"),
    ).group_by(Loan.loan_type)

    if base_filter:
        type_query = type_query.where(and_(*base_filter))

    result = await db.execute(type_query)
    loans_by_type = [
        {
            "loan_type": row.loan_type.value,
            "count": row.count,
            "total_amount": float(row.total_amount or 0),
        }
        for row in result.all()
    ]

    # Recent loans (last 30 days)
    thirty_days_ago = date.today() - timedelta(days=30)
    recent_query = select(func.count(Loan.id)).where(Loan.created_at >= thirty_days_ago)

    if base_filter:
        recent_query = recent_query.where(and_(*base_filter))

    result = await db.execute(recent_query)
    recent_loans_count = result.scalar() or 0

    # Active loans count (ACTIVE or APPROVED with disbursement date and outstanding balance > 0)
    active_query = select(func.count(Loan.id)).where(
        and_(
            or_(Loan.status == LoanStatus.ACTIVE, Loan.status == LoanStatus.APPROVED),
            Loan.disbursement_date.isnot(None),
            Loan.total_outstanding > 0,
        )
    )

    if base_filter:
        active_query = active_query.where(and_(*base_filter))

    result = await db.execute(active_query)
    active_loans_count = result.scalar() or 0

    # Total branches count (for admin)
    total_branches = 0
    total_users = 0
    if current_user.role == UserRole.ADMIN:
        from app.models.branch import Branch

        branches_query = select(func.count(Branch.id))
        result = await db.execute(branches_query)
        total_branches = result.scalar() or 0

        # Total users count
        users_query = select(func.count(UserModel.id))
        result = await db.execute(users_query)
        total_users = result.scalar() or 0

    return {
        "pendingApprovals": pending_approvals,
        "totalLoans": sum(status_counts.values()),
        "activeLoans": active_loans_count,
        "totalFarmers": total_farmers,
        "totalUsers": total_users,
        "totalDisbursed": float(disbursed_data.total_disbursed or 0),
        "overdueLoans": overdue_loans,
        "collectionRate": 0,  # Can be calculated later
        "monthlyDisbursement": float(disbursed_data.total_disbursed or 0),
        "totalBranches": total_branches,
        "status_breakdown": status_counts,
        "total_disbursed_amount": float(disbursed_data.total_disbursed or 0),
        "total_disbursed_count": disbursed_data.count,
        "total_outstanding": float(outstanding_amount),
        "loans_by_type": loans_by_type,
        "recent_loans_30_days": recent_loans_count,
        "as_of_date": date.today().isoformat(),
    }


@router.get("/stats/monthly")
async def get_monthly_statistics(
    months: int = 6,
    current_user: User = Depends(require_admin_or_employee),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get monthly loan statistics for the last N months
    """

    # Base filter
    base_filter = []
    if current_user.role == UserRole.EMPLOYEE:
        base_filter.append(Loan.branch_id == current_user.branch_id)

    # Calculate date range
    end_date = date.today()
    start_date = end_date - timedelta(days=months * 30)

    # Monthly disbursement query
    monthly_query = (
        select(
            func.date_trunc("month", Loan.disbursement_date).label("month"),
            func.count(Loan.id).label("count"),
            func.sum(Loan.principal_amount).label("total_amount"),
        )
        .where(
            and_(
                Loan.disbursement_date >= start_date, Loan.disbursement_date.isnot(None)
            )
        )
        .group_by(func.date_trunc("month", Loan.disbursement_date))
        .order_by(func.date_trunc("month", Loan.disbursement_date).desc())
    )

    if base_filter:
        monthly_query = monthly_query.where(and_(*base_filter))

    result = await db.execute(monthly_query)
    monthly_data = [
        {
            "month": row.month.strftime("%Y-%m") if row.month else None,
            "loans_count": row.count,
            "total_amount": float(row.total_amount or 0),
        }
        for row in result.all()
    ]

    return {
        "period": f"Last {months} months",
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "monthly_statistics": monthly_data,
    }


@router.get("/stats/farmers")
async def get_farmer_statistics(
    current_user: User = Depends(require_admin_or_employee),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get farmer-wise loan statistics
    Top borrowers, active farmers, etc.
    """

    # Base filter
    base_filter = []
    if current_user.role == UserRole.EMPLOYEE:
        base_filter.append(Loan.branch_id == current_user.branch_id)

    # Top 10 farmers by total borrowed amount
    top_farmers_query = (
        select(
            Loan.farmer_id,
            func.count(Loan.id).label("total_loans"),
            func.sum(Loan.principal_amount).label("total_borrowed"),
            func.sum(Loan.total_outstanding).label("total_outstanding"),
        )
        .group_by(Loan.farmer_id)
        .order_by(func.sum(Loan.principal_amount).desc())
        .limit(10)
    )

    if base_filter:
        top_farmers_query = top_farmers_query.where(and_(*base_filter))

    result = await db.execute(top_farmers_query)
    top_farmers = [
        {
            "farmer_id": row.farmer_id,
            "total_loans": row.total_loans,
            "total_borrowed": float(row.total_borrowed or 0),
            "total_outstanding": float(row.total_outstanding or 0),
        }
        for row in result.all()
    ]

    # Active farmers (with active loans)
    active_farmers_query = select(func.count(func.distinct(Loan.farmer_id))).where(
        Loan.status == LoanStatus.ACTIVE
    )

    if base_filter:
        active_farmers_query = active_farmers_query.where(and_(*base_filter))

    result = await db.execute(active_farmers_query)
    active_farmers_count = result.scalar() or 0

    return {"active_farmers": active_farmers_count, "top_borrowers": top_farmers}


@router.get("/stats/performance")
async def get_performance_metrics(
    current_user: User = Depends(require_admin_or_employee),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get loan portfolio performance metrics
    """

    # Base filter
    base_filter = []
    if current_user.role == UserRole.EMPLOYEE:
        base_filter.append(Loan.branch_id == current_user.branch_id)

    # Portfolio quality metrics
    portfolio_query = select(
        func.count(Loan.id).label("total_loans"),
        func.sum(case((Loan.status == LoanStatus.ACTIVE, 1), else_=0)).label(
            "active_loans"
        ),
        func.sum(case((Loan.status == LoanStatus.DEFAULTED, 1), else_=0)).label(
            "defaulted_loans"
        ),
        func.sum(case((Loan.status == LoanStatus.CLOSED, 1), else_=0)).label(
            "closed_loans"
        ),
        func.sum(Loan.principal_amount).label("total_principal"),
        func.sum(Loan.total_outstanding).label("total_outstanding"),
        func.sum(Loan.total_paid).label("total_collected"),
    )

    if base_filter:
        portfolio_query = portfolio_query.where(and_(*base_filter))

    result = await db.execute(portfolio_query)
    metrics = result.one()

    # Calculate ratios
    total_loans = metrics.total_loans or 1  # Avoid division by zero
    default_rate = (metrics.defaulted_loans or 0) / total_loans * 100
    closure_rate = (metrics.closed_loans or 0) / total_loans * 100

    total_principal = float(metrics.total_principal or 0)
    collection_rate = 0
    if total_principal > 0:
        collection_rate = (float(metrics.total_collected or 0) / total_principal) * 100

    return {
        "portfolio_summary": {
            "total_loans": total_loans,
            "active_loans": metrics.active_loans or 0,
            "defaulted_loans": metrics.defaulted_loans or 0,
            "closed_loans": metrics.closed_loans or 0,
        },
        "amounts": {
            "total_principal": total_principal,
            "total_outstanding": float(metrics.total_outstanding or 0),
            "total_collected": float(metrics.total_collected or 0),
        },
        "performance_ratios": {
            "default_rate_percent": round(default_rate, 2),
            "closure_rate_percent": round(closure_rate, 2),
            "collection_rate_percent": round(collection_rate, 2),
        },
    }


@router.get("/admin/system-overview")
async def get_admin_system_overview(
    current_user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Comprehensive system-wide overview for admin only
    Includes: users, loans, collections, NPA, branch performance
    """
    from app.models.user import User as UserModel
    from app.models.branch import Branch

    today = date.today()
    first_of_month = today.replace(day=1)
    first_of_year = today.replace(month=1, day=1)

    # ==================== USER STATISTICS ====================
    users_query = select(
        func.count(case((UserModel.role == UserRole.FARMER, 1))).label("total_farmers"),
        func.count(case((UserModel.role == UserRole.EMPLOYEE, 1))).label(
            "total_employees"
        ),
        func.count(case((UserModel.role == UserRole.ADMIN, 1))).label("total_admins"),
        func.count(case((UserModel.is_active == True, 1))).label("active_users"),
        func.count(UserModel.id).label("total_users"),
    )
    result = await db.execute(users_query)
    user_stats = result.one()

    # ==================== LOAN STATISTICS ====================
    loans_query = select(
        func.count(Loan.id).label("total_loans"),
        func.count(case((Loan.status == LoanStatus.PENDING_APPROVAL, 1))).label(
            "pending"
        ),
        func.count(case((Loan.status == LoanStatus.APPROVED, 1))).label("approved"),
        func.count(case((Loan.status == LoanStatus.ACTIVE, 1))).label("active"),
        func.count(case((Loan.status == LoanStatus.CLOSED, 1))).label("closed"),
        func.count(case((Loan.status == LoanStatus.REJECTED, 1))).label("rejected"),
        func.coalesce(func.sum(Loan.principal_amount), 0).label("total_principal"),
        func.coalesce(func.sum(Loan.total_outstanding), 0).label("total_outstanding"),
        func.coalesce(
            func.sum(case((Loan.total_outstanding > 0, Loan.total_outstanding))), 0
        ).label("portfolio_at_risk"),
    )
    result = await db.execute(loans_query)
    loan_stats = result.one()

    # ==================== COLLECTION STATISTICS ====================
    # Today's collections
    today_collections_query = select(
        func.count(Payment.id).label("count"),
        func.coalesce(func.sum(Payment.amount), 0).label("amount"),
    ).where(
        and_(
            func.date(Payment.payment_date) == today,
            Payment.status == PaymentStatus.SUCCESS,
        )
    )
    result = await db.execute(today_collections_query)
    today_collections = result.one()

    # This month's collections
    month_collections_query = select(
        func.count(Payment.id).label("count"),
        func.coalesce(func.sum(Payment.amount), 0).label("amount"),
    ).where(
        and_(
            Payment.payment_date >= first_of_month,
            Payment.status == PaymentStatus.SUCCESS,
        )
    )
    result = await db.execute(month_collections_query)
    month_collections = result.one()

    # This year's collections
    year_collections_query = select(
        func.count(Payment.id).label("count"),
        func.coalesce(func.sum(Payment.amount), 0).label("amount"),
    ).where(
        and_(
            Payment.payment_date >= first_of_year,
            Payment.status == PaymentStatus.SUCCESS,
        )
    )
    result = await db.execute(year_collections_query)
    year_collections = result.one()

    # ==================== NPA CALCULATION ====================
    # Loans overdue > 90 days are considered NPA
    ninety_days_ago = today - timedelta(days=90)
    npa_query = select(
        func.count(Loan.id).label("npa_count"),
        func.coalesce(func.sum(Loan.total_outstanding), 0).label("npa_amount"),
    ).where(
        and_(
            Loan.status == LoanStatus.ACTIVE,
            Loan.total_outstanding > 0,
            or_(
                Loan.maturity_date < ninety_days_ago,
                and_(
                    Loan.disbursement_date.isnot(None),
                    Loan.disbursement_date < ninety_days_ago,
                ),
            ),
        )
    )
    result = await db.execute(npa_query)
    npa_stats = result.one()

    total_portfolio = float(loan_stats.total_principal or 0)
    npa_percentage = 0
    if total_portfolio > 0:
        npa_percentage = (float(npa_stats.npa_amount or 0) / total_portfolio) * 100

    # ==================== BRANCH PERFORMANCE ====================
    branch_performance_query = (
        select(
            Branch.id,
            Branch.name,
            Branch.code,
            func.count(Loan.id).label("total_loans"),
            func.count(case((Loan.status == LoanStatus.ACTIVE, 1))).label(
                "active_loans"
            ),
            func.coalesce(func.sum(Loan.principal_amount), 0).label("total_disbursed"),
            func.coalesce(func.sum(Loan.total_outstanding), 0).label(
                "total_outstanding"
            ),
            func.count(UserModel.id).label("total_farmers"),
        )
        .select_from(Branch)
        .outerjoin(Loan, Loan.branch_id == Branch.id)
        .outerjoin(
            UserModel,
            and_(UserModel.branch_id == Branch.id, UserModel.role == UserRole.FARMER),
        )
        .group_by(Branch.id, Branch.name, Branch.code)
        .order_by(func.coalesce(func.sum(Loan.principal_amount), 0).desc())
    )

    result = await db.execute(branch_performance_query)
    branch_performance = [
        {
            "branch_id": row.id,
            "branch_name": row.name,
            "branch_code": row.code,
            "total_loans": row.total_loans or 0,
            "active_loans": row.active_loans or 0,
            "total_disbursed": float(row.total_disbursed or 0),
            "total_outstanding": float(row.total_outstanding or 0),
            "total_farmers": row.total_farmers or 0,
        }
        for row in result.all()
    ]

    # ==================== RECENT ACTIVITY ====================
    recent_loans_query = select(Loan).order_by(Loan.created_at.desc()).limit(10)
    result = await db.execute(recent_loans_query)
    recent_loans = result.scalars().all()

    return {
        "user_statistics": {
            "total_farmers": user_stats.total_farmers or 0,
            "total_employees": user_stats.total_employees or 0,
            "total_admins": user_stats.total_admins or 0,
            "active_users": user_stats.active_users or 0,
            "total_users": user_stats.total_users or 0,
        },
        "loan_statistics": {
            "total_loans": loan_stats.total_loans or 0,
            "pending_approval": loan_stats.pending or 0,
            "approved": loan_stats.approved or 0,
            "active": loan_stats.active or 0,
            "closed": loan_stats.closed or 0,
            "rejected": loan_stats.rejected or 0,
            "total_principal": float(loan_stats.total_principal or 0),
            "total_outstanding": float(loan_stats.total_outstanding or 0),
            "portfolio_at_risk": float(loan_stats.portfolio_at_risk or 0),
        },
        "collection_statistics": {
            "today": {
                "count": today_collections.count or 0,
                "amount": float(today_collections.amount or 0),
            },
            "this_month": {
                "count": month_collections.count or 0,
                "amount": float(month_collections.amount or 0),
            },
            "this_year": {
                "count": year_collections.count or 0,
                "amount": float(year_collections.amount or 0),
            },
        },
        "npa_statistics": {
            "npa_loan_count": npa_stats.npa_count or 0,
            "npa_amount": float(npa_stats.npa_amount or 0),
            "npa_percentage": round(npa_percentage, 2),
            "gross_npa_ratio": round(npa_percentage, 2),
        },
        "branch_performance": branch_performance,
        "recent_activity": {
            "recent_loans_count": len(recent_loans),
            "last_loan_date": (
                recent_loans[0].created_at.isoformat() if recent_loans else None
            ),
        },
        "generated_at": datetime.now().isoformat(),
    }


@router.get("/admin/branch-analytics")
async def get_branch_analytics(
    current_user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)
):
    """
    Get comprehensive multi-branch analytics (Admin only)
    Provides detailed comparison and performance metrics for all branches
    """
    from app.models.branch import Branch

    # Get all branches
    result = await db.execute(select(Branch))
    branches = result.scalars().all()

    branch_analytics = []

    for branch in branches:
        # Loan statistics for this branch
        loan_stats_query = select(
            func.count(Loan.id).label("total_loans"),
            func.count(case((Loan.status == LoanStatus.PENDING, 1))).label("pending"),
            func.count(case((Loan.status == LoanStatus.APPROVED, 1))).label("approved"),
            func.count(case((Loan.status == LoanStatus.ACTIVE, 1))).label("active"),
            func.count(case((Loan.status == LoanStatus.CLOSED, 1))).label("closed"),
            func.count(case((Loan.status == LoanStatus.REJECTED, 1))).label("rejected"),
            func.sum(Loan.principal_amount).label("total_principal"),
            func.sum(Loan.outstanding_balance).label("outstanding_balance"),
        ).where(Loan.branch_id == branch.id)

        result = await db.execute(loan_stats_query)
        loan_stats = result.one()

        # Collection statistics for this branch (this month)
        month_start = datetime.now().replace(
            day=1, hour=0, minute=0, second=0, microsecond=0
        )
        collection_query = (
            select(
                func.count(Payment.id).label("payment_count"),
                func.sum(Payment.amount).label("total_collected"),
            )
            .join(Loan)
            .where(
                and_(
                    Loan.branch_id == branch.id,
                    Payment.status == PaymentStatus.SUCCESS,
                    Payment.created_at >= month_start,
                )
            )
        )

        result = await db.execute(collection_query)
        collection_stats = result.one()

        # NPA for this branch (loans overdue > 90 days)
        overdue_threshold = datetime.now() - timedelta(days=90)
        npa_query = select(
            func.count(Loan.id).label("npa_count"),
            func.sum(Loan.outstanding_balance).label("npa_amount"),
        ).where(
            and_(
                Loan.branch_id == branch.id,
                Loan.status == LoanStatus.ACTIVE,
                Loan.next_due_date < overdue_threshold.date(),
            )
        )

        result = await db.execute(npa_query)
        npa_stats = result.one()

        # Calculate NPA percentage
        total_outstanding = float(loan_stats.outstanding_balance or 0)
        npa_amount = float(npa_stats.npa_amount or 0)
        npa_percentage = (
            (npa_amount / total_outstanding * 100) if total_outstanding > 0 else 0
        )

        # Farmer count in this branch
        farmer_query = select(func.count(User.id)).where(
            and_(User.branch_id == branch.id, User.role == UserRole.FARMER)
        )
        result = await db.execute(farmer_query)
        farmer_count = result.scalar_one()

        # Employee count in this branch
        employee_query = select(func.count(User.id)).where(
            and_(User.branch_id == branch.id, User.role == UserRole.EMPLOYEE)
        )
        result = await db.execute(employee_query)
        employee_count = result.scalar_one()

        # Calculate efficiency metrics
        loans_per_employee = (
            loan_stats.total_loans / employee_count if employee_count > 0 else 0
        )
        farmers_per_employee = (
            farmer_count / employee_count if employee_count > 0 else 0
        )
        avg_loan_size = (
            total_outstanding / loan_stats.active if loan_stats.active else 0
        )

        # Collection efficiency (collections vs outstanding)
        collection_efficiency = (
            (float(collection_stats.total_collected or 0) / total_outstanding * 100)
            if total_outstanding > 0
            else 0
        )

        branch_analytics.append(
            {
                "branch_id": branch.id,
                "branch_name": branch.name,
                "branch_code": branch.code,
                "location": {
                    "address": branch.address,
                    "city": branch.city,
                    "state": branch.state,
                    "pincode": branch.pincode,
                },
                "contact": {
                    "phone": branch.phone,
                    "email": branch.email,
                    "manager": branch.manager_name,
                },
                "loan_statistics": {
                    "total_loans": loan_stats.total_loans or 0,
                    "pending": loan_stats.pending or 0,
                    "approved": loan_stats.approved or 0,
                    "active": loan_stats.active or 0,
                    "closed": loan_stats.closed or 0,
                    "rejected": loan_stats.rejected or 0,
                    "total_principal": float(loan_stats.total_principal or 0),
                    "outstanding_balance": total_outstanding,
                },
                "collection_statistics": {
                    "this_month_count": collection_stats.payment_count or 0,
                    "this_month_amount": float(collection_stats.total_collected or 0),
                    "collection_efficiency": round(collection_efficiency, 2),
                },
                "npa_statistics": {
                    "npa_count": npa_stats.npa_count or 0,
                    "npa_amount": npa_amount,
                    "npa_percentage": round(npa_percentage, 2),
                },
                "resource_statistics": {
                    "farmer_count": farmer_count,
                    "employee_count": employee_count,
                    "loans_per_employee": round(loans_per_employee, 2),
                    "farmers_per_employee": round(farmers_per_employee, 2),
                    "avg_loan_size": round(avg_loan_size, 2),
                },
                "status": {
                    "is_active": branch.is_active,
                    "created_at": (
                        branch.created_at.isoformat() if branch.created_at else None
                    ),
                },
            }
        )

    # Calculate system-wide totals and rankings
    total_loans = sum(b["loan_statistics"]["total_loans"] for b in branch_analytics)
    total_outstanding = sum(
        b["loan_statistics"]["outstanding_balance"] for b in branch_analytics
    )
    total_collections = sum(
        b["collection_statistics"]["this_month_amount"] for b in branch_analytics
    )
    total_npa = sum(b["npa_statistics"]["npa_amount"] for b in branch_analytics)

    # Rank branches by performance
    sorted_by_outstanding = sorted(
        branch_analytics,
        key=lambda x: x["loan_statistics"]["outstanding_balance"],
        reverse=True,
    )
    sorted_by_collections = sorted(
        branch_analytics,
        key=lambda x: x["collection_statistics"]["this_month_amount"],
        reverse=True,
    )
    sorted_by_npa = sorted(
        branch_analytics, key=lambda x: x["npa_statistics"]["npa_percentage"]
    )

    return {
        "branch_count": len(branches),
        "branches": branch_analytics,
        "system_totals": {
            "total_loans": total_loans,
            "total_outstanding": round(total_outstanding, 2),
            "total_collections_this_month": round(total_collections, 2),
            "total_npa": round(total_npa, 2),
            "system_npa_percentage": round(
                (total_npa / total_outstanding * 100) if total_outstanding > 0 else 0, 2
            ),
        },
        "rankings": {
            "top_by_outstanding": [
                {
                    "rank": idx + 1,
                    "branch_id": b["branch_id"],
                    "branch_name": b["branch_name"],
                    "outstanding": b["loan_statistics"]["outstanding_balance"],
                }
                for idx, b in enumerate(sorted_by_outstanding[:5])
            ],
            "top_by_collections": [
                {
                    "rank": idx + 1,
                    "branch_id": b["branch_id"],
                    "branch_name": b["branch_name"],
                    "collections": b["collection_statistics"]["this_month_amount"],
                }
                for idx, b in enumerate(sorted_by_collections[:5])
            ],
            "best_by_npa": [
                {
                    "rank": idx + 1,
                    "branch_id": b["branch_id"],
                    "branch_name": b["branch_name"],
                    "npa_percentage": b["npa_statistics"]["npa_percentage"],
                }
                for idx, b in enumerate(sorted_by_npa[:5])
            ],
        },
        "generated_at": datetime.now().isoformat(),
    }
