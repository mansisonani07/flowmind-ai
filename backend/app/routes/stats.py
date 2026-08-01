from typing import Any, Dict

from fastapi import APIRouter, Request, Query as QueryParam
from fastapi.responses import JSONResponse

from app.models.schemas import StatsResponse
from app.utils.logger import logger

router = APIRouter()


@router.get("/stats", response_model=StatsResponse)
async def get_stats(
    request: Request,
    days: int = QueryParam(default=7, ge=1, le=365, description="Number of days to include in stats"),
) -> StatsResponse:
    """Get combined statistics from ChromaDB and conversation logs."""
    rag = request.app.state.rag_engine

    # Get ChromaDB stats
    try:
        chroma_stats = rag.chroma_client.get_stats()
    except Exception as exc:
        logger.warning(f"Failed to get ChromaDB stats: {exc}")
        chroma_stats = {"total_documents": 0, "total_chunks": 0}

    # Get query/conversation stats from sheets logger
    query_stats: Dict[str, Any] = {
        "total_queries": 0,
        "avg_confidence": 0.0,
        "escalation_rate": 0.0,
        "popular_questions": [],
        "daily_query_count": [],
        "avg_response_time": 0.0,
    }

    try:
        query_stats = rag.sheets_logger.get_stats(days)
    except Exception as exc:
        logger.warning(f"Failed to get sheets stats: {exc}")

    return StatsResponse(
        total_documents=chroma_stats.get("total_documents", 0),
        total_chunks=chroma_stats.get("total_chunks", 0),
        total_queries=query_stats.get("total_queries", 0),
        avg_confidence=query_stats.get("avg_confidence", 0.0),
        escalation_rate=query_stats.get("escalation_rate", 0.0),
        popular_questions=query_stats.get("popular_questions", []),
        daily_query_count=query_stats.get("daily_query_count", []),
        avg_response_time=query_stats.get("avg_response_time", 0.0),
    )
