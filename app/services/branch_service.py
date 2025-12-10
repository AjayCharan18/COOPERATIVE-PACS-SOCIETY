"""
Service for branch management and statistics
"""
from typing import Dict, List
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date, timedelta

from app.models.user import Branch
from app.models.loan import Loan, LoanStatus


class BranchService:
    """Service for branch operations and statistics"""
    
    @staticmethod
    async def get_branch_statistics(db: AsyncSession, branch_id: int) -> Dict:
        """Get comprehensive statistics for a branch"""
        # Total loans
        total_loans = await db.scalar(
            select(func.count(Loan.id)).where(Loan.branch_id == branch_id)
        )
        
        # Active loans
        active_loans = await db.scalar(
            select(func.count(Loan.id))
            .where(Loan.branch_id == branch_id, Loan.status == LoanStatus.ACTIVE)
        )
        
        # Total disbursed amount
        total_disbursed_result = await db.execute(
            select(func.sum(Loan.principal_amount))
            .where(Loan.branch_id == branch_id, Loan.status.in_([LoanStatus.ACTIVE, LoanStatus.CLOSED]))
        )
        total_disbursed = total_disbursed_result.scalar() or 0
        
        # Outstanding amount
        outstanding_result = await db.execute(
            select(func.sum(Loan.outstanding_principal))
            .where(Loan.branch_id == branch_id, Loan.status == LoanStatus.ACTIVE)
        )
        outstanding = outstanding_result.scalar() or 0
        
        # Loans by status
        status_result = await db.execute(
            select(Loan.status, func.count(Loan.id))
            .where(Loan.branch_id == branch_id)
            .group_by(Loan.status)
        )
        loans_by_status = {status: count for status, count in status_result.all()}
        
        # Loans by type
        type_result = await db.execute(
            select(Loan.loan_type, func.count(Loan.id))
            .where(Loan.branch_id == branch_id)
            .group_by(Loan.loan_type)
        )
        loans_by_type = {loan_type: count for loan_type, count in type_result.all()}
        
        # Collection rate
        collected_result = await db.execute(
            select(func.sum(Loan.total_paid))
            .where(Loan.branch_id == branch_id)
        )
        total_collected = collected_result.scalar() or 0
        collection_rate = (total_collected / total_disbursed * 100) if total_disbursed > 0 else 0
        
        return {
            "branch_id": branch_id,
            "total_loans": total_loans,
            "active_loans": active_loans,
            "total_disbursed": round(total_disbursed, 2),
            "total_outstanding": round(outstanding, 2),
            "total_collected": round(total_collected, 2),
            "collection_rate": round(collection_rate, 2),
            "loans_by_status": loans_by_status,
            "loans_by_type": loans_by_type
        }
    
    @staticmethod
    async def get_all_branches_comparison(db: AsyncSession) -> List[Dict]:
        """Get comparative statistics for all branches"""
        result = await db.execute(select(Branch).where(Branch.is_active == True))
        branches = result.scalars().all()
        
        comparison = []
        for branch in branches:
            stats = await BranchService.get_branch_statistics(db, branch.id)
            comparison.append({
                "branch_id": branch.id,
                "branch_name": branch.branch_name,
                "branch_code": branch.branch_code,
                "statistics": stats
            })
        
        return comparison
    
    @staticmethod
    async def get_top_performing_branches(db: AsyncSession, limit: int = 5) -> List[Dict]:
        """Get top performing branches by disbursement amount"""
        result = await db.execute(
            select(
                Branch.id,
                Branch.branch_name,
                Branch.branch_code,
                func.sum(Loan.principal_amount).label("total_disbursed"),
                func.count(Loan.id).label("total_loans")
            )
            .join(Loan, Branch.id == Loan.branch_id)
            .where(Branch.is_active == True)
            .group_by(Branch.id, Branch.branch_name, Branch.branch_code)
            .order_by(func.sum(Loan.principal_amount).desc())
            .limit(limit)
        )
        
        top_branches = []
        for branch_id, name, code, disbursed, loans in result.all():
            top_branches.append({
                "branch_id": branch_id,
                "branch_name": name,
                "branch_code": code,
                "total_disbursed": round(disbursed, 2),
                "total_loans": loans
            })
        
        return top_branches
    
    @staticmethod
    async def get_branch_monthly_trend(
        db: AsyncSession,
        branch_id: int,
        months: int = 6
    ) -> List[Dict]:
        """Get monthly disbursement trend for a branch"""
        from_date = date.today() - timedelta(days=months * 30)
        
        result = await db.execute(
            select(
                func.date_trunc('month', Loan.disbursement_date).label('month'),
                func.count(Loan.id).label('loan_count'),
                func.sum(Loan.principal_amount).label('total_amount')
            )
            .where(
                Loan.branch_id == branch_id,
                Loan.disbursement_date >= from_date,
                Loan.disbursement_date.isnot(None)
            )
            .group_by('month')
            .order_by('month')
        )
        
        trend = []
        for month, count, amount in result.all():
            trend.append({
                "month": month.strftime("%Y-%m") if month else None,
                "loan_count": count,
                "total_amount": round(amount, 2) if amount else 0
            })
        
        return trend
