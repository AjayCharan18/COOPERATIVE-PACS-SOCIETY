"""
Authentication schemas for OTP-based password reset
"""

from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional


class PasswordResetRequest(BaseModel):
    """Request password reset OTP"""

    identifier: str = Field(..., description="Email or mobile number")
    method: str = Field(default="email", description="Method: 'email' or 'sms'")

    @validator("method")
    def validate_method(cls, v):
        if v not in ["email", "sms"]:
            raise ValueError('Method must be either "email" or "sms"')
        return v


class VerifyOTPRequest(BaseModel):
    """Verify OTP and reset password"""

    identifier: str = Field(..., description="Email or mobile number")
    otp: str = Field(..., min_length=6, max_length=6, description="6-digit OTP")
    new_password: str = Field(..., min_length=8, description="New password")


class ResendOTPRequest(BaseModel):
    """Resend OTP"""

    identifier: str = Field(..., description="Email or mobile number")
    method: str = Field(default="email", description="Method: 'email' or 'sms'")

    @validator("method")
    def validate_method(cls, v):
        if v not in ["email", "sms"]:
            raise ValueError('Method must be either "email" or "sms"')
        return v


class FarmerRegistrationRequest(BaseModel):
    """Employee creates farmer account"""

    email: EmailStr
    mobile: str = Field(..., regex=r"^\d{10}$", description="10-digit mobile number")
    full_name: str = Field(..., min_length=3)
    aadhaar_number: Optional[str] = Field(None, regex=r"^\d{12}$")
    village: Optional[str] = None
    mandal: Optional[str] = None
    district: str
    state: str
    land_area: Optional[str] = None
    crop_type: Optional[str] = None
    branch_id: Optional[int] = None

    # Temporary password will be auto-generated and sent via email/SMS
    send_credentials_via: str = Field(
        default="email", description="'email' or 'sms' or 'both'"
    )

    @validator("send_credentials_via")
    def validate_send_method(cls, v):
        if v not in ["email", "sms", "both"]:
            raise ValueError('send_credentials_via must be "email", "sms", or "both"')
        return v
