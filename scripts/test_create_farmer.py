import requests
import json

# Login first
login_response = requests.post(
    "http://localhost:8000/api/v1/auth/login",
    data={"username": "ajaycharan1807@gmail.com", "password": "ajay123"},
)

if login_response.status_code == 200:
    token = login_response.json()["access_token"]
    print("✅ Login successful")
    print(f"Token: {token[:50]}...")

    # Try to create farmer
    farmer_data = {
        "email": "testfarmer@example.com",
        "full_name": "Test Farmer",
        "mobile": "9876543210",
        "branch_id": 1,
        "district": "Hyderabad",
        "state": "Telangana",
        "aadhaar_number": "123456789012",
        "village": "Test Village",
        "land_area": "5.5",
        "crop_type": "Cotton",
        "send_credentials_via": "email",
    }

    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    print("\n📤 Sending farmer data:")
    print(json.dumps(farmer_data, indent=2))

    create_response = requests.post(
        "http://localhost:8000/api/v1/auth/create-farmer-account",
        headers=headers,
        json=farmer_data,
    )

    print(f"\n📥 Response Status: {create_response.status_code}")
    print(f"Response Body:")
    print(json.dumps(create_response.json(), indent=2))

else:
    print(f"❌ Login failed: {login_response.status_code}")
    print(login_response.text)
