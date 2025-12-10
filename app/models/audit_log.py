"""
Audit Log Model for tracking system activities
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, ForeignKey, Index
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.base import Base


class AuditLog(Base):
    """
    Audit log for tracking all important system activities
    Useful for compliance, debugging, and security monitoring
    """
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Who performed the action
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user = relationship("User", foreign_keys=[user_id])
    username = Column(String, nullable=True)  # Cached for performance
    user_role = Column(String, nullable=True)
    
    # What action was performed
    action = Column(String, nullable=False, index=True)  # e.g., "CREATE_LOAN", "APPROVE_PAYMENT"
    resource_type = Column(String, nullable=False, index=True)  # e.g., "LOAN", "PAYMENT", "USER"
    resource_id = Column(Integer, nullable=True, index=True)  # ID of the affected resource
    
    # Details
    description = Column(Text, nullable=True)
    old_values = Column(JSON, nullable=True)  # Previous state
    new_values = Column(JSON, nullable=True)  # New state
    changes = Column(JSON, nullable=True)  # Summary of what changed
    
    # Context
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True)
    branch = relationship("Branch", foreign_keys=[branch_id])
    
    # Status
    status = Column(String, default="SUCCESS")  # SUCCESS, FAILED, ERROR
    error_message = Column(Text, nullable=True)
    
    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Indexes for common queries
    __table_args__ = (
        Index('idx_audit_user_action', 'user_id', 'action'),
        Index('idx_audit_resource', 'resource_type', 'resource_id'),
        Index('idx_audit_created', 'created_at'),
        Index('idx_audit_branch_created', 'branch_id', 'created_at'),
    )
    
    def __repr__(self):
        return f"<AuditLog {self.id}: {self.action} on {self.resource_type} by {self.username}>"


# Common audit action types
class AuditAction:
    # Authentication
    LOGIN = "LOGIN"
    LOGOUT = "LOGOUT"
    LOGIN_FAILED = "LOGIN_FAILED"
    PASSWORD_CHANGE = "PASSWORD_CHANGE"
    
    # User management
    CREATE_USER = "CREATE_USER"
    UPDATE_USER = "UPDATE_USER"
    DELETE_USER = "DELETE_USER"
    ACTIVATE_USER = "ACTIVATE_USER"
    DEACTIVATE_USER = "DEACTIVATE_USER"
    ASSIGN_BRANCH = "ASSIGN_BRANCH"
    
    # Loan management
    CREATE_LOAN = "CREATE_LOAN"
    UPDATE_LOAN = "UPDATE_LOAN"
    APPROVE_LOAN = "APPROVE_LOAN"
    REJECT_LOAN = "REJECT_LOAN"
    DISBURSE_LOAN = "DISBURSE_LOAN"
    CLOSE_LOAN = "CLOSE_LOAN"
    RESCHEDULE_LOAN = "RESCHEDULE_LOAN"
    
    # Payment management
    CREATE_PAYMENT = "CREATE_PAYMENT"
    APPROVE_PAYMENT = "APPROVE_PAYMENT"
    REJECT_PAYMENT = "REJECT_PAYMENT"
    COMPLETE_PAYMENT = "COMPLETE_PAYMENT"
    
    # Configuration
    UPDATE_LOAN_TYPE = "UPDATE_LOAN_TYPE"
    UPDATE_INTEREST_RATE = "UPDATE_INTEREST_RATE"
    UPDATE_SYSTEM_SETTINGS = "UPDATE_SYSTEM_SETTINGS"
    
    # Branch management
    CREATE_BRANCH = "CREATE_BRANCH"
    UPDATE_BRANCH = "UPDATE_BRANCH"
    
    # Documents
    UPLOAD_DOCUMENT = "UPLOAD_DOCUMENT"
    DELETE_DOCUMENT = "DELETE_DOCUMENT"
    DOWNLOAD_DOCUMENT = "DOWNLOAD_DOCUMENT"
    
    # Reports
    GENERATE_REPORT = "GENERATE_REPORT"
    EXPORT_DATA = "EXPORT_DATA"


# Resource types
class AuditResource:
    USER = "USER"
    LOAN = "LOAN"
    PAYMENT = "PAYMENT"
    BRANCH = "BRANCH"
    LOAN_TYPE_CONFIG = "LOAN_TYPE_CONFIG"
    DOCUMENT = "DOCUMENT"
    SYSTEM_SETTINGS = "SYSTEM_SETTINGS"
    REPORT = "REPORT"
