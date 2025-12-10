"""Test admin dashboard endpoint"""

import requests
import json

# Login as admin first
login_response = requests.post(
    "http://localhost:8000/api/v1/auth/login",
    json={"username": "admin@dccb.com", "password": "admin123"},
)

if login_response.status_code != 200:
    print(f"Login failed: {login_response.text}")
    exit(1)

token = login_response.json()["access_token"]
print(f"✅ Logged in successfully")

# Call dashboard endpoint
headers = {"Authorization": f"Bearer {token}"}
response = requests.get(
    "http://localhost:8000/api/v1/dashboard/admin/system-overview", headers=headers
)

print(f"\nStatus Code: {response.status_code}")
print(f"Response:")
print(
    json.dumps(
        response.json() if response.status_code == 200 else response.text, indent=2
    )
)
