"""
Script to import existing loans from a CSV file.
This is useful for bulk import of historical loan data.
"""

import asyncio
import sys
import csv
from pathlib import Path
from datetime import datetime
from decimal import Decimal

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.models.loan import Loan, LoanTypeConfig


async def import_loans_from_csv(csv_file_path: str):
    """
    Import loans from a CSV file.
    
    CSV Format (first row should be headers):
    farmer_email,loan_type_name,principal_amount,interest_rate,tenure_months,disbursement_date,purpose,status
    
    Example:
    farmer@dccb.com,SAO,50000,7.0,12,2024-06-15,Crop cultivation,active
    farmer2@dccb.com,Long Term EMI Loan,200000,9.5,60,2023-01-10,Farm equipment,active
    """
    
    if not Path(csv_file_path).exists():
        print(f"❌ ERROR: CSV file not found: {csv_file_path}")
        return
    
    async with AsyncSessionLocal() as db:
        print("\n" + "="*80)
        print(f"IMPORTING LOANS FROM CSV: {csv_file_path}")
        print("="*80)
        
        imported_count = 0
        failed_count = 0
        
        with open(csv_file_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            loans_data = list(reader)
        
        print(f"\nFound {len(loans_data)} loans in CSV file\n")
        
        for idx, loan_data in enumerate(loans_data, 1):
            try:
                print(f"[{idx}/{len(loans_data)}] Processing loan for {loan_data['farmer_email']}...")
                
                # 1. Find the farmer
                result = await db.execute(
                    select(User).where(User.email == loan_data['farmer_email'].strip())
                )
                farmer = result.scalar_one_or_none()
                
                if not farmer:
                    print(f"   ❌ Farmer '{loan_data['farmer_email']}' not found - SKIPPED")
                    failed_count += 1
                    continue
                
                # 2. Find the loan type
                result = await db.execute(
                    select(LoanTypeConfig).where(
                        LoanTypeConfig.display_name == loan_data['loan_type_name'].strip(),
                        LoanTypeConfig.is_active == True
                    )
                )
                loan_type = result.scalar_one_or_none()
                
                if not loan_type:
                    print(f"   ❌ Loan type '{loan_data['loan_type_name']}' not found - SKIPPED")
                    failed_count += 1
                    continue
                
                # 3. Parse data
                disbursement_date = datetime.strptime(loan_data['disbursement_date'].strip(), "%Y-%m-%d").date()
                principal = Decimal(str(loan_data['principal_amount'].strip()))
                interest_rate = float(loan_data['interest_rate'].strip())
                tenure_months = int(loan_data['tenure_months'].strip())
                
                # 4. Generate loan number
                result = await db.execute(select(Loan))
                loan_count = len(result.scalars().all())
                loan_number = f"LN-{disbursement_date.strftime('%Y%m%d')}-{loan_count + 1:04d}"
                
                # 5. Calculate EMI
                P = principal
                r = Decimal(str(interest_rate)) / Decimal('100') / Decimal('12')
                n = tenure_months
                
                # Using reducing balance for EMI calculation (standard)
                if r > 0:
                    emi_amount = (P * r * (1 + r)**n) / ((1 + r)**n - 1)
                else:
                    emi_amount = P / n
                
                # 6. Calculate dates
                from dateutil.relativedelta import relativedelta
                maturity_date = disbursement_date + relativedelta(months=n)
                first_emi_date = disbursement_date + relativedelta(months=1)
                
                # 7. Create loan
                new_loan = Loan(
                    loan_number=loan_number,
                    farmer_id=farmer.id,
                    branch_id=farmer.branch_id,
                    loan_type_config_id=loan_type.id,
                    principal_amount=float(P),
                    interest_rate=interest_rate,
                    tenure_months=n,
                    emi_amount=float(emi_amount),
                    disbursement_date=disbursement_date,
                    maturity_date=maturity_date,
                    first_emi_date=first_emi_date,
                    status=loan_data.get('status', 'active').strip(),
                    purpose=loan_data.get('purpose', '').strip(),
                    outstanding_principal=float(P),
                    total_paid=0.0,
                    created_at=datetime.utcnow()
                )
                
                db.add(new_loan)
                await db.commit()
                await db.refresh(new_loan)
                
                print(f"   ✅ Imported: {loan_number} - ₹{P:,.2f}")
                imported_count += 1
                
            except Exception as e:
                print(f"   ❌ ERROR: {str(e)}")
                failed_count += 1
                await db.rollback()
        
        print("\n" + "="*80)
        print("IMPORT SUMMARY")
        print("="*80)
        print(f"✅ Successfully imported: {imported_count} loans")
        print(f"❌ Failed: {failed_count} loans")
        print(f"📊 Total in CSV: {len(loans_data)} loans")
        print("="*80 + "\n")


def create_sample_csv():
    """Create a sample CSV template"""
    sample_file = Path(__file__).parent / "sample_loans_import.csv"
    
    with open(sample_file, 'w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        writer.writerow([
            'farmer_email',
            'loan_type_name',
            'principal_amount',
            'interest_rate',
            'tenure_months',
            'disbursement_date',
            'purpose',
            'status'
        ])
        writer.writerow([
            'farmer@dccb.com',
            'SAO',
            '50000',
            '7.0',
            '12',
            '2024-06-15',
            'Crop cultivation - Paddy',
            'active'
        ])
        writer.writerow([
            'farmer@dccb.com',
            'Long Term EMI Loan',
            '200000',
            '9.5',
            '60',
            '2023-01-10',
            'Farm equipment purchase',
            'active'
        ])
    
    print(f"\n✅ Sample CSV created: {sample_file}")
    print(f"\nEdit this file with your loan data, then import it using:")
    print(f"python scripts/import_loans_from_csv.py --file {sample_file}\n")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Import loans from CSV file")
    parser.add_argument(
        "--file",
        type=str,
        help="Path to CSV file containing loan data"
    )
    parser.add_argument(
        "--create-sample",
        action="store_true",
        help="Create a sample CSV template"
    )
    
    args = parser.parse_args()
    
    if args.create_sample:
        create_sample_csv()
    elif args.file:
        asyncio.run(import_loans_from_csv(args.file))
    else:
        print("\n" + "="*80)
        print("BULK LOAN IMPORT FROM CSV")
        print("="*80)
        print("\nUsage:")
        print("  1. Create sample CSV:")
        print("     python scripts/import_loans_from_csv.py --create-sample")
        print("\n  2. Edit the CSV file with your loan data")
        print("\n  3. Import loans:")
        print("     python scripts/import_loans_from_csv.py --file sample_loans_import.csv")
        print("\n" + "="*80 + "\n")
