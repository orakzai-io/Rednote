# Chat + POST streaming route
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from groq import GroqError
import json

from db.session import get_async_session
from models.db import User
from services.embedding_service import embedding_service
from services.groq_service import GroqService
from services.retriever import Retriever
from schemas.schemas import ChatRequest
from core.guest import get_current_user_or_guest

router = APIRouter(prefix="/chat", tags=["chat"])
groq_service = GroqService()


@router.post("")
async def chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user_or_guest),
):
    """
    Accepts full message history, extracts the latest query, retrieves relevant
    vector context chunks via pgvector, and streams responses from Groq API.
    Only searches documents belonging to the authenticated user.
    """
    if not request.messages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message history cannot be empty."
        )

    # 1. Extract latest user query to embed and search
    latest_user_message = request.messages[-1]
    if latest_user_message.role != "user":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The latest message in history must be from the 'user'."
        )

    query_text = latest_user_message.content

    # 2. Embed the user query
    try:
        query_embedding = embedding_service.embed_query(query_text)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate search embedding: {str(e)}"
        )

    # 3. Retrieve Top-K matching chunks from Vector Store (scoped to user)
    try:
        retriever = Retriever(db)
        matched_chunks = await retriever.retrieve_relevant_chunks(
            query_embedding=query_embedding,
            document_id=request.document_id,
            user_id=current_user.id
        )
        sources = [
            {
                "filename": chunk.document.filename,
                "chunk_index": chunk.chunk_index,
                "content": chunk.content
            }
            for chunk in matched_chunks
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error querying vector store: {str(e)}"
        )

    # 4. Stream response back using StreamingResponse chunked transmission
    # Converts conversation schemas to flat dictionary payload for Groq
    messages_payload = [msg.model_dump() for msg in request.messages]

    async def response_generator():
        try:
            async for token in groq_service.stream_chat(
                messages=messages_payload,
                context_chunks=sources
            ):
                yield token
            # Yield delimiter and JSON-serialized sources
            yield f"\n__SOURCES__:{json.dumps(sources)}"
        except GroqError as e:
            # Handle quota/rate limit errors with structured error codes
            error_code = getattr(e, 'code', None) or getattr(e, 'status_code', None)
            error_type = getattr(e, 'type', 'unknown_error')
            
            if error_type == 'insufficient_quota' or error_code == 429:
                # Check if it's RPM or TPM limit
                msg = str(e).lower()
                if 'rpm' in msg:
                    yield "\n[QUOTA_ERROR:rpm_exhausted:try_after_60_seconds]"
                elif 'tpd' in msg or 'tokens' in msg:
                    yield "\n[QUOTA_ERROR:tpd_exhausted:try_after_midnight]"
                else:
                    yield "\n[QUOTA_ERROR:rate_limited:try_after_60_seconds]"
            else:
                yield f"\n[Error during stream: {str(e)}]"
        except Exception as e:
            yield f"\n[Error during stream: {str(e)}]"

    try:
        return StreamingResponse(
            response_generator(),
            media_type="text/plain"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Streaming service failed: {str(e)}"
        )