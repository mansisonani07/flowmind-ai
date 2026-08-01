"""Tests for the RAG Engine core logic."""

from unittest.mock import MagicMock

import pytest

from app.services.rag_engine import RAGEngine


def _make_mock_rag_engine():
    """Create a RAGEngine with all external dependencies mocked."""
    engine = object.__new__(RAGEngine)
    engine.embedder = MagicMock()
    engine.chroma_client = MagicMock()
    engine.groq_client = MagicMock()
    engine.sheets_logger = MagicMock()
    engine.telegram = MagicMock()
    return engine


def test_calculate_confidence_high_similarity():
    """Distances [0.1, 0.2, 0.3] should produce confidence >= 0.7."""
    engine = _make_mock_rag_engine()
    confidence = engine.calculate_confidence([0.1, 0.2, 0.3])
    assert confidence >= 0.7, f"Expected >= 0.7, got {confidence}"


def test_calculate_confidence_low_similarity():
    """Distances [0.8, 0.9, 1.0] should produce confidence < 0.4."""
    engine = _make_mock_rag_engine()
    confidence = engine.calculate_confidence([0.8, 0.9, 1.0])
    assert confidence < 0.4, f"Expected < 0.4, got {confidence}"


def test_confidence_clamped_to_zero_one():
    """Edge-case distances should always produce confidence in [0.0, 1.0]."""
    engine = _make_mock_rag_engine()

    # Negative distances (shouldn't happen, but guard)
    c = engine.calculate_confidence([-1.0, -0.5, 0.0])
    assert 0.0 <= c <= 1.0

    # Very large distances
    c = engine.calculate_confidence([5.0, 10.0, 100.0])
    assert 0.0 <= c <= 1.0
    # With large distances, confidence should be clamped to 0.0
    assert c == 0.0

    # Perfect match
    c = engine.calculate_confidence([0.0])
    assert c == 1.0

    # Empty list
    c = engine.calculate_confidence([])
    assert c == 0.0
