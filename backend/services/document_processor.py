# CLASS — orchestrates parse → chunk → embed pipeline
import os
import uuid
import hashlib
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.db import Document, Chunk
from lib.parser import parse_pdf, parse_docx, parse_txt
from lib.chunker import chunk_text
from services.embedding_service import EmbeddingService
from core.config import settings


class DocumentProcessor:
    def __init__(self, db: AsyncSession, embedding_service: EmbeddingService, user_id: uuid.UUID | None = None) -> None:
        self.db = db
        self.embedding_service = embedding_service
        self.user_id = user_id

    async def process_document(self, file_path: str, filename: str) -> Document:
        """
        Orchestrates the entire document ingestion pipeline:
        Upload → Extract → Chunk → Embed → Store
        Uses duplicate content checking and async batch insertion.
        """
        # Determine extraction strategy
        _, ext = os.path.splitext(filename.lower())
        if ext == ".pdf":
            text = parse_pdf(file_path)
        elif ext == ".docx":
            text = parse_docx(file_path)
        elif ext == ".txt":
            text = parse_txt(file_path)
        else:
            raise ValueError(f"Unsupported file extension: {ext}")

        if not text.strip():
            raise ValueError("Document is empty or no readable text could be extracted.")

        # Compute SHA-256 content hash to prevent duplicate storage
        content_hash = hashlib.sha256(text.encode("utf-8")).hexdigest()

        # Deduplication check
        stmt = select(Document).where(Document.content_hash == content_hash)
        result = await self.db.execute(stmt)
        existing_doc = result.scalars().first()
        if existing_doc:
            return existing_doc

        # Insert new Document entry in chunking state
        document = Document(
            user_id=self.user_id,
            filename=filename,
            content_hash=content_hash,
            file_path=file_path,
            status="chunking"
        )
        self.db.add(document)
        await self.db.flush()  # Populates document.id

        # Chunk the extracted text
        text_chunks = chunk_text(text, settings.CHUNK_SIZE, settings.CHUNK_OVERLAP)
        
        # Batch embed chunks
        embeddings = self.embedding_service.embed_chunks(text_chunks)

        # Batch insert chunks using SQLAlchemy objects
        for idx, (content, emb) in enumerate(zip(text_chunks, embeddings)):
            chunk = Chunk(
                document_id=document.id,
                content=content,
                embedding=emb,
                chunk_index=idx
            )
            self.db.add(chunk)

        # Transition status to ready
        document.status = "ready"
        await self.db.commit()
        await self.db.refresh(document)

        return document
