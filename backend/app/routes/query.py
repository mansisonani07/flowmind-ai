import asyncio
import time
from collections import defaultdict
from datetime import datetime, timezone
from typing import Dict, List

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from app.models.schemas import QueryRequest, QueryResponse, ConversationLog

router = APIRouter()

# Simple in-memory rate limiter for the /query endpoint: 20 req/min per client
_query_timestamps: Dict[str, List[float]] = defaultdict(list)
_QUERY_LIMIT = 20
_QUERY_WINDOW = 60  # seconds


def _check_rate_limit(client_key: str) -> bool:
    """Return True if the request is within rate limits."""
    now = time.time()
    cutoff = now - _QUERY_WINDOW
    # Clean old entries
    _query_timestamps[client_key] = [
        ts for ts in _query_timestamps[client_key] if ts > cutoff
    ]
    if len(_query_timestamps[client_key]) >= _QUERY_LIMIT:
        return False
    _query_timestamps[client_key].append(now)
    return True


@router.post("/query", response_model=QueryResponse)
async def query_rag(request: Request, body: QueryRequest) -> QueryResponse:
    """Process a user question against the RAG pipeline."""
    # Rate limiting by client IP
    client_ip = request.client.host if request.client else "unknown"
    if not _check_rate_limit(client_ip):
        return JSONResponse(
            status_code=429,
            content={"detail": "Rate limit exceeded. Max 20 requests per minute."},
        )  # type: ignore[return-value]

    start = time.time()
    rag = request.app.state.rag_engine

    try:
        result = rag.query(body.question, user_phone=body.user_phone)
    except Exception as exc:
        from app.utils.logger import logger
        logger.error(f"Query processing failed: {exc}")
        return JSONResponse(
            status_code=500,
            content={"detail": f"Query processing failed: {str(exc)}"},
        )  # type: ignore[return-value]

    elapsed_ms = round((time.time() - start) * 1000, 2)
    result["response_time_ms"] = elapsed_ms

    # Fire-and-forget: log conversation to sheets
    async def _log_async():
        try:
            rag.sheets_logger.log_conversation({
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "user_phone": body.user_phone,
                "question": body.question,
                "answer": result["answer"],
                "confidence": result["confidence"],
                "sources": result.get("sources", []),
                "escalated": result.get("escalated", False),
                "response_time_ms": result.get("response_time_ms", 0),
            })
        except Exception:
            pass

    asyncio.create_task(_log_async())

    # Fire-and-forget: send Telegram alert if escalated
    if result.get("escalated", False):
        async def _alert_async():
            try:
                await rag.telegram.send_escalation_alert(
                    question=body.question,
                    user_phone=body.user_phone,
                    confidence=result.get("confidence", 0.0),
                )
            except Exception:
                pass

        asyncio.create_task(_alert_async())

    return QueryResponse(**result)
