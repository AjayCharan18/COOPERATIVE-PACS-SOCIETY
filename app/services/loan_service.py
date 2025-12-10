"""
Loan service for business logic
"""
from typing import Optional, List
from datetime import date, datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload
import uuid

from app.models.loan import Loan, LoanStatus, LoanTypeConfig, EMISchedule, LoanType
from app.models.user import User
from app.models.loan_ledger import LoanLedger
from app.schemas.loan import LoanCreate, LoanUpdate, LoanApproval, LoanReschedule
from app.services.interest_calculator import InterestCalculator


class LoanService:
    """Service for loan management operations"""
    
    @staticmethod
    async def create_loan(
        db: AsyncSession,
        loan_data: LoanCreate,
        created_by: User
    ) -> Loan:
        """Create a new loan application"""
        
        # Fetch loan type config to get default settings
        result = await db.execute(
            select(LoanTypeConfig).where(LoanTypeConfig.loan_type == loan_data.loan_type)
        )
        loan_config = result.scalar_one_or_none()
        
        # Use config's interest calculation type if available
        interest_calc_type = loan_data.interest_calculation_type
        if loan_config:
            interest_calc_type = loan_config.interest_calculation_type
        
        # Generate unique loan number
        loan_number = f"LOAN{datetime.now().strftime('%Y%m%d')}{str(uuid.uuid4())[:8].upper()}"
        
        # Calculate maturity date
        maturity_date = loan_data.sanction_date + timedelta(days=30 * loan_data.tenure_months)
        
        # Calculate total payable
        total_payable, total_interest = InterestCalculator.calculate_total_payable(
            loan_data.principal_amount,
            loan_data.interest_rate,
            loan_data.tenure_months,
            interest_calc_type
        )
        
        # Create loan
        loan = Loan(
            loan_number=loan_number,
            farmer_id=loan_data.farmer_id,
            branch_id=loan_data.branch_id,
            loan_type=loan_data.loan_type,
            loan_type_config_id=loan_config.id if loan_config else None,
            principal_amount=loan_data.principal_amount,
            interest_rate=loan_data.interest_rate,
            penal_interest_rate=loan_data.penal_interest_rate,
            tenure_months=loan_data.tenure_months,
            interest_calculation_type=interest_calc_type,
            sanction_date=loan_data.sanction_date,
            first_emi_date=loan_data.first_emi_date,
            maturity_date=maturity_date,
            purpose=loan_data.purpose,
            crop_season=loan_data.crop_season,
            collateral_details=loan_data.collateral_details,
            subsidy_scheme=loan_data.subsidy_scheme,
            total_amount_payable=total_payable,
            outstanding_principal=loan_data.principal_amount,
            outstanding_interest=total_interest,
            total_outstanding=total_payable,
            status=LoanStatus.PENDING_APPROVAL
        )
        
        # If EMI-based, calculate EMI and schedule
        if interest_calc_type.value == "emi":
            emi_amount = InterestCalculator.calculate_emi(
                loan_data.principal_amount,
                loan_data.interest_rate,
                loan_data.tenure_months
            )
            loan.emi_amount = emi_amount
            loan.number_of_emis = loan_data.tenure_months
        
        db.add(loan)
        await db.flush()
        
        # Create EMI schedule if applicable
        if loan.emi_amount and loan.first_emi_date:
            await LoanService.generate_emi_schedule(db, loan)
        
        await db.commit()
        await db.refresh(loan)
        
        return loan
    
    @staticmethod
    async def generate_emi_schedule(db: AsyncSession, loan: Loan):
        """Generate EMI schedule for a loan"""
        if not loan.first_emi_date or not loan.emi_amount:
            return
        
        schedule_data = InterestCalculator.generate_emi_schedule(
            loan.principal_amount,
            loan.interest_rate,
            loan.number_of_emis,
            loan.first_emi_date
        )
        
        for item in schedule_data:
            emi_entry = EMISchedule(
                loan_id=loan.id,
                installment_number=item["installment_number"],
                due_date=item["due_date"],
                emi_amount=item["emi_amount"],
                principal_component=item["principal_component"],
                interest_component=item["interest_component"],
                outstanding_principal=item["outstanding_principal"]
            )
            db.add(emi_entry)
        
        await db.commit()
    
    @staticmethod
    async def approve_loan(
        db: AsyncSession,
        approval_data: LoanApproval,
        approved_by: User
    ) -> Loan:
        """Approve a loan application"""
        
        result = await db.execute(select(Loan).where(Loan.id == approval_data.loan_id))
        loan = result.scalar_one_or_none()
        
        if not loan:
            raise ValueError("Loan not found")
        
        if loan.status != LoanStatus.PENDING_APPROVAL:
            raise ValueError(f"Loan is not in pending approval status. Current status: {loan.status}")
        
        if approval_data.approved:
            loan.status = LoanStatus.APPROVED
            loan.approved_by_id = approved_by.id
            loan.approval_date = datetime.utcnow()
            loan.approval_remarks = approval_data.remarks
            
            if approval_data.disbursement_date:
                loan.disbursement_date = approval_data.disbursement_date
                loan.status = LoanStatus.ACTIVE
                
                # Set first EMI date if not set (1 month after disbursement for EMI loans)
                if loan.emi_amount and not loan.first_emi_date:
                    loan.first_emi_date = approval_data.disbursement_date + timedelta(days=30)
                
                # Generate EMI schedule if applicable
                if loan.emi_amount and loan.first_emi_date:
                    await LoanService.generate_emi_schedule(db, loan)
                
                # Create disbursement ledger entry
                ledger_entry = LoanLedger(
                    loan_id=loan.id,
                    entry_date=approval_data.disbursement_date,
                    transaction_type="DISBURSEMENT",
                    debit=loan.principal_amount,
                    credit=0.0,
                    principal_amount=loan.principal_amount,
                    outstanding_principal=loan.principal_amount,
                    outstanding_interest=0.0,
                    total_outstanding=loan.principal_amount,
                    narration=f"Loan disbursed - {loan.loan_number}"
                )
                db.add(ledger_entry)
        else:
            loan.status = LoanStatus.REJECTED
            loan.approval_remarks = approval_data.remarks
        
        await db.commit()
        await db.refresh(loan)
        
        return loan
    
    @staticmethod
    async def reschedule_loan(
        db: AsyncSession,
        reschedule_data: LoanReschedule,
        user: User
    ) -> Loan:
        """Reschedule an existing loan"""
        
        result = await db.execute(select(Loan).where(Loan.id == reschedule_data.loan_id))
        old_loan = result.scalar_one_or_none()
        
        if not old_loan:
            raise ValueError("Loan not found")
        
        if old_loan.status not in [LoanStatus.ACTIVE, LoanStatus.DEFAULTED]:
            raise ValueError("Only active or defaulted loans can be rescheduled")
        
        # Mark old loan as rescheduled
        old_loan.status = LoanStatus.RESCHEDULED
        old_loan.is_rescheduled = True
        
        # Create new loan with rescheduled terms
        new_interest_rate = reschedule_data.new_interest_rate or old_loan.interest_rate
        
        new_loan = Loan(
            loan_number=f"{old_loan.loan_number}-R{datetime.now().strftime('%m%d')}",
            farmer_id=old_loan.farmer_id,
            branch_id=old_loan.branch_id,
            loan_type=old_loan.loan_type,
            principal_amount=old_loan.outstanding_principal,
            interest_rate=new_interest_rate,
            penal_interest_rate=old_loan.penal_interest_rate,
            tenure_months=reschedule_data.new_tenure_months,
            interest_calculation_type=old_loan.interest_calculation_type,
            sanction_date=date.today(),
            maturity_date=date.today() + timedelta(days=30 * reschedule_data.new_tenure_months),
            purpose=f"Rescheduled loan - {old_loan.purpose}",
            status=LoanStatus.ACTIVE,
            original_loan_id=old_loan.id,
            is_rescheduled=True,
            reschedule_reason=reschedule_data.reason,
            outstanding_principal=old_loan.outstanding_principal
        )
        
        # Calculate new EMI if applicable
        if old_loan.emi_amount:
            new_loan.emi_amount = InterestCalculator.calculate_emi(
                new_loan.principal_amount,
                new_interest_rate,
                reschedule_data.new_tenure_months
            )
            new_loan.number_of_emis = reschedule_data.new_tenure_months
            new_loan.first_emi_date = date.today() + timedelta(days=30)
        
        db.add(new_loan)
        await db.flush()
        
        if new_loan.emi_amount and new_loan.first_emi_date:
            await LoanService.generate_emi_schedule(db, new_loan)
        
        await db.commit()
        await db.refresh(new_loan)
        
        return new_loan
    
    @staticmethod
    async def get_loan_summary(db: AsyncSession, filters: dict = None) -> dict:
        """Get loan summary statistics"""
        
        query = select(Loan)
        
        if filters:
            if filters.get("branch_id"):
                query = query.where(Loan.branch_id == filters["branch_id"])
            if filters.get("farmer_id"):
                query = query.where(Loan.farmer_id == filters["farmer_id"])
            if filters.get("status"):
                query = query.where(Loan.status == filters["status"])
        
        result = await db.execute(query)
        loans = result.scalars().all()
        
        total_loans = len(loans)
        active_loans = sum(1 for l in loans if l.status == LoanStatus.ACTIVE)
        total_disbursed = sum(l.principal_amount for l in loans if l.disbursement_date)
        total_outstanding = sum(l.total_outstanding for l in loans if l.status == LoanStatus.ACTIVE)
        total_collected = sum(l.total_paid for l in loans)
        
        # Overdue loans (past maturity date)
        overdue_loans = [l for l in loans if l.status == LoanStatus.ACTIVE and l.maturity_date < date.today()]
        overdue_amount = sum(l.total_outstanding for l in overdue_loans)
        
        # NPA loans (overdue > 90 days)
        npa_loans = [l for l in overdue_loans if (date.today() - l.maturity_date).days > 90]
        npa_amount = sum(l.total_outstanding for l in npa_loans)
        
        return {
            "total_loans": total_loans,
            "active_loans": active_loans,
            "total_disbursed": round(total_disbursed, 2),
            "total_outstanding": round(total_outstanding, 2),
            "total_collected": round(total_collected, 2),
            "overdue_loans": len(overdue_loans),
            "overdue_amount": round(overdue_amount, 2),
            "npa_loans": len(npa_loans),
            "npa_amount": round(npa_amount, 2)
        }
