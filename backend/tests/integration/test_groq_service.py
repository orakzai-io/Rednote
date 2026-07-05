"""Unit tests for GroqService with mocked Groq API client."""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), ".."))

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from services.groq_service import GroqService


@pytest.fixture
def mock_groq_client():
    """Mock the AsyncGroq client to avoid real API calls."""
    with patch("services.groq_service.AsyncGroq") as mock:
        client_instance = AsyncMock()
        mock.return_value = client_instance
        yield client_instance


@pytest.fixture
def groq_service(mock_groq_client):
    """Create a GroqService with mocked client."""
    return GroqService()


@pytest.mark.asyncio
async def test_stream_chat_with_context(groq_service, mock_groq_client):
    """Should include context in system prompt and stream deltas."""
    # Mock the streaming response
    mock_stream = AsyncMock()
    mock_chunk_1 = MagicMock()
    mock_chunk_1.choices = [MagicMock()]
    mock_chunk_1.choices[0].delta.content = "Hello"

    mock_chunk_2 = MagicMock()
    mock_chunk_2.choices = [MagicMock()]
    mock_chunk_2.choices[0].delta.content = " world"

    mock_stream.__aiter__.return_value = [mock_chunk_1, mock_chunk_2]
    mock_groq_client.chat.completions.create.return_value = mock_stream

    context_chunks = [
        {"filename": "doc1.txt", "chunk_index": 0, "content": "The sky is blue."},
        {"filename": "doc1.txt", "chunk_index": 1, "content": "Grass is green."},
    ]
    messages = [{"role": "user", "content": "What color is the sky?"}]

    result_chunks = []
    async for chunk in groq_service.stream_chat(messages, context_chunks):
        result_chunks.append(chunk)

    assert result_chunks == ["Hello", " world"]
    mock_groq_client.chat.completions.create.assert_awaited_once()

    # Verify the system prompt includes the context
    call_kwargs = mock_groq_client.chat.completions.create.call_args[1]
    system_msg = call_kwargs["messages"][0]
    assert "role" in system_msg and system_msg["role"] == "system"
    assert "The sky is blue." in system_msg["content"]
    assert "Grass is green." in system_msg["content"]
    assert "<system>" in system_msg["content"]
    assert "<anchor>" in system_msg["content"]

    # Verify the user message is included
    user_msg = call_kwargs["messages"][1]
    assert user_msg["role"] == "user"
    assert user_msg["content"] == "What color is the sky?"


@pytest.mark.asyncio
async def test_stream_chat_no_context(groq_service, mock_groq_client):
    """Should handle empty context_chunks gracefully."""
    mock_stream = AsyncMock()
    mock_chunk = MagicMock()
    mock_chunk.choices = [MagicMock()]
    mock_chunk.choices[0].delta.content = "No documents available."
    mock_stream.__aiter__.return_value = [mock_chunk]
    mock_groq_client.chat.completions.create.return_value = mock_stream

    result_chunks = []
    async for chunk in groq_service.stream_chat(
        [{"role": "user", "content": "Hello"}], []
    ):
        result_chunks.append(chunk)

    assert result_chunks == ["No documents available."]

    call_kwargs = mock_groq_client.chat.completions.create.call_args[1]
    system_msg = call_kwargs["messages"][0]["content"]
    assert "No document context available." in system_msg


@pytest.mark.asyncio
async def test_stream_chat_multiple_messages(groq_service, mock_groq_client):
    """Should include entire message history in the payload."""
    mock_stream = AsyncMock()
    mock_stream.__aiter__.return_value = []
    mock_groq_client.chat.completions.create.return_value = mock_stream

    messages = [
        {"role": "user", "content": "Hi"},
        {"role": "assistant", "content": "Hello!"},
        {"role": "user", "content": "What is in my document?"},
    ]
    context_chunks = [{"filename": "doc.txt", "chunk_index": 0, "content": "Some content."}]

    async for _ in groq_service.stream_chat(messages, context_chunks):
        pass

    call_kwargs = mock_groq_client.chat.completions.create.call_args[1]
    payload_messages = call_kwargs["messages"]
    # System message + 3 conversation messages
    assert len(payload_messages) == 4
    assert payload_messages[1]["role"] == "user"
    assert payload_messages[2]["role"] == "assistant"
    assert payload_messages[3]["role"] == "user"


@pytest.mark.asyncio
async def test_stream_chat_groq_error(groq_service, mock_groq_client):
    """Should propagate errors from Groq API."""
    mock_groq_client.chat.completions.create.side_effect = Exception("API error")

    with pytest.raises(Exception, match="API error"):
        async for _ in groq_service.stream_chat(
            [{"role": "user", "content": "Hello"}],
            [{"filename": "doc.txt", "chunk_index": 0, "content": "Test."}],
        ):
            pass


@pytest.mark.asyncio
async def test_stream_chat_empty_delta(groq_service, mock_groq_client):
    """Should skip empty deltas (e.g., choices with no content)."""
    mock_stream = AsyncMock()
    mock_chunk_empty = MagicMock()
    mock_chunk_empty.choices = [MagicMock()]
    mock_chunk_empty.choices[0].delta.content = None  # No content

    mock_chunk_valid = MagicMock()
    mock_chunk_valid.choices = [MagicMock()]
    mock_chunk_valid.choices[0].delta.content = "Hi there"

    mock_stream.__aiter__.return_value = [mock_chunk_empty, mock_chunk_valid]
    mock_groq_client.chat.completions.create.return_value = mock_stream

    result_chunks = []
    async for chunk in groq_service.stream_chat(
        [{"role": "user", "content": "Hi"}],
        [{"filename": "doc.txt", "chunk_index": 0, "content": "Test."}],
    ):
        result_chunks.append(chunk)

    # Only the non-empty chunk should be yielded
    assert result_chunks == ["Hi there"]


@pytest.mark.asyncio
async def test_temperature_zero(groq_service, mock_groq_client):
    """Should pass temperature=0.0 to the Groq API."""
    mock_stream = AsyncMock()
    mock_stream.__aiter__.return_value = []
    mock_groq_client.chat.completions.create.return_value = mock_stream

    async for _ in groq_service.stream_chat(
        [{"role": "user", "content": "Test"}],
        [{"filename": "doc.txt", "chunk_index": 0, "content": "Content."}],
    ):
        pass

    call_kwargs = mock_groq_client.chat.completions.create.call_args[1]
    assert call_kwargs["temperature"] == 0.0
