"""Unit tests for document parsing functions (parse_pdf, parse_docx, parse_txt)."""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), ".."))

import tempfile

from lib.parser import parse_txt


FIXTURES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "fixtures")


def test_parse_txt_sample():
    """parse_txt should return the full content of the sample text file."""
    filepath = os.path.join(FIXTURES_DIR, "sample.txt")
    result = parse_txt(filepath)
    assert "This is a sample text file" in result
    assert "Symbols:" in result
    assert len(result) > 50


def test_parse_txt_empty():
    """An empty text file should return an empty string."""
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".txt", delete=False, encoding="utf-8"
    ) as f:
        f.write("")
        empty_path = f.name

    try:
        result = parse_txt(empty_path)
        assert result == ""
    finally:
        os.unlink(empty_path)


def test_parse_txt_unicode():
    """parse_txt should handle unicode characters correctly."""
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".txt", delete=False, encoding="utf-8"
    ) as f:
        f.write("Héllo Wörld 测试 日本語 русский")
        uni_path = f.name

    try:
        result = parse_txt(uni_path)
        assert "Héllo" in result
        assert "测试" in result
        assert "русский" in result
    finally:
        os.unlink(uni_path)


def test_parse_txt_multiline():
    """parse_txt should preserve newlines."""
    content = "line1\nline2\nline3"
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".txt", delete=False, encoding="utf-8"
    ) as f:
        f.write(content)
        ml_path = f.name

    try:
        result = parse_txt(ml_path)
        assert result == content
        assert "\n" in result
    finally:
        os.unlink(ml_path)


def test_parse_txt_binary_ignored():
    """parse_txt should not crash on binary-ish content with invalid UTF-8."""
    with tempfile.NamedTemporaryFile(
        mode="wb", suffix=".txt", delete=False
    ) as f:
        f.write(b"Hello\xff\xfeWorld")  # invalid UTF-8 bytes
        bin_path = f.name

    try:
        # Should not raise; errors='ignore' handles it
        result = parse_txt(bin_path)
        assert "Hello" in result
        assert "World" in result
    finally:
        os.unlink(bin_path)
