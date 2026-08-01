"""Shared pytest fixtures for FlowMind AI tests."""

from typing import List

import pytest
import numpy as np


@pytest.fixture
def mock_settings():
    """Return a simple Settings-like object with test values."""
    class MockSettings:
        DEMO_MODE = False
        GROQ_API_KEY = "test-key"
        GROQ_MODEL = "llama-3.3-70b-versatile"
        CHROMA_PERSIST_DIR = "./test_chroma_db"
        CHROMA_COLLECTION_NAME = "test_collection"
        EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
        CHUNK_SIZE = 500
        CHUNK_OVERLAP = 50
        CONFIDENCE_THRESHOLD = 0.6
        TOP_K_RESULTS = 3
        GOOGLE_SHEETS_ID = None
        GOOGLE_CREDS_JSON = None
        TELEGRAM_BOT_TOKEN = None
        TELEGRAM_ADMIN_CHAT_ID = None
        CORS_ORIGINS = ["*"]
        LOG_LEVEL = "INFO"
    return MockSettings()


@pytest.fixture
def sample_pdf_bytes():
    """Create a minimal valid PDF in memory and return its bytes.

    This is a real (but minimal) PDF that PyPDF2 can parse.
    It contains a single page with the text "Hello, this is a test PDF."
    """
    # Minimal valid PDF structure
    pdf_content = b"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]
   /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 84 >>
stream
BT /F1 24 Tf 100 700 Td (Hello, this is a test PDF.) Tj ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
0000000406 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
466
%%EOF"""
    return pdf_content


@pytest.fixture
def sample_chunks():
    """Return a list of test chunk dicts matching the schema used by ChromaClient."""
    return [
        {
            "id": "test_doc__chunk_0",
            "text": "This is the first chunk of test document content.",
            "page": 1,
            "chunk_index": 0,
            "embedding": [0.1] * 384,
        },
        {
            "id": "test_doc__chunk_1",
            "text": "This is the second chunk of test document content.",
            "page": 1,
            "chunk_index": 1,
            "embedding": [0.2] * 384,
        },
        {
            "id": "test_doc__chunk_2",
            "text": "This is the third chunk of test document content.",
            "page": 2,
            "chunk_index": 2,
            "embedding": [0.3] * 384,
        },
    ]


@pytest.fixture
def sample_embedding():
    """Return a list of 384 floats (all 0.1) as a sample embedding vector."""
    return [0.1] * 384
