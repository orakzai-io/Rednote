# Upload, list, delete, status routes
import os
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from db.session import get_async_session
from models.db import Document, User
from services.document_processor import DocumentProcessor
from services.embedding_service import embedding_service
from schemas.schemas import DocumentResponse
from core.config import settings
from core.guest import get_current_user_or_guest

router = APIRouter(prefix="/documents", tags=["documents"])

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user_or_guest),
):
    """
    Uploads a document, extracts text, chunks, embeds, and stores it in pgvector.
    Validates file formats and bounds file size to 10MB. Enforces guest upload limits.
    """
    # Enforce limit of 3 documents for guests
    if current_user.email.endswith("@guest.rednote"):
        stmt = select(func.count(Document.id)).where(Document.user_id == current_user.id)
        result = await db.execute(stmt)
        doc_count = result.scalar() or 0
        if doc_count >= 3:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Guest accounts are limited to a maximum of 3 uploaded documents. Please register to upload more."
            )
    # 1. Validate file extension
    filename = file.filename or "unknown"
    _, ext = os.path.splitext(filename.lower())
    if ext not in [".pdf", ".docx", ".txt"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Only PDF, DOCX, and TXT files up to 10MB are supported."
        )

    # 2. Save file locally and check size limits
    # Prefix filename with user_id to avoid collisions across users
    safe_filename = f"{current_user.id}_{filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)
    file_size = 0

    try:
        with open(file_path, "wb") as buffer:
            while chunk := await file.read(65536):  # Read in 64kb chunks
                file_size += len(chunk)
                if file_size > settings.MAX_FILE_SIZE:
                    # Clean up partial upload
                    buffer.close()
                    if os.path.exists(file_path):
                        os.remove(file_path)
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="File size exceeds the maximum limit of 10MB."
                    )
                buffer.write(chunk)
    except HTTPException:
        raise
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving uploaded file: {str(e)}"
        )

    # 3. Process document (parse -> chunk -> embed -> store)
    try:
        processor = DocumentProcessor(db, embedding_service, current_user.id)
        doc = await processor.process_document(file_path, filename)
        return doc
    except ValueError as ve:
        # User/parsing errors
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        # Server/system errors
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Document processing failed: {str(e)}"
        )


@router.get("", response_model=list[DocumentResponse])
async def list_documents(
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user_or_guest),
):
    """Lists all documents belonging to the current user."""
    stmt = select(Document).where(Document.user_id == current_user.id).order_by(Document.created_at.desc())
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/{document_id}/status")
async def get_document_status(
    document_id: UUID,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user_or_guest),
):
    """Retrieves processing status for a specific document (user-scoped)."""
    stmt = select(Document).where(Document.id == document_id, Document.user_id == current_user.id)
    result = await db.execute(stmt)
    doc = result.scalars().first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found."
        )
    return {"status": doc.status}


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: UUID,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user_or_guest),
):
    """
    Deletes a document, its database record, its related text chunks (cascade),
    and removes the physical file from the upload directory.
    Only the document owner can delete.
    """
    stmt = select(Document).where(Document.id == document_id, Document.user_id == current_user.id)
    result = await db.execute(stmt)
    doc = result.scalars().first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found."
        )

    # 1. Delete physical file from uploads folder
    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception as e:
            # Log error but don't halt DB deletion
            print(f"Failed to remove physical file {doc.file_path}: {e}")

    # 2. Delete from DB (automatically cascade deletes chunks)
    await db.delete(doc)
    await db.commit()