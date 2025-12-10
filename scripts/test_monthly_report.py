"""Test monthly report endpoint"""
import requests
import json

# Login
login_response = requests.post(
    "http://localhost:8000/api/v1/auth/login",
    data={
        "username": "admin@cooperative.com",
        "password": "admin123"
    }
)

if login_response.status_code == 200:
    token = login_response.json()["access_token"]
    print("✅ Login successful\n")
    
    # Test monthly report
    headers = {"Authorization": f"Bearer {token}"}
    
    print("Testing /api/v1/reports/monthly endpoint...")
    response = requests.get(
        "http://localhost:8000/api/v1/reports/monthly",
        headers=headers
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"\nResponse Text:")
    print(response.text)
    
    if response.status_code == 200:
        print(f"\nResponse JSON:")
        print(json.dumps(response.json(), indent=2))
else:
    print(f"❌ Login failed: {login_response.status_code}")
    print(login_response.text)
