from __future__ import annotations

import json
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator


class QueryRequest(BaseModel):
    question: str
    user_phone: str = unknown

    @field_validator("question")
    @classmethod
    def question_must_not_be_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Question cannot be empty")
        return v.strip()

    model_config = {
        "json_schema_extra": {
            "examples": [
                {"question": "What are your business hours?", "user_phone": "+1234567890"}
            ]
        }
    }


class QueryResponse(BaseModel):
    answer: str
    sources: List[Dict[str, Any]]
    confidence: float
    escalated: bool
    chunks_used: int
    response_time_ms: float

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "answer": "We are open Monday to Friday, 9 AM to 6 PM.",
                    "sources": [{"filename": "info.pdf", "page": 1, "text": "Our hours are..."}],
                    "confidence": 0.92,
                    "escalated": False,
                    "chunks_used": 2,
                    "response_time_ms": 150.5,
                }
            ]
        }
    }


class UploadResponse(BaseModel):
    status: str
    filename: str
    chunks_created: int
    message: str

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "status": "success",
                    "filename": "document.pdf",
                    "chunks_created": 15,
                    "message": "Document processed and indexed successfully.",
                }
            ]
        }
    }


class DocumentInfo(BaseModel):
    filename: str
    chunk_count: int
    uploaded_at: str


class DocumentList(BaseModel):
    documents: List[DocumentInfo]
    total: int


class StatsResponse(BaseModel):
    total_documents: int
    total_chunks: int
    total_queries: int
    avg_confidence: float
    escalation_rate: float
    popular_questions: List[str]
    daily_query_count: List[Dict[str, Any]]
    avg_response_time: float


class HealthResponse(BaseModel):
    status: str
    version: str
    services: Dict[str, bool]
    uptime_seconds: float


class ConversationLog(BaseModel):
    timestamp: str
    user_phone: str
    question: str
    answer: str
    confidence: float
    sources: List[Dict[str, Any]]
    escalated: bool
    response_time_ms: float
