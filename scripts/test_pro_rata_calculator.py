"""
Test Pro-Rata Interest Calculator Endpoint
"""

import requests
import json
from datetime import date

BASE_URL = "http://localhost:8000/api/v1"


# Login as admin to get token
def login():
    response = requests.post(
        f"{BASE_URL}/auth/login",
        data={"username": "admin@cooperative.com", "password": "admin123"},
    )
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        print(f"Login failed: {response.status_code}")
        print(response.text)
        return None


def test_calculate_interest_for_days(token):
    """Test calculating interest for any loan type and amount"""

    test_cases = [
        {
            "name": "SAO Loan - 30 days",
            "data": {
                "loan_type": "sao",
                "principal_amount": 100000,
                "days": 30,
                "disbursement_date": "2024-12-01",
            },
        },
        {
            "name": "AMUL Loan - 95 days",
            "data": {"loan_type": "amul_loan", "principal_amount": 120000, "days": 95},
        },
        {
            "name": "SAO Loan - 400 days (crosses 1 year)",
            "data": {"loan_type": "sao", "principal_amount": 150000, "days": 400},
        },
        {
            "name": "AMUL Loan - 1 year exactly",
            "data": {"loan_type": "amul_loan", "principal_amount": 200000, "days": 365},
        },
        {
            "name": "SAO Loan - 500 days",
            "data": {"loan_type": "sao", "principal_amount": 75000, "days": 500},
        },
    ]

    headers = {"Authorization": f"Bearer {token}"}

    print("\n" + "=" * 80)
    print("TESTING PRO-RATA INTEREST CALCULATOR")
    print("=" * 80)

    for test in test_cases:
        print(f"\n\n[TEST] Test Case: {test['name']}")
        print("-" * 80)

        response = requests.post(
            f"{BASE_URL}/smart-calculator/calculate/interest-for-days",
            headers=headers,
            json=test["data"],
        )

        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            result = response.json()

            print(f"\n[SUCCESS]")
            print(f"\nLoan Type: {result['loan_type'].upper()} - {result['loan_name']}")
            print(f"Principal Amount: Rs {result['principal_amount']:,.2f}")
            print(
                f"Period: {result['days']} days ({result['start_date']} to {result['end_date']})"
            )
            print(f"\nINTEREST CALCULATION:")
            print(f"  Total Interest: Rs {result['total_interest']:,.2f}")
            print(f"  Daily Interest: Rs {result['daily_interest']:,.2f}")
            print(f"  Total Amount Payable: Rs {result['total_amount']:,.2f}")

            print(f"\nRATE BREAKDOWN:")
            for i, period in enumerate(result["rate_breakdown"], 1):
                print(
                    f"  Period {i}: {period['days']} days @ {period['rate']}% = Rs {period['interest']:,.2f}"
                )

            print(
                f"\nBase Rate: {result['base_rate']}% | Rate After Year: {result['rate_after_year']}%"
            )

        else:
            print(f"\n[ERROR]")
            try:
                error_data = response.json()
                print(f"Error Detail: {error_data}")
            except:
                print(f"Response: {response.text}")


if __name__ == "__main__":
    print("Logging in...")
    token = login()

    if token:
        print("[OK] Login successful!")
        test_calculate_interest_for_days(token)
        print("\n" + "=" * 80)
        print("ALL TESTS COMPLETED")
        print("=" * 80)
    else:
        print("[ERROR] Failed to login")
