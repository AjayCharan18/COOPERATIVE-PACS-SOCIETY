"""
Endpoints for document upload and management
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.db.session import get_db
from app.models.user import User, UserRole
from app.api.deps import get_current_user
from app.services.document_service import DocumentService

router = APIRouter()


@router.post("/upload/{loan_id}")
async def upload_document(
    loan_id: int,
    file: UploadFile = File(...),
    document_type: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload a document for a loan
    Employees and admins can upload for any loan
    Farmers can upload for their own loans
    """
    from app.models.loan import Loan
    from sqlalchemy import select
    
    # Get loan to check ownership
    result = await db.execute(select(Loan).where(Loan.id == loan_id))
    loan = result.scalar_one_or_none()
    
    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan not found"
        )
    
    # Check authorization
    if current_user.role == UserRole.FARMER and loan.farmer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only upload documents for your own loans"
        )
    
    try:
        # Read file content
        file_content = await file.read()
        
        # Save document
        document = await DocumentService.save_document(
            db,
            loan_id,
            file_content,
            file.filename,
            document_type,
            current_user.id
        )
        
        return {
            "message": "Document uploaded successfully",
            "document": document
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/loan/{loan_id}")
async def get_loan_documents(
    loan_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all documents for a loan
    Farmers can view their own loan documents
    Employees and admins can view all
    """
    from app.models.loan import Loan
    from sqlalchemy import select
    
    # Get loan to check ownership
    result = await db.execute(select(Loan).where(Loan.id == loan_id))
    loan = result.scalar_one_or_none()
    
    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan not found"
        )
    
    # Check authorization
    if current_user.role == UserRole.FARMER and loan.farmer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own loan documents"
        )
    
    documents = await DocumentService.get_loan_documents(db, loan_id)
    
    return {
        "loan_id": loan_id,
        "total_documents": len(documents),
        "documents": [
            {
                "id": doc.id,
                "document_type": doc.document_type,
                "filename": doc.original_filename,
                "file_size": doc.file_size,
                "uploaded_at": doc.created_at,
                "is_verified": doc.is_verified,
                "verified_at": doc.verified_at
            }
            for doc in documents if not doc.is_deleted
        ]
    }


@router.post("/verify/{document_id}")
async def verify_document(
    document_id: int,
    remarks: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Verify a document
    Employee/Admin only
    """
    if current_user.role not in [UserRole.EMPLOYEE, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employees and admins can verify documents"
        )
    
    try:
        await DocumentService.verify_document(db, document_id, current_user.id, remarks)
        
        return {
            "message": "Document verified successfully",
            "document_id": document_id
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{document_id}")
async def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a document (soft delete)
    Admin only
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete documents"
        )
    
    try:
        await DocumentService.delete_document(db, document_id)
        
        return {
            "message": "Document deleted successfully",
            "document_id": document_id
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
