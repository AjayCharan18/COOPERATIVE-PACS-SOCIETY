"""
Script to import existing loans that were disbursed before the system was created.
This allows you to add historical loan data into the system.
"""

import asyncio
import sys
from pathlib import Path
from datetime import datetime, date
from decimal import Decimal

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.models.loan import Loan, LoanTypeConfig


async def import_existing_loans():
    """
    Import existing loans into the system.
    
    EXAMPLE LOAN DATA FORMAT:
    You can modify the loans_data list below with your actual loan data.
    """
    
    # ============================================================================
    # MODIFY THIS SECTION WITH YOUR EXISTING LOAN DATA
    # ============================================================================
    
    loans_data = [
        # Example 1: SAO Loan
        {
            "farmer_email": "farmer@dccb.com",  # Email of existing farmer in system
            "loan_type_name": "SAO",  # Must match exact loan type name
            "principal_amount": 50000,
            "interest_rate": 7.0,
            "tenure_months": 12,
            "disbursement_date": "2024-06-15",  # Format: YYYY-MM-DD
            "purpose": "Crop cultivation - Paddy",
            "status": "active",  # Options: active, disbursed, pending, closed, defaulted
            "loan_number": None,  # Leave None to auto-generate
        },
        # Example 2: Long Term EMI Loan
        {
            "farmer_email": "farmer@dccb.com",
            "loan_type_name": "Long Term EMI Loan",
            "principal_amount": 200000,
            "interest_rate": 9.5,
            "tenure_months": 60,
            "disbursement_date": "2023-01-10",
            "purpose": "Farm equipment purchase",
            "status": "active",
            "loan_number": None,
        },
        # Add more loans here...
    ]
    
    # ============================================================================
    # END OF MODIFICATION SECTION
    # ============================================================================
    
    async with AsyncSessionLocal() as db:
        print("\n" + "="*80)
        print("IMPORTING EXISTING LOANS INTO SYSTEM")
        print("="*80)
        
        imported_count = 0
        failed_count = 0
        
        for idx, loan_data in enumerate(loans_data, 1):
            try:
                print(f"\n[{idx}/{len(loans_data)}] Processing loan for {loan_data['farmer_email']}...")
                
                # 1. Find the farmer
                result = await db.execute(
                    select(User).where(User.email == loan_data['farmer_email'])
                )
                farmer = result.scalar_one_or_none()
                
                if not farmer:
                    print(f"   ❌ ERROR: Farmer with email '{loan_data['farmer_email']}' not found!")
                    print(f"   → Create farmer account first or check email spelling")
                    failed_count += 1
                    continue
                
                # 2. Find the loan type
                result = await db.execute(
                    select(LoanTypeConfig).where(
                        LoanTypeConfig.display_name == loan_data['loan_type_name'],
                        LoanTypeConfig.is_active == True
                    )
                )
                loan_type = result.scalar_one_or_none()
                
                if not loan_type:
                    print(f"   ❌ ERROR: Loan type '{loan_data['loan_type_name']}' not found!")
                    print(f"   → Available loan types: SAO, Long Term EMI Loan, Rythu Bandhu, Rythu Nethany, Amul Dairy Loan")
                    failed_count += 1
                    continue
                
                # 3. Parse disbursement date
                disbursement_date = datetime.strptime(loan_data['disbursement_date'], "%Y-%m-%d").date()
                
                # 4. Generate loan number if not provided
                loan_number = loan_data.get('loan_number')
                if not loan_number:
                    # Format: LN-YYYYMMDD-XXXX
                    result = await db.execute(select(Loan))
                    loan_count = len(result.scalars().all())
                    loan_number = f"LN-{disbursement_date.strftime('%Y%m%d')}-{loan_count + 1:04d}"
                
                # 5. Calculate EMI based on loan type
                P = Decimal(str(loan_data['principal_amount']))
                r = Decimal(str(loan_data['interest_rate'])) / Decimal('100') / Decimal('12')  # Monthly rate
                n = loan_data['tenure_months']
                
                # Using reducing balance for EMI calculation (standard)
                if r > 0:
                    emi_amount = (P * r * (1 + r)**n) / ((1 + r)**n - 1)
                else:
                    emi_amount = P / n
                
                # 6. Calculate maturity date
                from dateutil.relativedelta import relativedelta
                maturity_date = disbursement_date + relativedelta(months=n)
                
                # 7. Calculate first EMI date (typically 1 month after disbursement)
                first_emi_date = disbursement_date + relativedelta(months=1)
                
                # 8. Create the loan
                new_loan = Loan(
                    loan_number=loan_number,
                    farmer_id=farmer.id,
                    branch_id=farmer.branch_id,
                    loan_type_config_id=loan_type.id,
                    principal_amount=float(P),
                    interest_rate=loan_data['interest_rate'],
                    tenure_months=n,
                    emi_amount=float(emi_amount),
                    disbursement_date=disbursement_date,
                    maturity_date=maturity_date,
                    first_emi_date=first_emi_date,
                    status=loan_data['status'],
                    purpose=loan_data['purpose'],
                    outstanding_principal=float(P),  # Initially full amount
                    total_paid=0.0,
                    created_at=datetime.utcnow()
                )
                
                db.add(new_loan)
                await db.commit()
                await db.refresh(new_loan)
                
                print(f"   ✅ SUCCESS: Loan {loan_number} imported!")
                print(f"      Farmer: {farmer.full_name} ({farmer.email})")
                print(f"      Type: {loan_type.display_name}")
                print(f"      Amount: ₹{P:,.2f}")
                print(f"      EMI: ₹{emi_amount:,.2f}")
                print(f"      Disbursement: {disbursement_date}")
                print(f"      Maturity: {maturity_date}")
                
                imported_count += 1
                
            except Exception as e:
                print(f"   ❌ ERROR: Failed to import loan - {str(e)}")
                import traceback
                traceback.print_exc()
                failed_count += 1
                await db.rollback()
        
        print("\n" + "="*80)
        print("IMPORT SUMMARY")
        print("="*80)
        print(f"✅ Successfully imported: {imported_count} loans")
        print(f"❌ Failed: {failed_count} loans")
        print(f"📊 Total processed: {len(loans_data)} loans")
        print("="*80 + "\n")


async def list_available_farmers():
    """Helper function to list all farmers in the system"""
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(User).where(User.role == 'farmer')
        )
        farmers = result.scalars().all()
        
        print("\n" + "="*80)
        print("AVAILABLE FARMERS IN SYSTEM")
        print("="*80)
        
        if not farmers:
            print("❌ No farmers found! Create farmer accounts first.")
        else:
            for idx, farmer in enumerate(farmers, 1):
                print(f"{idx}. {farmer.full_name}")
                print(f"   Email: {farmer.email}")
                print(f"   Mobile: {farmer.mobile}")
                print(f"   Farmer ID: {farmer.farmer_id}")
                print()
        
        print("="*80 + "\n")


async def list_available_loan_types():
    """Helper function to list all active loan types"""
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(LoanTypeConfig).where(LoanTypeConfig.is_active == True)
        )
        loan_types = result.scalars().all()
        
        print("\n" + "="*80)
        print("AVAILABLE LOAN TYPES")
        print("="*80)
        
        for idx, lt in enumerate(loan_types, 1):
            print(f"{idx}. {lt.display_name}")
            print(f"   Loan Type: {lt.loan_type.value}")
            print(f"   Interest Rate: {lt.default_interest_rate}%")
            print(f"   Calculation: {lt.interest_calculation_type.value}")
            print(f"   Default Tenure: {lt.default_tenure_months} months")
            print()
        
        print("="*80 + "\n")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Import existing loans into the system")
    parser.add_argument(
        "--list-farmers",
        action="store_true",
        help="List all farmers in the system"
    )
    parser.add_argument(
        "--list-loan-types",
        action="store_true",
        help="List all available loan types"
    )
    parser.add_argument(
        "--import-loans",
        action="store_true",
        dest="import_loans",
        help="Import loans (modify loans_data in script first)"
    )
    
    args = parser.parse_args()
    
    if args.list_farmers:
        asyncio.run(list_available_farmers())
    elif args.list_loan_types:
        asyncio.run(list_available_loan_types())
    elif args.import_loans:
        asyncio.run(import_existing_loans())
    else:
        print("\n" + "="*80)
        print("EXISTING LOANS IMPORT TOOL")
        print("="*80)
        print("\nUsage:")
        print("  1. List farmers:     python scripts/import_existing_loans.py --list-farmers")
        print("  2. List loan types:  python scripts/import_existing_loans.py --list-loan-types")
        print("  3. Import loans:     python scripts/import_existing_loans.py --import-loans")
        print("\nSteps:")
        print("  1. First, list available farmers and loan types")
        print("  2. Edit the 'loans_data' list in this script with your data")
        print("  3. Run with --import flag to import the loans")
        print("="*80 + "\n")
