"""
LoanDocument model for tracking uploaded documents
"""

from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.base import Base, TimestampMixin


class LoanDocument(Base, TimestampMixin):
    """Model for loan documents"""

    __tablename__ = "loan_documents"

    id = Column(Integer, primary_key=True, index=True)
    loan_id = Column(Integer, ForeignKey("loans.id"), nullable=False)

    # Document details
    document_type = Column(
        String, nullable=False
    )  # aadhaar, pan, land_records, photo, etc.
    original_filename = Column(String, nullable=False)
    stored_filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)  # in bytes

    # Upload info
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Verification
    is_verified = Column(Boolean, default=False)
    verified_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    verification_remarks = Column(Text, nullable=True)

    # Soft delete
    is_deleted = Column(Boolean, default=False)

    def __repr__(self):
        return f"<LoanDocument {self.original_filename} - Loan {self.loan_id}>"
