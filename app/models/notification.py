"""
Notification models for SMS, WhatsApp, Email alerts
"""

from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    ForeignKey,
    DateTime,
    Text,
    Enum as SQLEnum,
)
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.db.base import Base, TimestampMixin


class NotificationType(str, enum.Enum):
    """Types of notifications"""

    SMS = "sms"
    WHATSAPP = "whatsapp"
    EMAIL = "email"
    PUSH = "push"
    IN_APP = "in_app"


class NotificationPurpose(str, enum.Enum):
    """Purpose/category of notification"""

    EMI_REMINDER = "emi_reminder"
    PAYMENT_CONFIRMATION = "payment_confirmation"
    OVERDUE_ALERT = "overdue_alert"
    LOAN_APPROVED = "loan_approved"
    LOAN_REJECTED = "loan_rejected"
    LOAN_DISBURSED = "loan_disbursed"
    SUBSIDY_CREDIT = "subsidy_credit"
    CROP_INSURANCE = "crop_insurance"
    WEATHER_ALERT = "weather_alert"
    GENERAL = "general"


class NotificationStatus(str, enum.Enum):
    """Notification delivery status"""

    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"
    READ = "read"


class Notification(Base, TimestampMixin):
    """Notification/Alert model"""

    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)

    # User
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User", back_populates="notifications")

    # Type and purpose
    notification_type = Column(SQLEnum(NotificationType), nullable=False)
    purpose = Column(SQLEnum(NotificationPurpose), nullable=False)

    # Content
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)

    # Language
    language = Column(String, default="english")

    # Related entities
    loan_id = Column(Integer, ForeignKey("loans.id"), nullable=True)
    payment_id = Column(Integer, ForeignKey("payments.id"), nullable=True)

    # Status
    status = Column(SQLEnum(NotificationStatus), default=NotificationStatus.PENDING)

    # Delivery details
    sent_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    read_at = Column(DateTime, nullable=True)

    # External references (for tracking)
    external_id = Column(String, nullable=True)  # Twilio message SID, etc.
    error_message = Column(Text, nullable=True)

    # Retry mechanism
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)

    # Priority
    priority = Column(Integer, default=0)  # Higher number = higher priority

    # Schedule
    scheduled_for = Column(DateTime, nullable=True)

    def __repr__(self):
        return f"<Notification {self.notification_type} - {self.purpose}>"


class NotificationTemplate(Base, TimestampMixin):
    """Templates for notifications in multiple languages"""

    __tablename__ = "notification_templates"

    id = Column(Integer, primary_key=True, index=True)

    template_key = Column(String(100), unique=True, nullable=False)
    purpose = Column(SQLEnum(NotificationPurpose), nullable=False)
    notification_type = Column(SQLEnum(NotificationType), nullable=False)

    # Template content (supports placeholders like {farmer_name}, {amount}, etc.)
    template_english = Column(Text, nullable=False)
    template_telugu = Column(Text, nullable=True)
    template_kannada = Column(Text, nullable=True)
    template_hindi = Column(Text, nullable=True)

    # Subject (for email)
    subject_english = Column(String, nullable=True)
    subject_telugu = Column(String, nullable=True)
    subject_kannada = Column(String, nullable=True)
    subject_hindi = Column(String, nullable=True)

    is_active = Column(Boolean, default=True)

    def __repr__(self):
        return f"<NotificationTemplate {self.template_key}>"
