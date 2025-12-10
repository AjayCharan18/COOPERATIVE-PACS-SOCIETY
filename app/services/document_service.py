"""
Service for document management
"""
from typing import Optional, List
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import os
import uuid


class DocumentService:
    """Service for managing loan documents"""
    
    ALLOWED_EXTENSIONS = {'.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'}
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    
    @staticmethod
    def validate_file(filename: str, file_size: int) -> tuple[bool, str]:
        """Validate file extension and size"""
        # Check extension
        ext = os.path.splitext(filename)[1].lower()
        if ext not in DocumentService.ALLOWED_EXTENSIONS:
            return False, f"File type {ext} not allowed. Allowed types: {', '.join(DocumentService.ALLOWED_EXTENSIONS)}"
        
        # Check size
        if file_size > DocumentService.MAX_FILE_SIZE:
            return False, f"File size exceeds maximum limit of {DocumentService.MAX_FILE_SIZE / (1024*1024)}MB"
        
        return True, "Valid"
    
    @staticmethod
    def generate_filename(original_filename: str, loan_id: int) -> str:
        """Generate unique filename for storage"""
        ext = os.path.splitext(original_filename)[1].lower()
        unique_id = uuid.uuid4().hex[:8]
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        return f"loan_{loan_id}_{timestamp}_{unique_id}{ext}"
    
    @staticmethod
    async def save_document(
        db: AsyncSession,
        loan_id: int,
        file_content: bytes,
        filename: str,
        document_type: str,
        uploaded_by: int
    ) -> dict:
        """Save document to storage and database"""
        from app.models.loan import LoanDocument
        
        # Validate file
        is_valid, message = DocumentService.validate_file(filename, len(file_content))
        if not is_valid:
            raise ValueError(message)
        
        # Generate unique filename
        stored_filename = DocumentService.generate_filename(filename, loan_id)
        
        # Create uploads directory if it doesn't exist
        upload_dir = os.path.join("uploads", "loan_documents", str(loan_id))
        os.makedirs(upload_dir, exist_ok=True)
        
        # Save file
        file_path = os.path.join(upload_dir, stored_filename)
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        # Create database record
        document = LoanDocument(
            loan_id=loan_id,
            document_type=document_type,
            original_filename=filename,
            stored_filename=stored_filename,
            file_path=file_path,
            file_size=len(file_content),
            uploaded_by=uploaded_by,
            is_verified=False
        )
        
        db.add(document)
        await db.commit()
        await db.refresh(document)
        
        return {
            "id": document.id,
            "filename": document.original_filename,
            "document_type": document.document_type,
            "file_size": document.file_size,
            "uploaded_at": document.created_at
        }
    
    @staticmethod
    async def get_loan_documents(db: AsyncSession, loan_id: int) -> List:
        """Get all documents for a loan"""
        from app.models.loan import LoanDocument
        
        result = await db.execute(
            select(LoanDocument)
            .where(LoanDocument.loan_id == loan_id)
            .order_by(LoanDocument.created_at.desc())
        )
        return result.scalars().all()
    
    @staticmethod
    async def verify_document(
        db: AsyncSession,
        document_id: int,
        verified_by: int,
        remarks: Optional[str] = None
    ) -> bool:
        """Verify a document"""
        from app.models.loan import LoanDocument
        
        result = await db.execute(
            select(LoanDocument).where(LoanDocument.id == document_id)
        )
        document = result.scalar_one_or_none()
        
        if not document:
            raise ValueError("Document not found")
        
        document.is_verified = True
        document.verified_by = verified_by
        document.verified_at = datetime.now()
        document.verification_remarks = remarks
        
        await db.commit()
        return True
    
    @staticmethod
    async def delete_document(db: AsyncSession, document_id: int) -> bool:
        """Delete a document (soft delete)"""
        from app.models.loan import LoanDocument
        
        result = await db.execute(
            select(LoanDocument).where(LoanDocument.id == document_id)
        )
        document = result.scalar_one_or_none()
        
        if not document:
            raise ValueError("Document not found")
        
        # Soft delete by marking as deleted
        document.is_deleted = True
        await db.commit()
        
        return True
