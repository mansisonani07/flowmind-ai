"""
Playground endpoint with detailed RAG pipeline diagnostics.
Like /query but returns extra technical details for debugging and development.
"""

import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Request
from pydantic import BaseModel, Field

from app.utils.logger import logger

router = APIRouter()


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class PlaygroundQueryRequest(BaseModel):
    question: str = Field(..., min_length=1, description="The user question")
    user_phone: str = Field(default="unknown", description="Optional user identifier")
    top_k: int = Field(default=3, ge=1, le=20, description="Number of chunks to retrieve")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {"question": "What are your business hours?", "user_phone": "+1234567890", "top_k": 5}
            ]
        }
    }


class ChunkDetail(BaseModel):
    text: str
    filename: str
    page: int
    similarity: float


class PlaygroundQueryResponse(BaseModel):
    """Extended query response with full RAG pipeline diagnostics."""
    # Standard fields
    answer: str
    confidence: float
    escalated: bool
    chunks_used: int

    # Extra technical details
    chunks_retrieved: List[ChunkDetail]
    embedding_dimensions: int
    embedding_time_ms: float
    retrieval_time_ms: float
    generation_time_ms: float
    tokens_used: int
    model: str
    total_time_ms: float


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@router.post("/playground/query", response_model=PlaygroundQueryResponse)
async def playground_query(request: Request, body: PlaygroundQueryRequest) -> PlaygroundQueryResponse:
    """
    Process a query through the RAG pipeline and return full diagnostics.

    Returns the same answer as /query plus detailed timing, chunk data,
    embedding dimensions, and token usage from the Groq response.
    """
    rag = request.app.state.rag_engine
    total_start = time.time()

    # --------------------------------------------------
    # Step 1: Embedding
    # --------------------------------------------------
    embed_start = time.time()
    try:
        query_embedding = rag.embedder.embed_text(body.question)
    except Exception as exc:
        logger.error(f"Playground embedding failed: {exc}")
        query_embedding = [0.0] * 384
    embedding_time_ms = round((time.time() - embed_start) * 1000, 2)
    embedding_dimensions = len(query_embedding)

    # --------------------------------------------------
    # Step 2: ChromaDB Retrieval
    # --------------------------------------------------
    retrieval_start = time.time()
    try:
        results = rag.chroma_client.query(query_embedding, body.top_k)
    except Exception as exc:
        logger.error(f"Playground retrieval failed: {exc}")
        results = []
    retrieval_time_ms = round((time.time() - retrieval_start) * 1000, 2)

    # Build chunk details
    chunks_retrieved = [
        ChunkDetail(
            text=r["text"],
            filename=r.get("filename", "unknown"),
            page=r.get("page", 0),
            similarity=round(r.get("similarity", 0.0), 4),
        )
        for r in results
    ]

    # --------------------------------------------------
    # Step 3: Confidence check
    # --------------------------------------------------
    distances = [r["distance"] for r in results] if results else [1.0]
    confidence = rag.calculate_confidence(distances)

    # Try to read the threshold from config
    from app.config import settings
    escalated = confidence < settings.CONFIDENCE_THRESHOLD

    # --------------------------------------------------
    # Step 4: LLM Generation
    # --------------------------------------------------
    tokens_used = 0
    model_used = "unknown"

    if not escalated:
        gen_start = time.time()
        try:
            llm_result = rag.groq_client.generate_answer(body.question, results)
            answer = llm_result["answer"]
            tokens_used = llm_result.get("tokens_used", 0)
            model_used = llm_result.get("model", "unknown")
        except Exception as exc:
            logger.error(f"Playground generation failed: {exc}")
            answer = "An error occurred during answer generation."
        generation_time_ms = round((time.time() - gen_start) * 1000, 2)
    else:
        answer = "I don't have enough information to answer that confidently. Let me connect you with a human."
        generation_time_ms = 0.0

    total_time_ms = round((time.time() - total_start) * 1000, 2)

    # --------------------------------------------------
    # Fire-and-forget: log conversation
    # --------------------------------------------------
    try:
        import asyncio
        rag.sheets_logger.log_conversation({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "user_phone": body.user_phone,
            "question": body.question,
            "answer": answer,
            "confidence": confidence,
            "sources": [{"filename": c.filename, "page": c.page, "text": c.text[:200]} for c in chunks_retrieved],
            "escalated": escalated,
            "response_time_ms": total_time_ms,
        })
    except Exception:
        pass

    logger.info(
        f"Playground query completed: embed={embedding_time_ms}ms, "
        f"retrieve={retrieval_time_ms}ms, generate={generation_time_ms}ms, "
        f"tokens={tokens_used}, total={total_time_ms}ms"
    )

    return PlaygroundQueryResponse(
        answer=answer,
        confidence=round(confidence, 4),
        escalated=escalated,
        chunks_used=len(results),
        chunks_retrieved=chunks_retrieved,
        embedding_dimensions=embedding_dimensions,
        embedding_time_ms=embedding_time_ms,
        retrieval_time_ms=retrieval_time_ms,
        generation_time_ms=generation_time_ms,
        tokens_used=tokens_used,
        model=model_used,
        total_time_ms=total_time_ms,
    )
