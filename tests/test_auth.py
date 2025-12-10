"""
Tests for authentication endpoints
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_user(client: AsyncClient):
    """Test user registration"""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@example.com",
            "mobile": "9876543210",
            "password": "NewUser@123",
            "full_name": "New User",
            "role": "farmer"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["full_name"] == "New User"
    assert "id" in data


@pytest.mark.asyncio
async def test_login_user(client: AsyncClient, test_user):
    """Test user login"""
    response = await client.post(
        "/api/v1/auth/login",
        data={
            "username": "test@example.com",
            "password": "Test@123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_get_current_user(client: AsyncClient, auth_headers):
    """Test get current user profile"""
    response = await client.get(
        "/api/v1/auth/me",
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"


@pytest.mark.asyncio
async def test_invalid_credentials(client: AsyncClient):
    """Test login with invalid credentials"""
    response = await client.post(
        "/api/v1/auth/login",
        data={
            "username": "wrong@example.com",
            "password": "WrongPassword"
        }
    )
    assert response.status_code == 401
