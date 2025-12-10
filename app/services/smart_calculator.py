"""
Smart Automation Calculator Service
Advanced loan calculation system with AI assistance
"""

from datetime import datetime, timedelta, date
from typing import Dict, List, Optional, Tuple
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
import logging
import json
import math

from app.models.loan import Loan, LoanStatus, InterestCalculationType, EMISchedule
from app.models.payment import Payment
from app.models.loan_ledger import LoanLedger
from app.core.config import settings

logger = logging.getLogger(__name__)

# Try to configure Gemini AI, but don't fail if not available
try:
    import google.generativeai as genai

    if hasattr(settings, "GEMINI_API_KEY") and settings.GEMINI_API_KEY:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        GEMINI_AVAILABLE = True
    else:
        GEMINI_AVAILABLE = False
        logger.warning("Gemini API key not configured")
except ImportError:
    GEMINI_AVAILABLE = False
    logger.warning("Gemini AI package not installed")


class SmartCalculator:
    """Smart loan calculator with caching, simulation, and AI assistance"""

    def __init__(self, db: AsyncSession, redis_client=None):
        self.db = db
        self.redis = redis_client

    # ==================== INSTANT CALCULATIONS ====================

    async def calculate_pro_rata_interest(
        self,
        loan_id: int,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None,
    ) -> Dict:
        """
        Calculate pro-rata (daily) interest for exact date range
        ✔ Automatically switches rate if loan crosses 1 year
        ✔ Computes exact interest for ANY period

        Example: 1 month 10 days, 95 days overdue, etc.
        """
        loan = await self._get_loan(loan_id)

        # Ensure we have valid dates
        if loan.disbursement_date is None:
            raise ValueError("Loan has no disbursement date")

        from_date = from_date or loan.disbursement_date
        to_date = to_date or date.today()

        total_days = (to_date - from_date).days
        principal = await self._get_outstanding_principal(loan_id, from_date)

        # Check if loan crosses 1 year mark
        loan_age_at_start = (from_date - loan.disbursement_date).days
        loan_age_at_end = (to_date - loan.disbursement_date).days
        one_year_days = 365

        crosses_one_year = loan_age_at_start < one_year_days <= loan_age_at_end

        if crosses_one_year:
            # Split calculation: days before and after 1 year
            # One year anniversary is after 365 complete days (on day 366)
            one_year_date = loan.disbursement_date + timedelta(days=365)
            days_before = (one_year_date - from_date).days
            days_after = (to_date - one_year_date).days

            rate_before = await self._get_rate_for_period(loan, from_date)
            # Pass date after 365 days to get the higher rate
            rate_after = await self._get_rate_for_period(
                loan, one_year_date + timedelta(days=1)
            )

            interest_before = self._calculate_daily_interest(
                principal, rate_before, days_before
            )
            interest_after = self._calculate_daily_interest(
                principal, rate_after, days_after
            )

            total_interest = interest_before + interest_after

            explanation = (
                f"Pro-rata Interest Calculation (Crosses 1 Year)\n"
                f"{'='*50}\n"
                f"Period: {from_date.strftime('%d-%b-%Y')} to {to_date.strftime('%d-%b-%Y')} ({total_days} days)\n"
                f"Principal: ₹{principal:,.2f}\n\n"
                f"Period 1 (Before 1 Year): {days_before} days @ {rate_before}%\n"
                f"  Interest = ₹{principal:,.2f} × {rate_before}% / 365 × {days_before}\n"
                f"  Interest = ₹{interest_before:,.2f}\n\n"
                f"Period 2 (After 1 Year): {days_after} days @ {rate_after}%\n"
                f"  Interest = ₹{principal:,.2f} × {rate_after}% / 365 × {days_after}\n"
                f"  Interest = ₹{interest_after:,.2f}\n\n"
                f"Total Interest: ₹{total_interest:,.2f}"
            )

            return {
                "loan_id": loan_id,
                "from_date": from_date.isoformat(),
                "to_date": to_date.isoformat(),
                "total_days": total_days,
                "principal": float(principal),
                "crosses_one_year": True,
                "periods": [
                    {
                        "days": days_before,
                        "rate": float(rate_before),
                        "interest": float(interest_before),
                    },
                    {
                        "days": days_after,
                        "rate": float(rate_after),
                        "interest": float(interest_after),
                    },
                ],
                "total_interest": float(total_interest),
                "explanation": explanation,
            }
        else:
            # Simple calculation: single rate
            annual_rate = await self._get_rate_for_period(loan, from_date)
            interest = self._calculate_daily_interest(
                principal, annual_rate, total_days
            )

            explanation = (
                f"Pro-rata Interest Calculation\n"
                f"{'='*50}\n"
                f"Period: {from_date.strftime('%d-%b-%Y')} to {to_date.strftime('%d-%b-%Y')} ({total_days} days)\n"
                f"Principal: ₹{principal:,.2f}\n"
                f"Annual Rate: {annual_rate}%\n"
                f"Daily Rate: {annual_rate / 365:.6f}%\n\n"
                f"Interest = Principal × (Annual Rate / 365) × Days\n"
                f"Interest = ₹{principal:,.2f} × ({annual_rate}% / 365) × {total_days}\n"
                f"Interest = ₹{interest:,.2f}"
            )

            return {
                "loan_id": loan_id,
                "from_date": from_date.isoformat(),
                "to_date": to_date.isoformat(),
                "total_days": total_days,
                "principal": float(principal),
                "annual_rate": float(annual_rate),
                "crosses_one_year": False,
                "total_interest": float(interest),
                "explanation": explanation,
            }

    async def calculate_interest_today_tomorrow_future(self, loan_id: int) -> Dict:
        """
        Calculate what farmer owes:
        - Today
        - Tomorrow
        - After 10 days
        - Next month

        Very useful for PACS employees!
        """
        loan = await self._get_loan(loan_id)
        today = date.today()
        tomorrow = today + timedelta(days=1)
        after_10_days = today + timedelta(days=10)
        next_month = today + timedelta(days=30)

        outstanding = await self._get_outstanding_principal(loan_id, today)

        # Calculate interest for each period
        interest_today = Decimal(0)  # Already calculated till yesterday
        interest_tomorrow = await self._calculate_interest_till_date(loan_id, tomorrow)
        interest_10_days = await self._calculate_interest_till_date(
            loan_id, after_10_days
        )
        interest_next_month = await self._calculate_interest_till_date(
            loan_id, next_month
        )

        return {
            "loan_id": loan_id,
            "outstanding_principal": float(outstanding),
            "projections": {
                "today": {
                    "date": today.isoformat(),
                    "interest_accrued": float(interest_today),
                    "total_payable": float(outstanding + interest_today),
                },
                "tomorrow": {
                    "date": tomorrow.isoformat(),
                    "interest_accrued": float(interest_tomorrow),
                    "total_payable": float(outstanding + interest_tomorrow),
                },
                "after_10_days": {
                    "date": after_10_days.isoformat(),
                    "interest_accrued": float(interest_10_days),
                    "total_payable": float(outstanding + interest_10_days),
                },
                "next_month": {
                    "date": next_month.isoformat(),
                    "interest_accrued": float(interest_next_month),
                    "total_payable": float(outstanding + interest_next_month),
                },
            },
            "explanation": (
                f"Interest Projection for Loan #{loan_id}\n"
                f"{'='*50}\n"
                f"Outstanding Principal: ₹{outstanding:,.2f}\n\n"
                f"Today ({today.strftime('%d-%b-%Y')}): ₹{outstanding + interest_today:,.2f}\n"
                f"Tomorrow ({tomorrow.strftime('%d-%b-%Y')}): ₹{outstanding + interest_tomorrow:,.2f}\n"
                f"After 10 days ({after_10_days.strftime('%d-%b-%Y')}): ₹{outstanding + interest_10_days:,.2f}\n"
                f"Next month ({next_month.strftime('%d-%b-%Y')}): ₹{outstanding + interest_next_month:,.2f}\n"
            ),
        }

    async def calculate_overdue_with_penalty(
        self, loan_id: int, overdue_amount: Decimal, overdue_days: int
    ) -> Dict:
        """
        Calculate overdue interest with penalty

        Example: Farmer delayed EMI by 35 days
        - Normal interest
        - Overdue interest
        - Penalty (if >90 days)
        """
        loan = await self._get_loan(loan_id)

        # Calculate overdue interest (higher rate)
        overdue_rate = loan.interest_rate + Decimal(2)  # +2% penalty rate
        overdue_interest = self._calculate_daily_interest(
            overdue_amount, overdue_rate, overdue_days
        )

        # Tiered penalty
        penalty = Decimal(0)
        penalty_tier = None

        if overdue_days > 90:
            penalty = overdue_amount * Decimal("0.06")  # 6% penalty
            penalty_tier = ">90 days (6% penalty)"
        elif overdue_days > 30:
            penalty = overdue_amount * Decimal("0.04")  # 4% penalty
            penalty_tier = "31-90 days (4% penalty)"
        elif overdue_days > 0:
            penalty = overdue_amount * Decimal("0.02")  # 2% penalty
            penalty_tier = "0-30 days (2% penalty)"

        total_due = overdue_amount + overdue_interest + penalty

        return {
            "loan_id": loan_id,
            "overdue_amount": float(overdue_amount),
            "overdue_days": overdue_days,
            "overdue_rate": float(overdue_rate),
            "overdue_interest": float(overdue_interest),
            "penalty_tier": penalty_tier,
            "penalty_amount": float(penalty),
            "total_due": float(total_due),
            "breakdown": {
                "principal_overdue": float(overdue_amount),
                "interest_on_overdue": float(overdue_interest),
                "penalty": float(penalty),
            },
            "explanation": (
                f"Overdue Calculation\n"
                f"{'='*50}\n"
                f"Overdue Amount: ₹{overdue_amount:,.2f}\n"
                f"Overdue Days: {overdue_days} days\n"
                f"Penalty Tier: {penalty_tier}\n\n"
                f"Overdue Interest: ₹{overdue_interest:,.2f} ({overdue_rate}% for {overdue_days} days)\n"
                f"Penalty: ₹{penalty:,.2f}\n"
                f"Total Due: ₹{total_due:,.2f}"
            ),
        }

    async def generate_full_loan_ledger(self, loan_id: int) -> Dict:
        """
        Generate complete loan ledger like banks

        | Date | Description | Credit | Debit | Interest | Balance |

        Includes:
        - Opening balance
        - Interest accrued
        - Payments received
        - EMI adjustments
        - Closing balance
        """
        loan = await self._get_loan(loan_id)

        # Get all payments
        payments_result = await self.db.execute(
            select(Payment)
            .where(Payment.loan_id == loan_id)
            .order_by(Payment.payment_date)
        )
        payments = payments_result.scalars().all()

        # Get all EMI schedules
        emi_result = await self.db.execute(
            select(EMISchedule)
            .where(EMISchedule.loan_id == loan_id)
            .order_by(EMISchedule.due_date)
        )
        emis = emi_result.scalars().all()

        # Build ledger entries
        ledger_entries = []
        running_balance = loan.principal_amount

        # Opening entry
        ledger_entries.append(
            {
                "date": loan.disbursement_date.isoformat(),
                "description": "Loan Disbursed",
                "credit": 0,
                "debit": float(loan.principal_amount),
                "interest": 0,
                "balance": float(running_balance),
            }
        )

        # Process EMIs and payments chronologically
        all_events = []

        for emi in emis:
            all_events.append(
                {
                    "date": emi.due_date,
                    "type": "emi_due",
                    "amount": emi.emi_amount,
                    "emi": emi,
                }
            )

        for payment in payments:
            all_events.append(
                {
                    "date": payment.payment_date,
                    "type": "payment",
                    "amount": payment.amount,
                    "payment": payment,
                }
            )

        # Sort by date
        all_events.sort(key=lambda x: x["date"])

        # Generate ledger
        for event in all_events:
            if event["type"] == "emi_due":
                emi = event["emi"]
                interest_component = emi.interest_amount
                principal_component = emi.principal_amount

                ledger_entries.append(
                    {
                        "date": event["date"].isoformat(),
                        "description": f"EMI #{emi.installment_number} Due",
                        "credit": 0,
                        "debit": float(emi.emi_amount),
                        "interest": float(interest_component),
                        "balance": float(running_balance),
                    }
                )

            elif event["type"] == "payment":
                payment = event["payment"]
                running_balance -= payment.amount

                ledger_entries.append(
                    {
                        "date": event["date"].isoformat(),
                        "description": f"Payment Received - {payment.payment_method}",
                        "credit": float(payment.amount),
                        "debit": 0,
                        "interest": 0,
                        "balance": float(running_balance),
                    }
                )

        # Calculate totals
        total_credit = sum(e["credit"] for e in ledger_entries)
        total_debit = sum(e["debit"] for e in ledger_entries)
        total_interest = sum(e["interest"] for e in ledger_entries)

        return {
            "loan_id": loan_id,
            "farmer_name": loan.farmer.full_name if loan.farmer else "N/A",
            "loan_type": loan.loan_type,
            "principal_amount": float(loan.principal_amount),
            "ledger_entries": ledger_entries,
            "summary": {
                "total_debits": total_debit,
                "total_credits": total_credit,
                "total_interest_accrued": total_interest,
                "current_balance": float(running_balance),
                "entries_count": len(ledger_entries),
            },
            "generated_at": datetime.now().isoformat(),
        }

    async def generate_emi_amortization_table(self, loan_id: int) -> Dict:
        """
        Generate EMI amortization table (like HDFC/Union Bank)

        Shows for each month:
        - Monthly EMI
        - Principal vs Interest split
        - Outstanding balance
        - Closing balance
        - Total payable
        - Total interest paid
        """
        loan = await self._get_loan(loan_id)

        if not loan.emi_amount or loan.emi_amount == 0:
            return {"error": "This is not an EMI-based loan", "loan_id": loan_id}

        # Ensure all values are Decimal
        principal = (
            loan.principal_amount
            if isinstance(loan.principal_amount, Decimal)
            else Decimal(str(loan.principal_amount))
        )
        interest_rate = (
            loan.interest_rate
            if isinstance(loan.interest_rate, Decimal)
            else Decimal(str(loan.interest_rate))
        )
        emi = (
            loan.emi_amount
            if isinstance(loan.emi_amount, Decimal)
            else Decimal(str(loan.emi_amount))
        )

        monthly_rate = interest_rate / Decimal(1200)  # Annual % to monthly decimal
        tenure = loan.tenure_months

        amortization_schedule = []
        outstanding = principal
        total_interest_paid = Decimal(0)

        for month in range(1, tenure + 1):
            # Calculate interest for this month
            interest_component = outstanding * monthly_rate
            principal_component = emi - interest_component

            # Update outstanding
            outstanding -= principal_component
            total_interest_paid += interest_component

            # Handle last EMI adjustment
            if month == tenure:
                principal_component += outstanding
                outstanding = Decimal(0)

            amortization_schedule.append(
                {
                    "installment_number": month,
                    "emi_amount": float(emi),
                    "principal_component": float(principal_component),
                    "interest_component": float(interest_component),
                    "outstanding_balance": float(max(outstanding, Decimal(0))),
                    "total_interest_paid": float(total_interest_paid),
                }
            )

        total_payment = emi * Decimal(tenure)

        return {
            "loan_id": loan_id,
            "principal_amount": float(principal),
            "emi_amount": float(emi),
            "tenure_months": tenure,
            "interest_rate": float(interest_rate),
            "amortization_schedule": amortization_schedule,
            "summary": {
                "total_payment": float(total_payment),
                "total_principal": float(principal),
                "total_interest": float(total_interest_paid),
                "interest_percentage": float((total_interest_paid / principal) * 100),
            },
            "explanation": (
                f"EMI Amortization Table\n"
                f"{'='*50}\n"
                f"Principal: ₹{float(principal):,.2f}\n"
                f"EMI: ₹{float(emi):,.2f} × {tenure} months\n"
                f"Total Payment: ₹{float(total_payment):,.2f}\n"
                f"Total Interest: ₹{float(total_interest_paid):,.2f}\n"
                f"Interest %: {float((total_interest_paid / principal) * 100):.2f}%"
            ),
        }

    async def get_loan_snapshot_on_date(self, loan_id: int, as_of_date: date) -> Dict:
        """
        Get EMI schedule and outstanding balance as of any date
        Shows what the loan looks like on that specific date
        """
        loan = await self._get_loan(loan_id)

        # Get all EMIs
        result = await self.db.execute(
            select(EMISchedule)
            .where(EMISchedule.loan_id == loan_id)
            .order_by(EMISchedule.installment_number)
        )
        emis = result.scalars().all()

        # Get payments up to as_of_date
        payments_result = await self.db.execute(
            select(Payment).where(
                and_(Payment.loan_id == loan_id, Payment.payment_date <= as_of_date)
            )
        )
        payments = payments_result.scalars().all()
        total_paid = sum(p.amount for p in payments)

        # Calculate outstanding
        outstanding = loan.principal_amount - total_paid

        # Mark EMIs as paid/unpaid based on due date and payments
        schedule_status = []
        for emi in emis:
            is_due = emi.due_date <= as_of_date
            status = "paid" if emi.paid_amount >= emi.emi_amount else "pending"
            if is_due and status == "pending":
                status = "overdue"

            schedule_status.append(
                {
                    "installment_number": emi.installment_number,
                    "due_date": emi.due_date.isoformat(),
                    "emi_amount": float(emi.emi_amount),
                    "paid_amount": float(emi.paid_amount),
                    "outstanding": float(emi.emi_amount - emi.paid_amount),
                    "status": status,
                    "is_due": is_due,
                }
            )

        return {
            "loan_id": loan_id,
            "as_of_date": as_of_date.isoformat(),
            "principal_amount": float(loan.principal_amount),
            "total_paid": float(total_paid),
            "outstanding_balance": float(outstanding),
            "emi_schedule": schedule_status,
            "explanation": f"As of {as_of_date}, outstanding balance is ₹{outstanding:,.2f}",
        }

    # ==================== SIMULATION / WHAT-IF ====================

    async def simulate_early_payment(
        self, loan_id: int, payment_amount: Decimal, payment_date: date
    ) -> Dict:
        """
        Simulate effect of early payment on loan
        Shows new interest, EMI, and maturity date
        """
        loan = await self._get_loan(loan_id)
        current_outstanding = await self._get_outstanding_principal(
            loan_id, payment_date
        )

        # Calculate new outstanding after payment
        new_outstanding = current_outstanding - payment_amount

        # Calculate interest saved
        old_total_interest = await self._calculate_total_interest(loan)

        # Simulate new EMI and tenure
        new_emi = await self._calculate_emi(
            new_outstanding, loan.interest_rate, loan.tenure_months
        )

        # Calculate new maturity date
        remaining_months = loan.tenure_months - self._get_months_elapsed(
            loan, payment_date
        )
        new_maturity = payment_date + timedelta(days=remaining_months * 30)

        interest_saved = old_total_interest - (
            new_emi * remaining_months - new_outstanding
        )

        return {
            "simulation_type": "early_payment",
            "loan_id": loan_id,
            "payment_amount": float(payment_amount),
            "payment_date": payment_date.isoformat(),
            "current_outstanding": float(current_outstanding),
            "new_outstanding": float(new_outstanding),
            "current_emi": float(loan.emi_amount) if loan.emi_amount else 0,
            "new_emi": float(new_emi),
            "current_maturity": (
                loan.maturity_date.isoformat() if loan.maturity_date else None
            ),
            "new_maturity": new_maturity.isoformat(),
            "interest_saved": float(interest_saved),
            "explanation": (
                f"Early payment of ₹{payment_amount:,.2f} will:\n"
                f"• Reduce outstanding from ₹{current_outstanding:,.2f} to ₹{new_outstanding:,.2f}\n"
                f"• Reduce EMI from ₹{loan.emi_amount:,.2f} to ₹{new_emi:,.2f}\n"
                f"• Save ₹{interest_saved:,.2f} in interest\n"
                f"• New maturity date: {new_maturity.strftime('%d-%b-%Y')}"
            ),
        }

    async def simulate_prepayment(
        self,
        loan_id: int,
        prepayment_amount: Decimal,
        prepayment_date: date,
        reduce_emi: bool = True,
    ) -> Dict:
        """
        Simulate prepayment - either reduce EMI or reduce tenure
        """
        loan = await self._get_loan(loan_id)
        current_outstanding = await self._get_outstanding_principal(
            loan_id, prepayment_date
        )

        new_outstanding = current_outstanding - prepayment_amount
        remaining_months = loan.tenure_months - self._get_months_elapsed(
            loan, prepayment_date
        )

        if reduce_emi:
            # Keep tenure same, reduce EMI
            new_emi = await self._calculate_emi(
                new_outstanding, loan.interest_rate, remaining_months
            )
            new_tenure = remaining_months
        else:
            # Keep EMI same, reduce tenure
            new_emi = loan.emi_amount
            new_tenure = await self._calculate_tenure(
                new_outstanding, loan.interest_rate, new_emi
            )

        new_maturity = prepayment_date + timedelta(days=new_tenure * 30)
        tenure_reduced = remaining_months - new_tenure

        return {
            "simulation_type": "prepayment",
            "loan_id": loan_id,
            "prepayment_amount": float(prepayment_amount),
            "prepayment_date": prepayment_date.isoformat(),
            "option": "reduce_emi" if reduce_emi else "reduce_tenure",
            "current_outstanding": float(current_outstanding),
            "new_outstanding": float(new_outstanding),
            "current_emi": float(loan.emi_amount),
            "new_emi": float(new_emi),
            "current_tenure": remaining_months,
            "new_tenure": new_tenure,
            "tenure_reduced_months": tenure_reduced if not reduce_emi else 0,
            "emi_reduced": float(loan.emi_amount - new_emi) if reduce_emi else 0,
            "new_maturity": new_maturity.isoformat(),
            "explanation": self._explain_prepayment(
                prepayment_amount,
                reduce_emi,
                loan.emi_amount,
                new_emi,
                remaining_months,
                new_tenure,
            ),
        }

    # ==================== RATE SWITCHING & ROLLOVERS ====================

    async def apply_rate_switching(self, loan_id: int, as_of_date: date) -> Dict:
        """
        Apply automatic rate switching for loans > 1 year
        Records the date and rule used
        """
        loan = await self._get_loan(loan_id)

        # Calculate loan age
        days_elapsed = (as_of_date - loan.disbursement_date).days
        years_elapsed = days_elapsed / 365

        current_rate = loan.interest_rate
        new_rate = current_rate
        rule_applied = None

        # Apply rate switching logic
        if years_elapsed > 1:
            # Example: Increase rate by 0.5% after 1 year
            new_rate = current_rate + Decimal("0.5")
            rule_applied = "RATE_INCREASE_AFTER_1YR"

        switch_date = loan.disbursement_date + timedelta(days=365)

        # Log to ledger if rate changed
        if new_rate != current_rate:
            await self._log_rate_change(
                loan_id, current_rate, new_rate, as_of_date, rule_applied
            )

        return {
            "loan_id": loan_id,
            "as_of_date": as_of_date.isoformat(),
            "days_elapsed": days_elapsed,
            "years_elapsed": round(years_elapsed, 2),
            "current_rate": float(current_rate),
            "new_rate": float(new_rate),
            "rate_changed": new_rate != current_rate,
            "rule_applied": rule_applied,
            "switch_date": (
                switch_date.isoformat() if new_rate != current_rate else None
            ),
            "explanation": (
                (
                    f"Rate switched from {current_rate}% to {new_rate}% "
                    f"because loan passed 365 days on {switch_date.strftime('%d-%b-%Y')}"
                )
                if new_rate != current_rate
                else "No rate change required"
            ),
        }

    # ==================== PENALTY & TIERED PENALTY ====================

    async def calculate_penalty(
        self, loan_id: int, overdue_days: int, overdue_amount: Decimal
    ) -> Dict:
        """
        Apply tiered penalty rates based on overdue buckets
        0-30 days: 2% penalty
        31-90 days: 4% penalty
        >90 days: 6% penalty
        """
        # Determine penalty tier
        if overdue_days <= 30:
            penalty_rate = Decimal("2.0")
            tier = "0-30 days"
        elif overdue_days <= 90:
            penalty_rate = Decimal("4.0")
            tier = "31-90 days"
        else:
            penalty_rate = Decimal("6.0")
            tier = ">90 days"

        # Calculate penalty
        penalty_amount = overdue_amount * (penalty_rate / Decimal(100))

        return {
            "loan_id": loan_id,
            "overdue_days": overdue_days,
            "overdue_amount": float(overdue_amount),
            "tier": tier,
            "penalty_rate": float(penalty_rate),
            "penalty_amount": float(penalty_amount),
            "total_due": float(overdue_amount + penalty_amount),
            "explanation": (
                f"Overdue for {overdue_days} days (Tier: {tier})\n"
                f"Penalty Rate: {penalty_rate}%\n"
                f"Penalty on ₹{overdue_amount:,.2f} = ₹{penalty_amount:,.2f}\n"
                f"Total Due: ₹{overdue_amount + penalty_amount:,.2f}"
            ),
        }

    # ==================== AI-ASSISTED EXPLANATION ====================

    async def explain_with_ai(
        self, calculation_data: Dict, language: str = "english"
    ) -> str:
        """
        Use Gemini AI to explain complex calculations in simple terms
        Supports local languages for farmers
        """
        try:
            model = genai.GenerativeModel("gemini-pro")

            prompt = f"""
            You are a helpful banking assistant explaining loan calculations to a farmer.
            
            Calculation Data:
            {json.dumps(calculation_data, indent=2)}
            
            Please explain this loan calculation in simple, easy-to-understand {language} language.
            Focus on:
            1. What the numbers mean
            2. How it affects the farmer
            3. What actions they should take
            
            Keep it brief (3-4 sentences) and friendly.
            """

            response = model.generate_content(prompt)
            return response.text

        except Exception as e:
            logger.error(f"AI explanation failed: {str(e)}")
            return calculation_data.get(
                "explanation", "Calculation completed successfully"
            )

    async def suggest_repayment_plan(
        self, loan_id: int, farmer_income: Optional[Decimal] = None
    ) -> Dict:
        """
        Use AI to suggest optimal repayment plans based on farmer's situation
        """
        loan = await self._get_loan(loan_id)
        outstanding = await self._get_outstanding_principal(loan_id, date.today())

        try:
            model = genai.GenerativeModel("gemini-pro")

            prompt = f"""
            As a financial advisor for cooperative banks, suggest a repayment plan.
            
            Loan Details:
            - Principal: ₹{loan.principal_amount}
            - Outstanding: ₹{outstanding}
            - Interest Rate: {loan.interest_rate}%
            - Current EMI: ₹{loan.emi_amount}
            - Farmer's Monthly Income: ₹{farmer_income or 'Not provided'}
            
            Suggest:
            1. Optimal EMI amount (should be 30-40% of income)
            2. Whether to make a prepayment
            3. Timeline for full repayment
            4. Any additional tips
            
            Format as actionable advice.
            """

            response = model.generate_content(prompt)

            return {
                "loan_id": loan_id,
                "ai_suggestion": response.text,
                "current_emi": float(loan.emi_amount),
                "outstanding": float(outstanding),
                "generated_at": datetime.now().isoformat(),
            }

        except Exception as e:
            logger.error(f"AI suggestion failed: {str(e)}")
            return {
                "loan_id": loan_id,
                "error": "Could not generate AI suggestion",
                "message": str(e),
            }

    # ==================== HELPER METHODS ====================

    async def _get_loan(self, loan_id: int) -> Loan:
        """Get loan by ID"""
        result = await self.db.execute(select(Loan).where(Loan.id == loan_id))
        loan = result.scalar_one_or_none()
        if not loan:
            raise ValueError(f"Loan {loan_id} not found")
        return loan

    async def _get_outstanding_principal(
        self, loan_id: int, as_of_date: date
    ) -> Decimal:
        """Calculate outstanding principal as of a specific date"""
        loan = await self._get_loan(loan_id)

        # Ensure principal_amount is Decimal
        principal = (
            loan.principal_amount
            if isinstance(loan.principal_amount, Decimal)
            else Decimal(str(loan.principal_amount))
        )

        # Get total payments up to as_of_date
        result = await self.db.execute(
            select(Payment).where(
                and_(Payment.loan_id == loan_id, Payment.payment_date <= as_of_date)
            )
        )
        payments = result.scalars().all()
        total_paid = (
            sum(
                (
                    Decimal(str(p.amount))
                    if not isinstance(p.amount, Decimal)
                    else p.amount
                )
                for p in payments
            )
            if payments
            else Decimal("0")
        )

        return principal - total_paid

    async def _get_applicable_rate(self, loan: Loan, as_of_date: date) -> Decimal:
        """Get applicable interest rate considering rate switching"""
        days_elapsed = (as_of_date - loan.disbursement_date).days

        if days_elapsed > 365:
            # Apply higher rate after 1 year
            return loan.interest_rate + Decimal("0.5")

        return loan.interest_rate

    async def _get_rate_for_period(self, loan: Loan, period_date: date) -> Decimal:
        """Get interest rate applicable for a specific period"""
        days_since_disbursement = (period_date - loan.disbursement_date).days

        # Ensure loan interest_rate is Decimal
        base_rate = (
            loan.interest_rate
            if isinstance(loan.interest_rate, Decimal)
            else Decimal(str(loan.interest_rate))
        )

        # Rate switching logic based on loan type
        # First year: days 0-365 (inclusive) use base rate
        # After 1 year: day 366 onwards use higher rate
        if days_since_disbursement <= 365:
            # First year rate
            return base_rate
        else:
            # After 1 year, apply higher rate (example: +2% for most schemes)
            # This should be based on actual loan type configuration
            loan_type_value = (
                loan.loan_type.value
                if hasattr(loan.loan_type, "value")
                else str(loan.loan_type)
            )

            if loan_type_value == "sao":
                return Decimal("13.75")  # SAO after 1 year
            elif loan_type_value in ["rythu_bandhu", "rythu_nethany"]:
                return Decimal("14.5")  # Rythu schemes after 1 year
            elif loan_type_value == "long_term_emi":
                return Decimal("12.75")  # Long term after 1 year
            elif loan_type_value == "amul_loan":
                return Decimal("14.0")  # Amul after 1 year
            else:
                return base_rate + Decimal("2.0")  # Default +2%

    def _calculate_daily_interest(
        self, principal: Decimal, annual_rate: Decimal, days: int
    ) -> Decimal:
        """Calculate interest for given days"""
        # Ensure annual_rate is Decimal
        if not isinstance(annual_rate, Decimal):
            annual_rate = Decimal(str(annual_rate))
        if not isinstance(principal, Decimal):
            principal = Decimal(str(principal))

        daily_rate = annual_rate / Decimal(
            365 * 100
        )  # Convert annual % to daily decimal
        return principal * daily_rate * Decimal(days)

    async def _calculate_interest_till_date(
        self, loan_id: int, till_date: date
    ) -> Decimal:
        """Calculate total interest accrued till a specific date"""
        loan = await self._get_loan(loan_id)

        # Simple calculation from disbursement to till_date
        result = await self.calculate_pro_rata_interest(
            loan_id, loan.disbursement_date, till_date
        )

        return Decimal(str(result.get("total_interest", 0)))

    async def _calculate_emi(
        self, principal: Decimal, annual_rate: Decimal, tenure_months: int
    ) -> Decimal:
        """Calculate EMI using reducing balance method"""
        monthly_rate = annual_rate / Decimal(
            1200
        )  # Annual to monthly, percentage to decimal

        if monthly_rate == 0:
            return principal / tenure_months

        emi = (
            principal
            * monthly_rate
            * ((1 + monthly_rate) ** tenure_months)
            / (((1 + monthly_rate) ** tenure_months) - 1)
        )

        return emi

    async def _calculate_total_interest(self, loan: Loan) -> Decimal:
        """Calculate total interest for the loan"""
        if loan.emi_amount:
            total_payment = loan.emi_amount * loan.tenure_months
            return total_payment - loan.principal_amount
        return Decimal(0)

    def _get_months_elapsed(self, loan: Loan, as_of_date: date) -> int:
        """Get number of months elapsed since disbursement"""
        days = (as_of_date - loan.disbursement_date).days
        return days // 30

    async def _calculate_tenure(
        self, principal: Decimal, annual_rate: Decimal, emi: Decimal
    ) -> int:
        """Calculate tenure in months for given principal, rate, and EMI"""
        monthly_rate = annual_rate / Decimal(1200)

        if monthly_rate == 0:
            return int(principal / emi)

        import math

        tenure = math.log(emi / (emi - principal * monthly_rate)) / math.log(
            1 + float(monthly_rate)
        )

        return int(math.ceil(tenure))

    def _explain_prepayment(
        self,
        amount: Decimal,
        reduce_emi: bool,
        old_emi: Decimal,
        new_emi: Decimal,
        old_tenure: int,
        new_tenure: int,
    ) -> str:
        """Generate explanation for prepayment simulation"""
        if reduce_emi:
            return (
                f"Prepayment of ₹{amount:,.2f} with EMI reduction option:\n"
                f"• EMI reduces from ₹{old_emi:,.2f} to ₹{new_emi:,.2f}\n"
                f"• Monthly savings: ₹{old_emi - new_emi:,.2f}\n"
                f"• Tenure remains {old_tenure} months"
            )
        else:
            months_saved = old_tenure - new_tenure
            return (
                f"Prepayment of ₹{amount:,.2f} with tenure reduction option:\n"
                f"• EMI remains ₹{old_emi:,.2f}\n"
                f"• Tenure reduces from {old_tenure} to {new_tenure} months\n"
                f"• Loan closes {months_saved} months earlier"
            )

    async def compare_loan_schemes(
        self, principal: Decimal, tenure_months: int, loan_types: List[str]
    ) -> Dict:
        """
        Compare multiple loan schemes for the same principal and tenure
        Returns comparison with total interest, EMI, and recommendations
        """
        from app.models.loan import LoanTypeConfig, LoanType

        # Convert principal to Decimal if needed
        if not isinstance(principal, Decimal):
            principal = Decimal(str(principal))

        comparisons = []

        for loan_type_str in loan_types:
            try:
                # Get loan type configuration
                loan_type_enum = LoanType(loan_type_str)
                result = await self.db.execute(
                    select(LoanTypeConfig).where(
                        LoanTypeConfig.loan_type == loan_type_enum
                    )
                )
                config = result.scalar_one_or_none()

                if not config:
                    # Use default values if config not found
                    interest_rate = Decimal("12.0")  # Default rate
                    display_name = loan_type_str.upper()
                    rate_after_year = Decimal("14.0")  # Default rate after 1 year
                else:
                    interest_rate = Decimal(str(config.default_interest_rate))
                    display_name = config.display_name

                    # Get rate after 1 year based on loan type (matching _get_rate_for_period logic)
                    if loan_type_str == "sao":
                        rate_after_year = Decimal("13.75")
                    elif loan_type_str in ["rythu_bandhu", "rythu_nethany"]:
                        rate_after_year = Decimal("14.5")
                    elif loan_type_str == "long_term_emi":
                        rate_after_year = Decimal("12.75")
                    elif loan_type_str == "amul_loan":
                        rate_after_year = Decimal("14.0")
                    else:
                        rate_after_year = interest_rate + Decimal("2.0")

                # Calculate BOTH scenarios: within 1 year AND full tenure with rate switching

                # Scenario 1: If repaid within 12 months (using only base rate)
                if tenure_months <= 12:
                    months_scenario1 = tenure_months
                else:
                    months_scenario1 = 12

                monthly_rate_base = interest_rate / Decimal("1200")
                if monthly_rate_base > 0:
                    factor_base = (1 + monthly_rate_base) ** months_scenario1
                    emi_scenario1 = (
                        principal * monthly_rate_base * factor_base / (factor_base - 1)
                    )
                else:
                    emi_scenario1 = principal / Decimal(months_scenario1)

                total_payable_scenario1 = emi_scenario1 * Decimal(months_scenario1)
                total_interest_scenario1 = total_payable_scenario1 - principal

                # Scenario 2: Full tenure calculation
                if tenure_months <= 12:
                    # Same as scenario 1 if tenure is within 1 year
                    emi = emi_scenario1
                    total_payable = total_payable_scenario1
                    total_interest = total_interest_scenario1
                    display_rate = float(interest_rate)
                    rate_info = f"{display_rate}%"

                else:
                    # Loan crosses 1 year - need blended rate calculation
                    # Calculate weighted average rate based on tenure distribution
                    months_year1 = 12
                    months_year2 = tenure_months - 12

                    # Weighted average rate = (rate1 * months1 + rate2 * months2) / total_months
                    blended_rate = (
                        interest_rate * Decimal(months_year1)
                        + rate_after_year * Decimal(months_year2)
                    ) / Decimal(tenure_months)

                    monthly_rate = blended_rate / Decimal("1200")

                    if monthly_rate > 0:
                        factor = (1 + monthly_rate) ** tenure_months
                        emi = principal * monthly_rate * factor / (factor - 1)
                    else:
                        emi = principal / Decimal(tenure_months)

                    total_payable = emi * Decimal(tenure_months)
                    total_interest = total_payable - principal

                    display_rate = float(blended_rate)
                    rate_info = f"{float(interest_rate)}% (Year 1) → {float(rate_after_year)}% (After 1 Year)"

                # Calculate savings if closed within 1 year
                if tenure_months > 12:
                    savings_early_closure = total_interest - total_interest_scenario1
                    early_closure_benefit = {
                        "months": months_scenario1,
                        "emi": float(emi_scenario1),
                        "total_interest": float(total_interest_scenario1),
                        "total_payment": float(total_payable_scenario1),
                        "savings": float(savings_early_closure),
                    }
                else:
                    early_closure_benefit = None

                comparisons.append(
                    {
                        "loan_type": loan_type_str,
                        "name": display_name,
                        "display_name": display_name,
                        "interest_rate": display_rate,
                        "rate_info": rate_info,
                        "base_rate": float(interest_rate),
                        "rate_after_year": (
                            float(rate_after_year) if tenure_months > 12 else None
                        ),
                        "emi_amount": float(emi),
                        "total_interest": float(total_interest),
                        "total_payable": float(total_payable),
                        "total_payment": float(total_payable),
                        "tenure_months": tenure_months,
                        "early_closure_benefit": early_closure_benefit,
                        "eligible": True,
                    }
                )

            except Exception as e:
                logger.error(f"Error comparing loan type {loan_type_str}: {e}")
                continue

        # Sort by total interest (lowest first)
        comparisons.sort(key=lambda x: x["total_interest"])

        # Add recommendation with early closure benefit
        if comparisons:
            best_scheme = comparisons[0]
            worst_scheme = comparisons[-1]
            savings = worst_scheme["total_interest"] - best_scheme["total_interest"]

            recommendation = (
                f"Best Option: {best_scheme['display_name']}\n"
                f"• Lowest total interest: ₹{best_scheme['total_interest']:,.2f}\n"
                f"• Monthly EMI: ₹{best_scheme['emi_amount']:,.2f}\n"
                f"• Savings vs {worst_scheme['display_name']}: ₹{savings:,.2f}"
            )

            # Add early closure recommendation if applicable
            if tenure_months > 12 and best_scheme.get("early_closure_benefit"):
                early = best_scheme["early_closure_benefit"]
                recommendation += (
                    f"\n\n💡 Early Closure Benefit:\n"
                    f"• If closed within 12 months: Save ₹{early['savings']:,.2f} in interest\n"
                    f"• Total interest (12 months): ₹{early['total_interest']:,.2f}\n"
                    f"• Total payment (12 months): ₹{early['total_payment']:,.2f}"
                )
        else:
            recommendation = "No loan schemes available for comparison"

        # Generate early closure comparison for all schemes
        early_closure_comparison = None
        if tenure_months > 12:
            early_closure_comparison = {
                "message": "Close loan within 1 year to save significantly on interest",
                "comparisons": [
                    {
                        "name": comp["display_name"],
                        "full_tenure_interest": comp["total_interest"],
                        "within_year_interest": comp["early_closure_benefit"][
                            "total_interest"
                        ],
                        "savings": comp["early_closure_benefit"]["savings"],
                    }
                    for comp in comparisons
                    if comp.get("early_closure_benefit")
                ],
            }

        return {
            "principal": float(principal),
            "tenure_months": tenure_months,
            "comparisons": comparisons,
            "recommendation": recommendation,
            "best_scheme": comparisons[0]["loan_type"] if comparisons else None,
            "early_closure_comparison": early_closure_comparison,
        }

    async def get_smart_recommendations(
        self, loan_id: int, farmer_monthly_income: Optional[Decimal] = None
    ) -> Dict:
        """
        Generate AI-powered smart recommendations for loan repayment
        Provides actionable advice based on loan status and farmer income
        """
        loan = await self._get_loan(loan_id)

        # Get current loan details
        outstanding = (
            loan.outstanding_principal
            if isinstance(loan.outstanding_principal, Decimal)
            else Decimal(str(loan.outstanding_principal or loan.principal_amount))
        )
        interest_rate = (
            loan.interest_rate
            if isinstance(loan.interest_rate, Decimal)
            else Decimal(str(loan.interest_rate))
        )

        # Calculate daily interest cost
        daily_interest = outstanding * interest_rate / Decimal("36500")
        monthly_interest = daily_interest * Decimal("30")

        recommendations = []

        # Recommendation 1: Early payment benefits
        if outstanding > Decimal("10000"):
            savings_10k = (
                (Decimal("10000") * interest_rate / Decimal("100"))
                * Decimal(str(loan.tenure_months))
                / Decimal("12")
            )
            recommendations.append(
                {
                    "type": "early_payment",
                    "title": "Part Payment Savings",
                    "description": f"Making a part payment of ₹10,000 now can save you ₹{float(savings_10k):,.2f} in interest over the loan tenure.",
                    "priority": "high",
                    "potential_savings": float(savings_10k),
                }
            )

        # Recommendation 2: Payment timing
        if loan.emi_amount:
            emi_decimal = (
                loan.emi_amount
                if isinstance(loan.emi_amount, Decimal)
                else Decimal(str(loan.emi_amount))
            )
            days_interest_diff = daily_interest * Decimal("5")  # 5 days difference
            recommendations.append(
                {
                    "type": "payment_timing",
                    "title": "Pay EMI Early to Save",
                    "description": f"Paying your EMI 5 days earlier can save you ₹{float(days_interest_diff):,.2f} per month (₹{float(days_interest_diff * 12):,.2f} per year).",
                    "priority": "medium",
                    "potential_savings": float(days_interest_diff * 12),
                }
            )

        # Recommendation 3: Income-based advice
        if farmer_monthly_income:
            income = (
                farmer_monthly_income
                if isinstance(farmer_monthly_income, Decimal)
                else Decimal(str(farmer_monthly_income))
            )
            if loan.emi_amount:
                emi_decimal = (
                    loan.emi_amount
                    if isinstance(loan.emi_amount, Decimal)
                    else Decimal(str(loan.emi_amount))
                )
                emi_ratio = (emi_decimal / income) * Decimal("100")

                if emi_ratio > Decimal("40"):
                    recommendations.append(
                        {
                            "type": "restructure",
                            "title": "Consider Loan Restructuring",
                            "description": f"Your EMI is {float(emi_ratio):.1f}% of your income. Consider restructuring to reduce EMI burden.",
                            "priority": "high",
                            "potential_savings": 0,
                        }
                    )
                elif income - emi_decimal > monthly_interest:
                    surplus = income - emi_decimal
                    extra_payment_benefit = surplus * interest_rate / Decimal("100")
                    recommendations.append(
                        {
                            "type": "extra_payment",
                            "title": "Utilize Surplus Income",
                            "description": f"You have ₹{float(surplus):,.2f} surplus after EMI. Paying extra ₹{float(surplus):,.2f} monthly can save ₹{float(extra_payment_benefit):,.2f} in interest.",
                            "priority": "medium",
                            "potential_savings": float(extra_payment_benefit),
                        }
                    )

        # Recommendation 4: Loan type optimization
        days_since_disbursement = (
            (date.today() - loan.disbursement_date).days
            if loan.disbursement_date
            else 0
        )
        loan_type_value = (
            loan.loan_type.value
            if hasattr(loan.loan_type, "value")
            else str(loan.loan_type)
        )

        if loan_type_value == "sao" and days_since_disbursement > 300:
            recommendations.append(
                {
                    "type": "conversion",
                    "title": "Convert to Long-Term Loan",
                    "description": "Your SAO loan is nearing 1 year. Consider converting to Long-Term EMI to avoid rate increase from 7% to 13.75%.",
                    "priority": "high",
                    "potential_savings": float(
                        (outstanding * Decimal("6.75") / Decimal("100"))
                    ),
                }
            )

        # Sort by priority and potential savings
        priority_order = {"high": 0, "medium": 1, "low": 2}
        recommendations.sort(
            key=lambda x: (
                priority_order.get(x["priority"], 3),
                -x["potential_savings"],
            )
        )

        # Calculate total potential savings
        total_savings = sum(r["potential_savings"] for r in recommendations)

        summary = (
            f"Smart Loan Recommendations for Loan #{loan.loan_number}\n"
            f"{'='*50}\n"
            f"Outstanding: ₹{float(outstanding):,.2f}\n"
            f"Interest Rate: {float(interest_rate)}%\n"
            f"Daily Interest Cost: ₹{float(daily_interest):,.2f}\n"
            f"Monthly Interest Cost: ₹{float(monthly_interest):,.2f}\n\n"
            f"Total Potential Savings: ₹{total_savings:,.2f}"
        )

        return {
            "loan_id": loan_id,
            "loan_number": loan.loan_number,
            "outstanding": float(outstanding),
            "daily_interest_cost": float(daily_interest),
            "monthly_interest_cost": float(monthly_interest),
            "recommendations": recommendations,
            "total_potential_savings": float(total_savings),
            "summary": summary,
        }

    async def _log_rate_change(
        self,
        loan_id: int,
        old_rate: Decimal,
        new_rate: Decimal,
        change_date: date,
        rule: str,
    ):
        """Log rate change to audit trail"""
        # This would log to audit_logs table
        logger.info(
            f"Rate change for loan {loan_id}: "
            f"{old_rate}% -> {new_rate}% on {change_date} (Rule: {rule})"
        )
