"""
Pydantic schemas for User model
"""
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime
from app.models.user import UserRole


# Base schemas
class UserBase(BaseModel):
    email: EmailStr
    mobile: Optional[str] = Field(None, max_length=15)
    full_name: str = Field(..., min_length=1, max_length=100)
    role: UserRole = UserRole.FARMER
    state: str = "Telangana"
    preferred_language: str = "english"


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    
    # Optional fields - can be added later via profile update
    aadhaar_number: Optional[str] = Field(None, min_length=12, max_length=12)
    pan_number: Optional[str] = Field(None, min_length=10, max_length=10)
    address: Optional[str] = None
    village: Optional[str] = None
    mandal: Optional[str] = None
    district: Optional[str] = None
    pincode: Optional[str] = Field(None, min_length=6, max_length=6)
    land_area: Optional[str] = None
    crop_type: Optional[str] = None
    branch_id: Optional[int] = None
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    mobile: Optional[str] = None
    full_name: Optional[str] = None
    address: Optional[str] = None
    village: Optional[str] = None
    mandal: Optional[str] = None
    district: Optional[str] = None
    pincode: Optional[str] = None
    land_area: Optional[str] = None
    crop_type: Optional[str] = None
    preferred_language: Optional[str] = None
    is_active: Optional[bool] = None


class UserInDBBase(UserBase):
    id: int
    farmer_id: Optional[str] = None
    is_active: bool
    is_verified: bool
    aadhaar_number: Optional[str] = None
    pan_number: Optional[str] = None
    address: Optional[str] = None
    village: Optional[str] = None
    mandal: Optional[str] = None
    district: Optional[str] = None
    pincode: Optional[str] = None
    land_area: Optional[str] = None
    crop_type: Optional[str] = None
    branch_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class User(UserInDBBase):
    """Schema for returning user data"""
    pass


class UserWithPassword(UserInDBBase):
    """Schema including hashed password (internal use only)"""
    hashed_password: str


# Branch schemas
class BranchBase(BaseModel):
    name: str
    code: str = Field(..., min_length=1, max_length=20)
    address: str
    district: str
    state: str = "Telangana"
    pincode: Optional[str] = None
    contact_number: Optional[str] = None
    email: Optional[EmailStr] = None
    ifsc_code: Optional[str] = Field(None, min_length=11, max_length=11)


class BranchCreate(BranchBase):
    manager_id: Optional[int] = None


class BranchUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    contact_number: Optional[str] = None
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None
    manager_id: Optional[int] = None


class Branch(BranchBase):
    id: int
    is_active: bool
    manager_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Login/Auth schemas
class LoginRequest(BaseModel):
    username: str  # Can be email or mobile
    password: str


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=8)
    
    @validator('new_password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v
