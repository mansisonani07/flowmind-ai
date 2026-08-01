"""Tests for the Embedder service."""

from unittest.mock import MagicMock, patch

import numpy as np
import pytest

from app.services.embedder import Embedder


def _make_mock_model():
    """Create a mock SentenceTransformer that returns predictable embeddings."""
    mock_model = MagicMock()
    # encode returns a numpy array of shape (n, 384)
    def fake_encode(texts, convert_to_numpy=True):
        if isinstance(texts, str):
            texts = [texts]
        arr = np.random.rand(len(texts), 384).astype(np.float32)
        if convert_to_numpy:
            return arr
        return arr.tolist()
    mock_model.encode.side_effect = fake_encode
    return mock_model


def test_embedder_returns_384_dimensions():
    """embed_text should return a list of exactly 384 floats."""
    mock_model = _make_mock_model()

    with patch("app.services.embedder.SentenceTransformer", return_value=mock_model):
        # Reset singleton so a fresh instance is created
        Embedder._instance = None
        embedder = Embedder(model_name="test-model")
        # Force-load without going through the real loading path
        embedder._model = mock_model
        embedder._loaded = True

        result = embedder.embed_text("What are your business hours?")

    assert isinstance(result, list)
    assert len(result) == 384
    # Reset singleton
    Embedder._instance = None


def test_embedder_batch_returns_correct_count():
    """embed_batch with 3 texts should return 3 embedding vectors."""
    mock_model = _make_mock_model()

    with patch("app.services.embedder.SentenceTransformer", return_value=mock_model):
        Embedder._instance = None
        embedder = Embedder(model_name="test-model")
        embedder._model = mock_model
        embedder._loaded = True

        texts = ["First question", "Second question", "Third question"]
        result = embedder.embed_batch(texts)

    assert isinstance(result, list)
    assert len(result) == 3
    for emb in result:
        assert isinstance(emb, list)
        assert len(emb) == 384

    Embedder._instance = None


def test_embedder_handles_empty_text():
    """Embedding an empty string should not crash the embedder."""
    mock_model = _make_mock_model()

    with patch("app.services.embedder.SentenceTransformer", return_value=mock_model):
        Embedder._instance = None
        embedder = Embedder(model_name="test-model")
        embedder._model = mock_model
        embedder._loaded = True

        # Should not raise
        result = embedder.embed_text("")

    assert isinstance(result, list)
    assert len(result) == 384
    Embedder._instance = None
