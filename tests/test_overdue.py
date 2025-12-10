"""
Tests for overdue EMI tracking
"""
import pytest
from httpx import AsyncClient
from datetime import date, timedelta


@pytest.mark.asyncio
async def test_check_overdue_emis(client: AsyncClient, test_employee, test_db):
    """Test checking overdue EMIs"""
    from app.services.auth_service import AuthService
    
    # Get employee token
    token = AuthService.create_access_token(
        user_id=test_employee.id,
        email=test_employee.email,
        role=test_employee.role
    )
    headers = {"Authorization": f"Bearer {token}"}
    
    response = await client.post(
        "/api/v1/overdue/check-overdue",
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "message" in data


@pytest.mark.asyncio
async def test_get_overdue_summary(client: AsyncClient, test_employee):
    """Test getting overdue summary"""
    from app.services.auth_service import AuthService
    
    token = AuthService.create_access_token(
        user_id=test_employee.id,
        email=test_employee.email,
        role=test_employee.role
    )
    headers = {"Authorization": f"Bearer {token}"}
    
    response = await client.get(
        "/api/v1/overdue/summary",
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert "total_overdue_loans" in data


@pytest.mark.asyncio
async def test_farmer_cannot_check_overdue(client: AsyncClient, auth_headers):
    """Test that farmers cannot access overdue check endpoint"""
    response = await client.post(
        "/api/v1/overdue/check-overdue",
        headers=auth_headers
    )
    assert response.status_code == 403
