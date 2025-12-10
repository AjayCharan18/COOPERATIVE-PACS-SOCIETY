"""
Test Loan Comparison with Rate Switching
"""

import requests
import json
import sys

# Set UTF-8 encoding for Windows console
if sys.platform == "win32":
    import codecs

    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.buffer, "strict")
    sys.stderr = codecs.getwriter("utf-8")(sys.stderr.buffer, "strict")

BASE_URL = "http://localhost:8000/api/v1"


def login():
    response = requests.post(
        f"{BASE_URL}/auth/login",
        data={"username": "admin@cooperative.com", "password": "admin123"},
    )
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        print(f"Login failed: {response.status_code}")
        return None


def test_loan_comparison(token):
    """Test loan comparison with different tenures"""

    test_cases = [
        {
            "name": "12 months (within 1 year - no rate switch)",
            "data": {
                "principal_amount": 100000,
                "tenure_months": 12,
                "loan_types": [
                    "sao",
                    "long_term_emi",
                    "rythu_bandhu",
                    "rythu_nethany",
                    "amul_loan",
                ],
            },
        },
        {
            "name": "20 months (crosses 1 year - rate switch applies)",
            "data": {
                "principal_amount": 100000,
                "tenure_months": 20,
                "loan_types": [
                    "sao",
                    "long_term_emi",
                    "rythu_bandhu",
                    "rythu_nethany",
                    "amul_loan",
                ],
            },
        },
        {
            "name": "24 months (2 years - significant rate impact)",
            "data": {
                "principal_amount": 100000,
                "tenure_months": 24,
                "loan_types": ["sao", "rythu_bandhu", "amul_loan"],
            },
        },
    ]

    headers = {"Authorization": f"Bearer {token}"}

    print("\n" + "=" * 100)
    print("TESTING LOAN COMPARISON WITH RATE SWITCHING")
    print("=" * 100)

    for test in test_cases:
        print(f"\n\n[TEST] {test['name']}")
        print("-" * 100)

        response = requests.post(
            f"{BASE_URL}/smart-calculator/compare/loan-schemes",
            headers=headers,
            json=test["data"],
        )

        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            result = response.json()

            print(f"\n[SUCCESS]")
            print(f"\nPrincipal: Rs {result['principal']:,.2f}")
            print(f"Tenure: {result['tenure_months']} months")
            print(f"\nRecommendation: {result['recommendation']}")

            print(f"\nDETAILED COMPARISON:")
            print("-" * 100)

            for i, comp in enumerate(result["comparisons"], 1):
                print(f"\n{i}. {comp['name']}")
                print(f"   Loan Type: {comp['loan_type']}")

                if comp.get("rate_after_year"):
                    print(f"   Base Rate: {comp['base_rate']}% (First year)")
                    print(f"   Rate After Year: {comp['rate_after_year']}%")
                    print(f"   Blended Rate: {comp['interest_rate']:.2f}%")
                else:
                    print(f"   Interest Rate: {comp['interest_rate']}%")

                print(f"   Monthly EMI: Rs {comp['emi_amount']:,.2f}")
                print(f"   Total Interest: Rs {comp['total_interest']:,.2f}")
                print(f"   Total Payment: Rs {comp['total_payment']:,.2f}")

                if i == 1:
                    print(f"   ** BEST OPTION **")

            # Show savings comparison
            if len(result["comparisons"]) > 1:
                best = result["comparisons"][0]
                worst = result["comparisons"][-1]
                savings = worst["total_interest"] - best["total_interest"]
                print(f"\n[SAVINGS ANALYSIS]")
                print(
                    f"Best: {best['name']} - Rs {best['total_interest']:,.2f} interest"
                )
                print(
                    f"Worst: {worst['name']} - Rs {worst['total_interest']:,.2f} interest"
                )
                print(f"Potential Savings: Rs {savings:,.2f}")

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
        test_loan_comparison(token)
        print("\n" + "=" * 100)
        print("ALL TESTS COMPLETED")
        print("=" * 100)
    else:
        print("[ERROR] Failed to login")
