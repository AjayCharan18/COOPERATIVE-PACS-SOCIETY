"""
Tests for loan management endpoints
"""
import pytest
from httpx import AsyncClient
from datetime import date, timedelta


@pytest.mark.asyncio
async def test_create_loan(client: AsyncClient, auth_headers, test_user, test_branch):
    """Test loan creation"""
    response = await client.post(
        "/api/v1/loans/",
        headers=auth_headers,
        json={
            "loan_type": "sao",
            "principal_amount": 100000,
            "interest_rate": 7.0,
            "tenure_months": 12,
            "purpose": "Crop cultivation",
            "branch_id": test_branch.id
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["principal_amount"] == 100000
    assert data["interest_rate"] == 7.0
    assert "loan_number" in data


@pytest.mark.asyncio
async def test_get_loans(client: AsyncClient, auth_headers):
    """Test getting list of loans"""
    response = await client.get(
        "/api/v1/loans/",
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_emi_calculation(client: AsyncClient, auth_headers, test_branch):
    """Test EMI loan creation with automatic EMI calculation"""
    response = await client.post(
        "/api/v1/loans/",
        headers=auth_headers,
        json={
            "loan_type": "long_term_emi",
            "principal_amount": 300000,
            "interest_rate": 12.0,
            "tenure_months": 108,
            "purpose": "Long term agriculture",
            "branch_id": test_branch.id
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["emi_amount"] is not None
    assert data["emi_amount"] > 0
    assert data["number_of_emis"] == 108


@pytest.mark.asyncio
async def test_unauthorized_loan_access(client: AsyncClient):
    """Test accessing loans without authentication"""
    response = await client.get("/api/v1/loans/")
    assert response.status_code == 401
