import time
from typing import Dict

from fastapi import APIRouter, Request

from app.config import settings
from app.models.schemas import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check(request: Request) -> HealthResponse:
    """Check the health of all services and return status."""
    services: Dict[str, bool] = {}

    # Check ChromaDB availability
    try:
        rag = request.app.state.rag_engine
        _ = rag.chroma_client._collection.count()
        services["chromadb"] = True
    except Exception:
        try:
            rag = request.app.state.rag_engine
            services["chromadb"] = rag.chroma_client._collection is not None
        except Exception:
            services["chromadb"] = False

    # Check Groq API key
    services["groq"] = bool(settings.GROQ_API_KEY and settings.GROQ_API_KEY.strip())

    # Check Google Sheets availability
    try:
        rag = request.app.state.rag_engine
        services["sheets"] = rag.sheets_logger.available
    except Exception:
        services["sheets"] = False

    # Check Telegram availability
    try:
        rag = request.app.state.rag_engine
        services["telegram"] = rag.telegram.available
    except Exception:
        services["telegram"] = False

    # Calculate uptime from app start time
    uptime_seconds = 0.0
    try:
        start_time = getattr(request.app.state, "start_time", None)
        if start_time is not None:
            uptime_seconds = round(time.time() - start_time, 2)
    except Exception:
        pass

    return HealthResponse(
        status="ok",
        version="1.0.0",
        services=services,
        uptime_seconds=uptime_seconds,
    )
