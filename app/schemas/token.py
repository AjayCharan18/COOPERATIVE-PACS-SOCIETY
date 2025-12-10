"""
Pydantic schemas for authentication tokens
"""

from pydantic import BaseModel
from typing import Optional
from app.models.user import UserRole


class Token(BaseModel):
    """Access token response"""

    access_token: str
    token_type: str = "bearer"
    expires_in: Optional[int] = None  # None for non-expiring tokens


class TokenData(BaseModel):
    """Data encoded in JWT token"""

    user_id: int
    email: str
    role: UserRole
    exp: Optional[int] = None


class RefreshTokenRequest(BaseModel):
    """Request to refresh token"""

    refresh_token: str
