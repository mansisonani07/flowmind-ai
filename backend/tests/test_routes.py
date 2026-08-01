"""Tests for API route endpoints."""

from unittest.mock import MagicMock

import pytest
from starlette.testclient import TestClient


def _create_test_app():
    """Create a FastAPI app with routes registered and mocked rag_engine."""
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware

    app = FastAPI()
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mock the RAG engine and attach to app.state
    app.state.rag_engine = MagicMock()
    app.state.rag_engine.chroma_client = MagicMock()
    app.state.rag_engine.chroma_client._collection = MagicMock()
    app.state.rag_engine.chroma_client._collection.count.return_value = 42
    app.state.rag_engine.sheets_logger = MagicMock()
    app.state.rag_engine.sheets_logger.available = False
    app.state.rag_engine.telegram = MagicMock()
    app.state.rag_engine.telegram.available = False
    app.state.rag_engine.chroma_client.list_documents.return_value = []
    app.state.rag_engine.chroma_client.get_stats.return_value = {
        "total_documents": 0,
        "total_chunks": 0,
    }
    app.state.rag_engine.sheets_logger.get_stats.return_value = {
        "total_queries": 0,
        "avg_confidence": 0.0,
        "escalation_rate": 0.0,
        "popular_questions": [],
        "daily_query_count": [],
        "avg_response_time": 0.0,
    }

    # Import and include routers
    from app.routes import health, query, upload, documents, stats
    app.include_router(health.router, prefix="/api")
    app.include_router(query.router, prefix="/api")
    app.include_router(upload.router, prefix="/api")
    app.include_router(documents.router, prefix="/api")
    app.include_router(stats.router, prefix="/api")

    return app


@pytest.fixture
def client():
    """Return a TestClient with mocked dependencies."""
    app = _create_test_app()
    return TestClient(app, raise_server_exceptions=False)


def test_health_endpoint(client):
    """GET /api/health should return 200 with valid JSON structure."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "version" in data
    assert "services" in data
    assert "uptime_seconds" in data
    assert data["status"] == "ok"
    assert data["version"] == "1.0.0"
    assert isinstance(data["services"], dict)


def test_query_endpoint_requires_question(client):
    """POST /api/query without a question field should return 422."""
    response = client.post("/api/query", json={"user_phone": "+1234567890"})
    assert response.status_code == 422


def test_upload_requires_file(client):
    """POST /api/upload without a file should return 422."""
    response = client.post("/api/upload")
    assert response.status_code == 422
