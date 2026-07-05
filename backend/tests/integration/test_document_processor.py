"""Unit tests for DocumentProcessor with mocked dependencies."""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), ".."))

import uuid
import hashlib
import tempfile
from unittest.mock import AsyncMock, MagicMock

import pytest

from models.db import Document
from services.document_processor import DocumentProcessor


@pytest.fixture
def mock_db():
    """Create a mocked async database session."""
    db = AsyncMock()
    # Make db.add a no-op side effect that actually stores the object
    db.add = MagicMock()
    
    # Default execute to return a result that yields None for scalars().first()
    mock_result = MagicMock()
    mock_result.scalars.return_value.first.return_value = None
    db.execute.return_value = mock_result
    
    return db


@pytest.fixture
def mock_embedding_service():
    """Create a mocked embedding service that returns fake embeddings."""
    service = MagicMock()
    service.embed_chunks.return_value = [[0.1] * 384, [0.2] * 384]
    return service


@pytest.fixture
def sample_txt():
    """Create a temporary text file for testing."""
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".txt", delete=False, encoding="utf-8"
    ) as f:
        f.write("This is a test document with enough words to create multiple chunks for testing the document processor pipeline.")
        f.write(" " + "word " * 500)  # Add more words to ensure chunking
        tmp_path = f.name

    yield tmp_path
    if os.path.exists(tmp_path):
        os.unlink(tmp_path)


@pytest.mark.asyncio
async def test_process_document_success(mock_db, mock_embedding_service, sample_txt):
    """Should successfully process a txt file through the full pipeline."""
    user_id = uuid.uuid4()
    processor = DocumentProcessor(mock_db, mock_embedding_service, user_id)

    # Configure mock flush to set document.id
    async def flush_side_effect():
        pass
    mock_db.flush = AsyncMock(side_effect=flush_side_effect)

    doc = await processor.process_document(sample_txt, "test.txt")

    assert doc.filename == "test.txt"
    assert doc.status == "ready"
    assert doc.content_hash is not None
    assert doc.user_id == user_id
    # Verify that chunks were added
    chunk_add_calls = [call for call in mock_db.add.call_args_list if call[0][0].__class__.__name__ == "Chunk"]
    assert len(chunk_add_calls) > 0
    mock_db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_process_document_empty_file(mock_db, mock_embedding_service):
    """Should raise ValueError on empty document."""
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".txt", delete=False, encoding="utf-8"
    ) as f:
        f.write("   ")
        empty_path = f.name

    user_id = uuid.uuid4()
    processor = DocumentProcessor(mock_db, mock_embedding_service, user_id)

    try:
        with pytest.raises(ValueError, match="empty"):
            await processor.process_document(empty_path, "empty.txt")
    finally:
        os.unlink(empty_path)


@pytest.mark.asyncio
async def test_process_document_unsupported_extension(mock_db, mock_embedding_service):
    """Should raise ValueError for unsupported file extensions."""
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".xyz", delete=False
    ) as f:
        f.write("some text")
        bad_path = f.name

    user_id = uuid.uuid4()
    processor = DocumentProcessor(mock_db, mock_embedding_service, user_id)

    try:
        with pytest.raises(ValueError, match="Unsupported"):
            await processor.process_document(bad_path, "test.xyz")
    finally:
        os.unlink(bad_path)


@pytest.mark.asyncio
async def test_process_document_dedup(mock_db, mock_embedding_service, sample_txt):
    """Should return existing document if content hash matches."""
    user_id = uuid.uuid4()
    processor = DocumentProcessor(mock_db, mock_embedding_service, user_id)

    with open(sample_txt, "r") as f:
        text = f.read()
    content_hash = hashlib.sha256(text.encode("utf-8")).hexdigest()

    # Create an "existing" document that the DB will return
    existing_doc = Document(
        id=uuid.uuid4(),
        user_id=user_id,
        filename="existing.txt",
        content_hash=content_hash,
        file_path=sample_txt,
        status="ready",
    )

    # Mock the DB to return existing_doc on the first select query
    mock_result = MagicMock()
    mock_result.scalars.return_value.first.return_value = existing_doc
    mock_db.execute.return_value = mock_result

    result = await processor.process_document(sample_txt, "test.txt")

    # Should return the existing document without creating a new one
    assert result.id == existing_doc.id
    assert result.filename == "existing.txt"
    # The select query should have been executed
    mock_db.execute.assert_awaited_once()


@pytest.mark.asyncio
async def test_process_document_user_id_none(mock_db, mock_embedding_service, sample_txt):
    """Should handle user_id=None gracefully (guest users)."""
    processor = DocumentProcessor(mock_db, mock_embedding_service, user_id=None)

    async def flush_side_effect():
        pass
    mock_db.flush = AsyncMock(side_effect=flush_side_effect)

    doc = await processor.process_document(sample_txt, "guest_test.txt")

    assert doc.filename == "guest_test.txt"
    assert doc.status == "ready"
    mock_db.commit.assert_awaited_once()
