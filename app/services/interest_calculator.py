"""
Interest calculation service for different loan types
"""
from datetime import date, timedelta
from typing import Optional, Tuple
import math

from app.models.loan import Loan, InterestCalculationType


class InterestCalculator:
    """Service for calculating interest for loans"""
    
    @staticmethod
    def calculate_prorata_interest(
        principal: float,
        annual_rate: float,
        from_date: date,
        to_date: date
    ) -> float:
        """
        Calculate pro-rata daily interest
        
        Example: ₹10,000 for 1 month 10 days at 7% per annum
        Days = 40
        Interest = 10000 * 0.07 * (40/365) = ₹76.71
        """
        days = (to_date - from_date).days
        if days <= 0:
            return 0.0
        
        daily_rate = annual_rate / 365.0 / 100.0
        interest = principal * daily_rate * days
        
        return round(interest, 2)
    
    @staticmethod
    def calculate_simple_interest(
        principal: float,
        annual_rate: float,
        months: int
    ) -> float:
        """
        Calculate simple interest
        Interest = P * R * T / 100
        where T is in years
        """
        years = months / 12.0
        interest = (principal * annual_rate * years) / 100.0
        return round(interest, 2)
    
    @staticmethod
    def calculate_compound_interest(
        principal: float,
        annual_rate: float,
        months: int,
        compounding_frequency: int = 12  # Monthly
    ) -> float:
        """
        Calculate compound interest
        A = P(1 + r/n)^(nt)
        CI = A - P
        """
        n = compounding_frequency
        t = months / 12.0
        r = annual_rate / 100.0
        
        amount = principal * math.pow(1 + (r / n), n * t)
        compound_interest = amount - principal
        
        return round(compound_interest, 2)
    
    @staticmethod
    def calculate_emi(
        principal: float,
        annual_rate: float,
        tenure_months: int
    ) -> float:
        """
        Calculate EMI using reducing balance method
        EMI = [P * r * (1+r)^n] / [(1+r)^n - 1]
        where r = monthly interest rate
        """
        if tenure_months == 0:
            return principal
        
        monthly_rate = (annual_rate / 12.0) / 100.0
        
        if monthly_rate == 0:
            return principal / tenure_months
        
        emi = (
            principal * monthly_rate * math.pow(1 + monthly_rate, tenure_months)
        ) / (
            math.pow(1 + monthly_rate, tenure_months) - 1
        )
        
        return round(emi, 2)
    
    @staticmethod
    def generate_emi_schedule(
        principal: float,
        annual_rate: float,
        tenure_months: int,
        start_date: date
    ) -> list[dict]:
        """
        Generate complete EMI amortization schedule
        Returns list of dicts with installment details
        """
        emi = InterestCalculator.calculate_emi(principal, annual_rate, tenure_months)
        monthly_rate = (annual_rate / 12.0) / 100.0
        
        schedule = []
        outstanding = principal
        
        for month in range(1, tenure_months + 1):
            interest_component = outstanding * monthly_rate
            principal_component = emi - interest_component
            
            # Last month adjustment to handle rounding
            if month == tenure_months:
                principal_component = outstanding
                emi_amount = outstanding + interest_component
            else:
                emi_amount = emi
            
            outstanding -= principal_component
            
            due_date = start_date + timedelta(days=30 * month)
            
            schedule.append({
                "installment_number": month,
                "due_date": due_date,
                "emi_amount": round(emi_amount, 2),
                "principal_component": round(principal_component, 2),
                "interest_component": round(interest_component, 2),
                "outstanding_principal": round(max(0, outstanding), 2)
            })
        
        return schedule
    
    @staticmethod
    def calculate_penal_interest(
        outstanding_amount: float,
        penal_rate: float,
        overdue_days: int
    ) -> float:
        """Calculate penal interest on overdue amount"""
        if overdue_days <= 0:
            return 0.0
        
        daily_penal_rate = penal_rate / 365.0 / 100.0
        penal_interest = outstanding_amount * daily_penal_rate * overdue_days
        
        return round(penal_interest, 2)
    
    @staticmethod
    def calculate_total_payable(
        principal: float,
        annual_rate: float,
        tenure_months: int,
        calculation_type: InterestCalculationType
    ) -> Tuple[float, float]:
        """
        Calculate total amount payable and interest
        Returns (total_payable, total_interest)
        """
        if calculation_type == InterestCalculationType.SIMPLE:
            interest = InterestCalculator.calculate_simple_interest(
                principal, annual_rate, tenure_months
            )
        elif calculation_type == InterestCalculationType.COMPOUND:
            interest = InterestCalculator.calculate_compound_interest(
                principal, annual_rate, tenure_months
            )
        elif calculation_type == InterestCalculationType.EMI:
            emi = InterestCalculator.calculate_emi(
                principal, annual_rate, tenure_months
            )
            total_payable = emi * tenure_months
            interest = total_payable - principal
            return (round(total_payable, 2), round(interest, 2))
        else:  # PRORATA_DAILY
            # For pro-rata, approximate based on tenure
            from_date = date.today()
            to_date = from_date + timedelta(days=30 * tenure_months)
            interest = InterestCalculator.calculate_prorata_interest(
                principal, annual_rate, from_date, to_date
            )
        
        total_payable = principal + interest
        return (round(total_payable, 2), round(interest, 2))
    
    @staticmethod
    async def recalculate_loan_outstanding(loan: Loan) -> dict:
        """
        Recalculate all outstanding amounts for a loan
        considering payments and accrued interest
        """
        # This would be called periodically or on payment
        # Calculate accrued interest till date
        if loan.disbursement_date:
            accrued_interest = InterestCalculator.calculate_prorata_interest(
                loan.outstanding_principal,
                loan.interest_rate,
                loan.disbursement_date,
                date.today()
            )
        else:
            accrued_interest = 0.0
        
        # Calculate penal interest if overdue
        penal_interest = 0.0
        if loan.maturity_date < date.today():
            overdue_days = (date.today() - loan.maturity_date).days
            if overdue_days > 90:  # Apply penalty after 90 days
                penal_interest = InterestCalculator.calculate_penal_interest(
                    loan.outstanding_principal + loan.outstanding_interest,
                    loan.penal_interest_rate,
                    overdue_days - 90
                )
        
        return {
            "outstanding_principal": loan.outstanding_principal,
            "outstanding_interest": accrued_interest,
            "penal_interest": penal_interest,
            "total_outstanding": loan.outstanding_principal + accrued_interest + penal_interest
        }
