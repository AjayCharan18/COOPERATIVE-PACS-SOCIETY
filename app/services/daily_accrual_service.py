"""
Daily Accrual Service
Handles incremental interest accrual and ledger posting
Runs as scheduled job (cron/worker)
"""
from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import List, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
import logging
import hashlib
import json

from app.models.loan import Loan, LoanStatus
from app.models.payment import Payment
from app.models.loan_ledger import LoanLedger, AccrualJob, AuditLog
from app.services.smart_calculator import SmartCalculator

logger = logging.getLogger(__name__)


class DailyAccrualService:
    """
    Service for daily interest accrual and ledger management
    Ensures idempotency and maintains complete audit trail
    """
    
    def __init__(self, db: AsyncSession, redis_client=None):
        self.db = db
        self.redis = redis_client
        self.calculator = SmartCalculator(db, redis_client)
    
    async def run_daily_accrual(self, accrual_date: date = None) -> Dict:
        """
        Main entry point for daily accrual job
        Processes all active loans and posts ledger entries
        """
        accrual_date = accrual_date or date.today()
        
        # Check if already processed (idempotency)
        existing_job = await self._get_job_for_date(accrual_date)
        if existing_job and existing_job.status == "completed":
            logger.info(f"Accrual for {accrual_date} already completed")
            return {
                "status": "already_completed",
                "job_id": existing_job.id,
                "accrual_date": accrual_date.isoformat()
            }
        
        # Create or update job record
        job = await self._create_or_update_job(accrual_date, "running")
        
        try:
            # Get all active loans
            active_loans = await self._get_active_loans()
            
            total_accrual = Decimal(0)
            processed_count = 0
            errors = []
            
            # Process each loan
            for loan in active_loans:
                try:
                    accrual_amount = await self._accrue_interest_for_loan(
                        loan, accrual_date
                    )
                    total_accrual += accrual_amount
                    processed_count += 1
                    
                except Exception as e:
                    logger.error(f"Error accruing for loan {loan.id}: {str(e)}")
                    errors.append({
                        "loan_id": loan.id,
                        "error": str(e)
                    })
            
            # Update job as completed
            job.status = "completed"
            job.loans_processed = processed_count
            job.total_accrual_amount = total_accrual
            job.errors_count = len(errors)
            job.error_details = json.dumps(errors) if errors else None
            job.completed_at = datetime.utcnow()
            job.duration_seconds = (job.completed_at - job.started_at).total_seconds()
            
            await self.db.commit()
            
            # Log audit entry
            await self._log_audit(
                actor_type="system",
                action="DAILY_ACCRUAL",
                description=f"Processed {processed_count} loans, total accrual: ₹{total_accrual}",
                metadata={"job_id": job.id, "accrual_date": accrual_date.isoformat()}
            )
            
            return {
                "status": "completed",
                "job_id": job.id,
                "accrual_date": accrual_date.isoformat(),
                "loans_processed": processed_count,
                "total_accrual": float(total_accrual),
                "errors": errors
            }
            
        except Exception as e:
            # Mark job as failed
            job.status = "failed"
            job.error_details = str(e)
            job.completed_at = datetime.utcnow()
            await self.db.commit()
            
            logger.error(f"Daily accrual failed: {str(e)}")
            raise
    
    async def _accrue_interest_for_loan(
        self, 
        loan: Loan, 
        accrual_date: date
    ) -> Decimal:
        """
        Calculate and post interest accrual for a single loan
        Creates ledger entry for the day
        """
        # Check if already accrued for this date
        existing_entry = await self._get_ledger_entry(
            loan.id, accrual_date, "DAILY_ACCRUAL"
        )
        if existing_entry:
            logger.info(f"Loan {loan.id} already accrued for {accrual_date}")
            return existing_entry.debit_amount
        
        # Calculate interest for the day
        calc_result = await self.calculator.calculate_interest_for_days(
            loan.id, days=1, from_date=accrual_date
        )
        
        interest_amount = Decimal(str(calc_result['interest_amount']))
        
        # Get previous balance
        prev_balance = await self._get_latest_balance(loan.id, accrual_date)
        new_balance = prev_balance + interest_amount
        
        # Create ledger entry
        ledger_entry = LoanLedger(
            loan_id=loan.id,
            transaction_date=accrual_date,
            transaction_type="DAILY_ACCRUAL",
            debit_amount=interest_amount,
            credit_amount=Decimal(0),
            balance=new_balance,
            reference_type="DAILY_ACCRUAL",
            description=f"Daily interest accrual for {accrual_date}",
            narration=f"Interest @ {calc_result['annual_rate']}% for 1 day",
            interest_rate_applied=Decimal(str(calc_result['annual_rate'])),
            days_calculated=1,
            created_by="system"
        )
        
        self.db.add(ledger_entry)
        await self.db.flush()
        
        # Invalidate cache for this loan
        await self._invalidate_cache(loan.id)
        
        return interest_amount
    
    async def post_payment_to_ledger(
        self, 
        loan_id: int, 
        payment_amount: Decimal,
        payment_date: date, 
        payment_id: int
    ):
        """
        Post payment transaction to ledger
        Called when payment is received
        """
        # Get previous balance
        prev_balance = await self._get_latest_balance(loan_id, payment_date)
        new_balance = prev_balance - payment_amount
        
        # Create ledger entry
        ledger_entry = LoanLedger(
            loan_id=loan_id,
            transaction_date=payment_date,
            transaction_type="PAYMENT",
            debit_amount=Decimal(0),
            credit_amount=payment_amount,
            balance=new_balance,
            reference_type="PAYMENT",
            reference_id=payment_id,
            description=f"Payment received",
            narration=f"Payment of ₹{payment_amount} received",
            created_by="system"
        )
        
        self.db.add(ledger_entry)
        await self.db.flush()
        
        # Invalidate cache
        await self._invalidate_cache(loan_id)
        
        # Log audit
        await self._log_audit(
            actor_type="system",
            action="PAYMENT_POSTED",
            entity_type="loan",
            entity_id=loan_id,
            description=f"Payment ₹{payment_amount} posted to ledger",
            metadata={"payment_id": payment_id, "amount": float(payment_amount)}
        )
    
    async def run_batch_calculation(
        self, 
        calculation_type: str,
        as_of_date: date = None
    ) -> Dict:
        """
        Run batch calculation across all loans
        Used for end-of-day accounting and reporting
        """
        as_of_date = as_of_date or date.today()
        
        logger.info(f"Starting batch {calculation_type} for {as_of_date}")
        
        # Get all active loans
        active_loans = await self._get_active_loans()
        
        results = []
        errors = []
        
        for loan in active_loans:
            try:
                if calculation_type == "outstanding":
                    result = await self.calculator.get_emi_schedule_as_of_date(
                        loan.id, as_of_date
                    )
                elif calculation_type == "penalty":
                    # Calculate penalty if overdue
                    overdue_days = await self._get_overdue_days(loan.id, as_of_date)
                    if overdue_days > 0:
                        overdue_amount = await self._get_overdue_amount(loan.id)
                        result = await self.calculator.calculate_penalty(
                            loan.id, overdue_days, overdue_amount
                        )
                    else:
                        continue
                else:
                    continue
                
                results.append({
                    "loan_id": loan.id,
                    "result": result
                })
                
            except Exception as e:
                logger.error(f"Batch calculation error for loan {loan.id}: {str(e)}")
                errors.append({
                    "loan_id": loan.id,
                    "error": str(e)
                })
        
        return {
            "calculation_type": calculation_type,
            "as_of_date": as_of_date.isoformat(),
            "total_loans": len(active_loans),
            "processed": len(results),
            "errors": len(errors),
            "results": results,
            "error_details": errors
        }
    
    # ==================== HELPER METHODS ====================
    
    async def _get_job_for_date(self, accrual_date: date) -> AccrualJob:
        """Get existing accrual job for date"""
        result = await self.db.execute(
            select(AccrualJob).where(AccrualJob.job_date == accrual_date)
        )
        return result.scalar_one_or_none()
    
    async def _create_or_update_job(
        self, 
        accrual_date: date, 
        status: str
    ) -> AccrualJob:
        """Create or update accrual job record"""
        job = await self._get_job_for_date(accrual_date)
        
        if job:
            job.status = status
            job.started_at = datetime.utcnow()
        else:
            job = AccrualJob(
                job_date=accrual_date,
                status=status,
                started_at=datetime.utcnow(),
                triggered_by="system"
            )
            self.db.add(job)
        
        await self.db.flush()
        return job
    
    async def _get_active_loans(self) -> List[Loan]:
        """Get all active loans"""
        result = await self.db.execute(
            select(Loan).where(
                Loan.status.in_([LoanStatus.APPROVED, LoanStatus.DISBURSED])
            )
        )
        return result.scalars().all()
    
    async def _get_ledger_entry(
        self, 
        loan_id: int, 
        transaction_date: date,
        transaction_type: str
    ) -> LoanLedger:
        """Get specific ledger entry"""
        result = await self.db.execute(
            select(LoanLedger).where(
                and_(
                    LoanLedger.loan_id == loan_id,
                    LoanLedger.transaction_date == transaction_date,
                    LoanLedger.transaction_type == transaction_type
                )
            )
        )
        return result.scalar_one_or_none()
    
    async def _get_latest_balance(
        self, 
        loan_id: int, 
        before_date: date
    ) -> Decimal:
        """Get latest ledger balance before given date"""
        result = await self.db.execute(
            select(LoanLedger)
            .where(
                and_(
                    LoanLedger.loan_id == loan_id,
                    LoanLedger.transaction_date < before_date
                )
            )
            .order_by(LoanLedger.transaction_date.desc())
            .limit(1)
        )
        entry = result.scalar_one_or_none()
        
        if entry:
            return entry.balance
        
        # If no entries, get loan principal
        loan_result = await self.db.execute(
            select(Loan).where(Loan.id == loan_id)
        )
        loan = loan_result.scalar_one()
        return loan.principal_amount
    
    async def _invalidate_cache(self, loan_id: int):
        """Invalidate all cached calculations for a loan"""
        if self.redis:
            # Delete Redis cache keys
            pattern = f"calc:loan:{loan_id}:*"
            keys = await self.redis.keys(pattern)
            if keys:
                await self.redis.delete(*keys)
    
    async def _get_overdue_days(self, loan_id: int, as_of_date: date) -> int:
        """Calculate overdue days for a loan"""
        # Get earliest unpaid EMI
        from app.models.payment import EMISchedule
        
        result = await self.db.execute(
            select(EMISchedule)
            .where(
                and_(
                    EMISchedule.loan_id == loan_id,
                    EMISchedule.due_date < as_of_date,
                    EMISchedule.paid_amount < EMISchedule.emi_amount
                )
            )
            .order_by(EMISchedule.due_date)
            .limit(1)
        )
        emi = result.scalar_one_or_none()
        
        if emi:
            return (as_of_date - emi.due_date).days
        
        return 0
    
    async def _get_overdue_amount(self, loan_id: int) -> Decimal:
        """Get total overdue amount"""
        from app.models.payment import EMISchedule
        
        result = await self.db.execute(
            select(EMISchedule)
            .where(
                and_(
                    EMISchedule.loan_id == loan_id,
                    EMISchedule.paid_amount < EMISchedule.emi_amount
                )
            )
        )
        emis = result.scalars().all()
        
        total = sum(emi.emi_amount - emi.paid_amount for emi in emis)
        return Decimal(total)
    
    async def _log_audit(
        self,
        actor_type: str,
        action: str,
        entity_type: str = None,
        entity_id: int = None,
        description: str = None,
        metadata: dict = None,
        old_value: dict = None,
        new_value: dict = None,
        rule_applied: str = None
    ):
        """Create audit log entry"""
        audit_log = AuditLog(
            actor_type=actor_type,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            description=description,
            metadata=json.dumps(metadata) if metadata else None,
            old_value=json.dumps(old_value) if old_value else None,
            new_value=json.dumps(new_value) if new_value else None,
            rule_applied=rule_applied
        )
        
        self.db.add(audit_log)
        await self.db.flush()
