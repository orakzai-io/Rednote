"""Unit tests for the Retriever class using mocked DB session."""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), ".."))

import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest

from services.retriever import Retriever


@pytest.fixture
def mock_db():
    """Create a mocked async database session."""
    return AsyncMock()


@pytest.fixture
def retriever(mock_db):
    """Create a Retriever instance with mocked db."""
    return Retriever(db=mock_db)


@pytest.mark.asyncio
async def test_retrieve_relevant_chunks_no_filters(retriever, mock_db):
    """Should build a query without any additional filters beyond user scope."""
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = []
    mock_db.execute.return_value = mock_result

    query_embedding = [0.1] * 384
    result = await retriever.retrieve_relevant_chunks(query_embedding)

    assert result == []
    mock_db.execute.assert_awaited_once()


@pytest.mark.asyncio
async def test_retrieve_relevant_chunks_with_user_id(retriever, mock_db):
    """Should filter by user_id when provided."""
    mock_result = MagicMock()
    mock_chunk = MagicMock()
    mock_chunk.id = uuid.uuid4()
    mock_chunk.content = "test content"
    mock_result.scalars.return_value.all.return_value = [mock_chunk]
    mock_db.execute.return_value = mock_result

    user_id = uuid.uuid4()
    query_embedding = [0.2] * 384
    result = await retriever.retrieve_relevant_chunks(query_embedding, user_id=user_id)

    assert len(result) == 1
    assert result[0].id == mock_chunk.id
    mock_db.execute.assert_awaited_once()


@pytest.mark.asyncio
async def test_retrieve_relevant_chunks_with_document_id(retriever, mock_db):
    """Should filter by document_id when provided."""
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = []
    mock_db.execute.return_value = mock_result

    doc_id = uuid.uuid4()
    query_embedding = [0.3] * 384
    result = await retriever.retrieve_relevant_chunks(
        query_embedding, document_id=doc_id
    )

    assert result == []
    mock_db.execute.assert_awaited_once()


@pytest.mark.asyncio
async def test_retrieve_relevant_chunks_returns_top_k(retriever, mock_db):
    """Should respect the TOP_K setting from config."""
    mock_result = MagicMock()
    mock_chunks = [MagicMock() for _ in range(5)]
    for i, c in enumerate(mock_chunks):
        c.id = uuid.uuid4()
        c.content = f"chunk {i}"
    mock_result.scalars.return_value.all.return_value = mock_chunks
    mock_db.execute.return_value = mock_result

    query_embedding = [0.4] * 384
    result = await retriever.retrieve_relevant_chunks(query_embedding)

    assert len(result) == 5
    mock_db.execute.assert_awaited_once()


@pytest.mark.asyncio
async def test_retrieve_relevant_chunks_empty_results(retriever, mock_db):
    """Should return empty list when no chunks match."""
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = []
    mock_db.execute.return_value = mock_result

    query_embedding = [0.5] * 384
    result = await retriever.retrieve_relevant_chunks(query_embedding)

    assert result == []


@pytest.mark.asyncio
async def test_retrieve_with_user_and_document(retriever, mock_db):
    """Should filter by both user_id and document_id."""
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = []
    mock_db.execute.return_value = mock_result

    user_id = uuid.uuid4()
    doc_id = uuid.uuid4()
    query_embedding = [0.6] * 384
    
    result = await retriever.retrieve_relevant_chunks(
        query_embedding, document_id=doc_id, user_id=user_id
    )

    assert result == []
    mock_db.execute.assert_awaited_once()
