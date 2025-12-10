# Importing Existing Loans - Quick Guide

## Overview
If people already have loans before the system was created, you can import them using two methods:

---

## Method 1: Direct Script Import (Small number of loans)

### Step 1: List available farmers and loan types
```powershell
cd "D:\DCCB LOAN MANAGEMENT"
& "D:\DCCB LOAN MANAGEMENT\venv\Scripts\Activate.ps1"
$env:PYTHONPATH = "D:\DCCB LOAN MANAGEMENT"

# List all farmers
python scripts/import_existing_loans.py --list-farmers

# List all loan types
python scripts/import_existing_loans.py --list-loan-types
```

### Step 2: Edit the script
Open `scripts/import_existing_loans.py` and modify the `loans_data` list (around line 26):

```python
loans_data = [
    {
        "farmer_email": "farmer@dccb.com",  # Email from step 1
        "loan_type_name": "SAO (Short Term Agricultural Operation)",  # Exact display name from step 1
        "principal_amount": 50000,
        "interest_rate": 7.0,
        "tenure_months": 12,
        "disbursement_date": "2024-06-15",  # YYYY-MM-DD
        "purpose": "Crop cultivation",
        "status": "active",  # active, disbursed, closed, defaulted
        "loan_number": None,  # Auto-generated if None
    },
    # Add more loans...
]
```

### Step 3: Import the loans
```powershell
python scripts/import_existing_loans.py --import-loans
```

---

## Method 2: CSV Bulk Import (Large number of loans)

### Step 1: Create sample CSV template
```powershell
cd "D:\DCCB LOAN MANAGEMENT"
& "D:\DCCB LOAN MANAGEMENT\venv\Scripts\Activate.ps1"
$env:PYTHONPATH = "D:\DCCB LOAN MANAGEMENT"

python scripts/import_loans_from_csv.py --create-sample
```

This creates `scripts/sample_loans_import.csv`

### Step 2: Edit the CSV file
Open `scripts/sample_loans_import.csv` in Excel or any text editor:

| farmer_email | loan_type_name | principal_amount | interest_rate | tenure_months | disbursement_date | purpose | status |
|--------------|----------------|------------------|---------------|---------------|-------------------|---------|--------|
| farmer@dccb.com | SAO (Short Term Agricultural Operation) | 50000 | 7.0 | 12 | 2024-06-15 | Crop cultivation | active |
| farmer2@dccb.com | Long Term EMI Loan | 200000 | 9.5 | 60 | 2023-01-10 | Equipment | active |

**Add as many rows as needed!**

### Step 3: Import from CSV
```powershell
python scripts/import_loans_from_csv.py --file scripts/sample_loans_import.csv
```

---

## Important Notes

### Loan Status Options
- `active` - Loan is currently active and EMIs are being paid
- `disbursed` - Loan disbursed but first EMI not yet due
- `closed` - Loan fully repaid
- `defaulted` - Loan in default/overdue

### Available Loan Types
1. **SAO (Short Term Agricultural Operation)** - Short term agricultural loan
2. **Long Term EMI Loan** - Long term with EMI
3. **Rythu Bandhu** - Farmer support scheme
4. **Rythu Nethany** - Agricultural scheme
5. **Amul Dairy Loan** - Dairy farming loan

**Use the exact display name** shown when you run `--list-loan-types`

### Date Format
Always use `YYYY-MM-DD` format (e.g., 2024-06-15)

### Before Importing
1. **Create farmer accounts first** - All farmers must exist in the system
2. **Check loan types** - Use the loan types that exist in your system
3. **Verify data** - Double-check amounts, dates, and farmer emails

---

## What the Script Does

For each imported loan, the system will:
1. ✅ Find the farmer by email
2. ✅ Find the matching loan type
3. ✅ Auto-generate loan number (format: LN-YYYYMMDD-XXXX)
4. ✅ Calculate EMI based on loan type settings
5. ✅ Calculate maturity date
6. ✅ Set outstanding principal to full amount
7. ✅ Create the loan record

---

## Example: Complete Import Process

```powershell
# 1. Activate environment
cd "D:\DCCB LOAN MANAGEMENT"
& "D:\DCCB LOAN MANAGEMENT\venv\Scripts\Activate.ps1"
$env:PYTHONPATH = "D:\DCCB LOAN MANAGEMENT"

# 2. List farmers (to get their emails)
python scripts/import_existing_loans.py --list-farmers

# 3. List loan types (to get exact names)
python scripts/import_existing_loans.py --list-loan-types

# 4. Create CSV template
python scripts/import_loans_from_csv.py --create-sample

# 5. Edit scripts/sample_loans_import.csv with your data

# 6. Import the loans
python scripts/import_loans_from_csv.py --file scripts/sample_loans_import.csv

# 7. Verify in the application
# Login and check the Loans section
```

---

## Troubleshooting

### Error: "Farmer not found"
- Check the farmer email is correct
- Create the farmer account first if it doesn't exist

### Error: "Loan type not found"
- Check the exact loan type name (case-sensitive)
- Use `--list-loan-types` to see available types

### Error: "Invalid date format"
- Use YYYY-MM-DD format (e.g., 2024-06-15)
- Don't use DD/MM/YYYY or MM/DD/YYYY

### EMI seems wrong
- The system auto-calculates EMI based on:
  - Principal amount
  - Interest rate (if provided, otherwise uses loan type default)
  - Tenure months
  - Loan type calculation method (simple/reducing balance)

---

## After Import

Once loans are imported:
1. 📊 They appear in the Loans section
2. 💳 EMI schedules are automatically created
3. 📧 Farmers can see their loans in their dashboard
4. 💰 Payments can be recorded against these loans
5. 📈 Reports will include these loans

---

## Need Help?

Run the scripts without arguments for usage instructions:
```powershell
python scripts/import_existing_loans.py
python scripts/import_loans_from_csv.py
```
