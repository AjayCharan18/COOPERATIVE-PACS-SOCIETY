"""
User model for authentication and role management
"""

from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    Enum as SQLEnum,
    ForeignKey,
    DateTime,
)
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.db.base import Base, TimestampMixin


class UserRole(str, enum.Enum):
    """User roles in the system"""

    ADMIN = "admin"
    EMPLOYEE = "employee"
    FARMER = "farmer"


class User(Base, TimestampMixin):
    """User model for all system users"""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(
        String(20), unique=True, nullable=True, index=True
    )  # Unique ID for farmers
    email = Column(String, unique=True, index=True, nullable=False)
    mobile = Column(String(15), unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.FARMER)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)

    # Profile fields
    aadhaar_number = Column(String(12), unique=True, nullable=True)
    pan_number = Column(String(10), nullable=True)
    address = Column(String, nullable=True)
    village = Column(String, nullable=True)
    mandal = Column(String, nullable=True)
    district = Column(String, nullable=True)
    state = Column(String, default="Telangana")
    pincode = Column(String(6), nullable=True)

    # Branch assignment (for employees)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True)
    branch = relationship("Branch", back_populates="employees")

    # Farmer specific
    land_area = Column(String, nullable=True)  # In acres
    crop_type = Column(String, nullable=True)

    # Language preference
    preferred_language = Column(String, default="english")

    # Biometric
    fingerprint_data = Column(String, nullable=True)

    # Last login
    last_login = Column(DateTime, nullable=True)

    # Relationships
    branch = relationship(
        "Branch", back_populates="employees", foreign_keys=[branch_id]
    )
    loans = relationship("Loan", back_populates="farmer", foreign_keys="Loan.farmer_id")
    payments = relationship(
        "Payment", back_populates="paid_by_user", foreign_keys="Payment.paid_by_user_id"
    )
    notifications = relationship("Notification", back_populates="user")

    def __repr__(self):
        return f"<User {self.email} ({self.role})>"


class Branch(Base, TimestampMixin):
    """Branch/Office model"""

    __tablename__ = "branches"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    code = Column(String(20), unique=True, nullable=False)
    address = Column(String, nullable=False)
    district = Column(String, nullable=False)
    state = Column(String, default="Telangana")
    pincode = Column(String(6), nullable=True)
    contact_number = Column(String(15), nullable=True)
    email = Column(String, nullable=True)
    ifsc_code = Column(String(11), nullable=True)
    is_active = Column(Boolean, default=True)

    # Manager
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    manager = relationship("User", foreign_keys=[manager_id])
    employees = relationship(
        "User", back_populates="branch", foreign_keys="User.branch_id"
    )
    loans = relationship("Loan", back_populates="branch")

    def __repr__(self):
        return f"<Branch {self.name} ({self.code})>"
