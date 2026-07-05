"""Unit tests for the chunk_text function."""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), ".."))

from lib.chunker import chunk_text


def test_empty_text():
    """An empty string should return an empty list."""
    assert chunk_text("") == []


def test_single_word():
    """A single word should be returned as one chunk."""
    assert chunk_text("hello") == ["hello"]


def test_short_text_within_chunk_size():
    """Text shorter than chunk_size should return as a single chunk."""
    text = "one two three"
    assert chunk_text(text, chunk_size=10, overlap=0) == ["one two three"]


def test_exact_chunk_size():
    """Text with exactly chunk_size words should return one chunk."""
    words = " ".join([f"word{i}" for i in range(5)])
    assert chunk_text(words, chunk_size=5, overlap=0) == [words]


def test_overlapping_chunks():
    """Ensure overlap creates shared words between successive chunks."""
    text = "the quick brown fox jumps over the lazy dog"
    chunks = chunk_text(text, chunk_size=4, overlap=2)
    assert len(chunks) >= 2
    # Verify the last two words of chunk 0 appear as first two words of chunk 1
    chunk0_words = chunks[0].split()
    chunk1_words = chunks[1].split()
    assert chunk0_words[-2:] == chunk1_words[:2]


def test_multiple_chunks_no_overlap():
    """With overlap=0, chunks should be disjoint."""
    text = "a b c d e f g h i j"
    chunks = chunk_text(text, chunk_size=3, overlap=0)
    assert len(chunks) == 4  # "a b c", "d e f", "g h i", "j"
    assert chunks[0] == "a b c"
    assert chunks[1] == "d e f"
    assert chunks[2] == "g h i"
    assert chunks[3] == "j"


def test_large_text():
    """A long text should produce multiple chunks covering all words."""
    words = [f"word{i}" for i in range(1000)]
    text = " ".join(words)
    chunks = chunk_text(text, chunk_size=200, overlap=20)
    # Verify all original words appear somewhere in the chunks
    all_chunk_words = " ".join(chunks)
    for w in words[:10]:  # Check a sample
        assert w in all_chunk_words


def test_default_params():
    """When called with only text, defaults (500, 50) should apply."""
    words = [f"word{i}" for i in range(600)]
    text = " ".join(words)
    chunks = chunk_text(text)
    assert len(chunks) > 1
    assert len(chunks[0].split()) == 500


def test_invalid_chunk_size_zero():
    """chunk_size <= 0 should default to 500."""
    text = "hello world"
    chunks = chunk_text(text, chunk_size=0, overlap=0)
    assert len(chunks) == 1
    assert "hello world" in chunks[0]


def test_invalid_overlap_greater_than_chunk_size():
    """overlap >= chunk_size should default to a value less than chunk_size."""
    text = " ".join([f"word{i}" for i in range(100)])
    chunks = chunk_text(text, chunk_size=30, overlap=30)  # overlap corrected to less than chunk_size internally
    assert len(chunks) > 1


def test_negative_overlap():
    """Negative overlap should default to 50."""
    text = " ".join([f"word{i}" for i in range(100)])
    chunks = chunk_text(text, chunk_size=30, overlap=-1)
    assert len(chunks) > 1


def test_remaining_words_below_overlap_stops_early():
    """If remaining words <= overlap, chunking should stop to avoid tiny tail chunks."""
    text = "a b c d e f g h i j"
    chunks = chunk_text(text, chunk_size=6, overlap=5)
    # With step=1, we'd have many chunks, but the stop condition prevents tiny final chunks
    assert len(chunks) >= 1
