"""
Service for handling overdue EMI tracking and penal interest calculation
"""
from datetime import date, datetime
from typing import List, Dict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.loan import Loan, LoanStatus, EMISchedule, LoanTypeConfig
from app.models.user import User


class OverdueService:
    """Service for managing overdue loans and EMIs"""
    
    @staticmethod
    async def check_and_update_overdue_emis(db: AsyncSession) -> Dict:
        """
        Check all active loans for overdue EMIs and update their status
        Returns summary of overdue EMIs found
        """
        today = date.today()
        
        # Get all unpaid EMIs that are past due date
        result = await db.execute(
            select(EMISchedule)
            .where(
                EMISchedule.is_paid == False,
                EMISchedule.due_date < today
            )
        )
        overdue_emis = result.scalars().all()
        
        summary = {
            "total_overdue": 0,
            "loans_affected": set(),
            "total_penal_interest": 0.0
        }
        
        for emi in overdue_emis:
            # Calculate overdue days
            emi.overdue_days = (today - emi.due_date).days
            emi.is_overdue = True
            
            # Get loan to fetch penal interest rate
            loan_result = await db.execute(
                select(Loan).where(Loan.id == emi.loan_id)
            )
            loan = loan_result.scalar_one_or_none()
            
            if loan and emi.overdue_days > 0:
                # Get loan type config for penal interest settings
                config_result = await db.execute(
                    select(LoanTypeConfig).where(LoanTypeConfig.loan_type == loan.loan_type)
                )
                config = config_result.scalar_one_or_none()
                
                # Calculate penal interest only if overdue exceeds threshold
                if config and emi.overdue_days >= config.overdue_days_for_penalty:
                    penal_rate = config.penal_interest_rate / 100  # Convert to decimal
                    
                    # Penal interest = Outstanding EMI amount * Penal rate * (Overdue days / 365)
                    outstanding_emi = emi.emi_amount - emi.paid_amount
                    emi.penal_interest = outstanding_emi * penal_rate * (emi.overdue_days / 365)
                    
                    summary["total_penal_interest"] += emi.penal_interest
                
                summary["total_overdue"] += 1
                summary["loans_affected"].add(loan.id)
        
        await db.commit()
        
        summary["loans_affected"] = len(summary["loans_affected"])
        return summary
    
    @staticmethod
    async def get_overdue_emis_for_loan(db: AsyncSession, loan_id: int) -> List[EMISchedule]:
        """Get all overdue EMIs for a specific loan"""
        result = await db.execute(
            select(EMISchedule)
            .where(
                EMISchedule.loan_id == loan_id,
                EMISchedule.is_overdue == True,
                EMISchedule.is_paid == False
            )
            .order_by(EMISchedule.due_date)
        )
        return result.scalars().all()
    
    @staticmethod
    async def get_overdue_loans_summary(db: AsyncSession) -> Dict:
        """Get summary of all overdue loans in the system"""
        # Get all active loans with overdue EMIs
        result = await db.execute(
            select(Loan)
            .join(EMISchedule)
            .where(
                Loan.status == LoanStatus.ACTIVE,
                EMISchedule.is_overdue == True,
                EMISchedule.is_paid == False
            )
            .distinct()
        )
        overdue_loans = result.scalars().all()
        
        summary = {
            "total_overdue_loans": len(overdue_loans),
            "loans": []
        }
        
        for loan in overdue_loans:
            # Get overdue EMIs for this loan
            overdue_emis = await OverdueService.get_overdue_emis_for_loan(db, loan.id)
            
            total_overdue_amount = sum(emi.emi_amount - emi.paid_amount for emi in overdue_emis)
            total_penal = sum(emi.penal_interest for emi in overdue_emis)
            max_overdue_days = max((emi.overdue_days for emi in overdue_emis), default=0)
            
            # Get farmer details
            farmer_result = await db.execute(
                select(User).where(User.id == loan.farmer_id)
            )
            farmer = farmer_result.scalar_one_or_none()
            
            summary["loans"].append({
                "loan_id": loan.id,
                "loan_number": loan.loan_number,
                "farmer_name": farmer.full_name if farmer else "Unknown",
                "farmer_mobile": farmer.mobile if farmer else None,
                "overdue_emis_count": len(overdue_emis),
                "total_overdue_amount": round(total_overdue_amount, 2),
                "total_penal_interest": round(total_penal, 2),
                "max_overdue_days": max_overdue_days,
                "oldest_overdue_date": min(emi.due_date for emi in overdue_emis) if overdue_emis else None
            })
        
        return summary
    
    @staticmethod
    async def mark_loan_as_defaulted(db: AsyncSession, loan_id: int, days_threshold: int = 90) -> bool:
        """
        Mark a loan as defaulted if overdue exceeds threshold
        Returns True if loan was marked as defaulted
        """
        loan_result = await db.execute(
            select(Loan).where(Loan.id == loan_id)
        )
        loan = loan_result.scalar_one_or_none()
        
        if not loan or loan.status != LoanStatus.ACTIVE:
            return False
        
        # Check if any EMI is overdue beyond threshold
        overdue_emis = await OverdueService.get_overdue_emis_for_loan(db, loan_id)
        
        for emi in overdue_emis:
            if emi.overdue_days >= days_threshold:
                loan.status = LoanStatus.DEFAULTED
                await db.commit()
                return True
        
        return False
