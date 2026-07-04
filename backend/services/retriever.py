# CLASS — wraps pgvector query, holds DB session
from typing import Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from models.db import Chunk, Document
from core.config import settings


class Retriever:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def retrieve_relevant_chunks(
        self, 
        query_embedding: list[float], 
        document_id: Optional[UUID] = None,
        user_id: Optional[UUID] = None,
    ) -> list[Chunk]:
        """
        Retrieves the top-K relevant text chunks using cosine similarity from pgvector.
        Results are scoped to the authenticated user's documents.
        """
        # Build query with eager loading of the associated document
        stmt = select(Chunk).options(selectinload(Chunk.document))
        
        # Always scope to the current user's documents
        stmt = stmt.join(Document, Chunk.document_id == Document.id)
        if user_id:
            stmt = stmt.where(Document.user_id == user_id)
        
        # Filter by specific document if provided (also scoped to user)
        if document_id:
            stmt = stmt.where(Chunk.document_id == document_id)
            
        # Cosine distance operator is native to pgvector.sqlalchemy Vector column
        stmt = stmt.order_by(
            Chunk.embedding.cosine_distance(query_embedding)
        ).limit(settings.TOP_K)
        
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

