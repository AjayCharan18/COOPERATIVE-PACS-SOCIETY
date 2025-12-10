import asyncio
import httpx

async def test_calculator_loans_api():
    """Test the smart calculator loans endpoint"""
    
    # First, login to get a token
    async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
        # Login as admin
        print("Logging in as admin...")
        login_response = await client.post("/api/v1/auth/login", json={
            "email": "admin@dccb.com",
            "password": "admin123"
        })
        
        if login_response.status_code != 200:
            print(f"Login failed: {login_response.status_code}")
            print(login_response.text)
            return
        
        token = login_response.json()["access_token"]
        print(f"✓ Login successful, token: {token[:20]}...")
        
        # Now test the loans endpoint
        print("\nFetching calculator loans...")
        headers = {"Authorization": f"Bearer {token}"}
        loans_response = await client.get("/api/v1/smart-calculator/loans", headers=headers)
        
        print(f"Status: {loans_response.status_code}")
        print(f"Response: {loans_response.json()}")

if __name__ == "__main__":
    asyncio.run(test_calculator_loans_api())
