import os
import time
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from app.config import settings
from app.middleware.rate_limiter import RateLimiter, create_rate_limit_middleware
from app.utils.logger import logger, setup_logger


LOGO = """
  ____       _       ____  __
 |  _ \  ___| |__   |  \/  | ___  _ __
 | | | |/ _ \ '_ \  | |\/| |/ _ \| '_ \
 | |_| |  __/ |_) | | |  | | (_) | | | |
 |____/ \___|_.__/  |_|  |_|\___/|_| |_|
"""


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """Manage application startup and shutdown."""
    logger.info(LOGO)
    logger.info("FlowMind AI v1.0.0 starting up...")
    start_time = time.time()

    from app.services.rag_engine import RAGEngine
    app.state.rag_engine = RAGEngine()
    app.state.start_time = start_time

    if settings.DEMO_MODE:
        logger.info("Demo mode enabled - loading sample data")
        _load_demo_data(app)

    elapsed = round(time.time() - start_time, 2)
    logger.info(f"FlowMind AI started in {elapsed}s")
    yield
    logger.info("FlowMind AI shutting down...")


def _load_demo_data(app: FastAPI) -> None:
    """Load demo PDF data if available."""
    demo_dir = os.path.join(os.path.dirname(__file__), "..", "sample_data")
    if not os.path.isdir(demo_dir):
        logger.info("No demo_data directory found, skipping")
        return
    import glob
    for pdf_path in glob.glob(os.path.join(demo_dir, "*.pdf")):
        filename = os.path.basename(pdf_path)
        try:
            with open(pdf_path, "rb") as f:
                pdf_bytes = f.read()
            result = app.state.rag_engine.ingest_document(pdf_bytes, filename)
            logger.info(f"Demo document loaded: {filename} ({result['chunks_created']} chunks)")
        except Exception as exc:
            logger.warning(f"Failed to load demo document {filename}: {exc}")


app = FastAPI(
    title="FlowMind AI",
    description="RAG-powered business assistant API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rate_limiter = RateLimiter()
app.add_middleware(create_rate_limit_middleware(rate_limiter))


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    from fastapi.responses import JSONResponse
    logger.warning(f"ValueError: {exc}")
    return JSONResponse(status_code=400, content={"detail": str(exc)})


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    from fastapi.responses import JSONResponse
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.get("/")
async def root():
    return RedirectResponse(url="/health")


from app.routes import upload, query, stats, documents, health
from app.routes import websocket, playground, insights, costs, businesses, notifications, conversations_advanced

app.include_router(health.router, tags=["Health"])
app.include_router(upload.router, tags=["Upload"])
app.include_router(query.router, tags=["Query"])
app.include_router(stats.router, tags=["Stats"])
app.include_router(documents.router, tags=["Documents"])

# New routers
app.include_router(websocket.router, tags=["WebSocket"])
app.include_router(playground.router, tags=["Playground"])
app.include_router(insights.router, tags=["Insights"])
app.include_router(costs.router, tags=["Costs"])
app.include_router(businesses.router, tags=["Businesses"])
app.include_router(notifications.router, tags=["Notifications"])
app.include_router(conversations_advanced.router, tags=["Conversations Advanced"])
logger.info("All routers registered")
