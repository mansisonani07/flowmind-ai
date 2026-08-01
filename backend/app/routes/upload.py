import asyncio
from fastapi import APIRouter, Request, UploadFile, File
from fastapi.responses import JSONResponse

from app.models.schemas import UploadResponse
from app.utils.logger import logger

router = APIRouter()

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_EXTENSIONS = {".pdf"}


def _get_extension(filename: str) -> str:
    """Extract lowercase file extension from filename."""
    import os
    _, ext = os.path.splitext(filename or "")
    return ext.lower()


@router.post("/upload", response_model=UploadResponse)
async def upload_document(request: Request, file: UploadFile = File(...)) -> UploadResponse:
    """Upload and index a PDF document into the RAG system."""
    filename = file.filename or "unknown.pdf"
    extension = _get_extension(filename)

    # Validate file extension
    if extension not in ALLOWED_EXTENSIONS:
        return JSONResponse(
            status_code=400,
            content={"detail": f"Invalid file type '{extension}'. Only .pdf files are allowed."},
        )  # type: ignore[return-value]

    # Read file bytes
    try:
        file_bytes = await file.read()
    except Exception as exc:
        logger.error(f"Failed to read uploaded file: {exc}")
        return JSONResponse(
            status_code=400,
            content={"detail": "Failed to read uploaded file."},
        )  # type: ignore[return-value]

    # Validate file size
    if len(file_bytes) > MAX_FILE_SIZE:
        return JSONResponse(
            status_code=413,
            content={"detail": f"File too large. Maximum size is {MAX_FILE_SIZE // (1024 * 1024)} MB."},
        )  # type: ignore[return-value]

    if len(file_bytes) == 0:
        return JSONResponse(
            status_code=400,
            content={"detail": "Uploaded file is empty."},
        )  # type: ignore[return-value]

    rag = request.app.state.rag_engine

    # Ingest the document
    try:
        result = rag.ingest_document(file_bytes, filename)
    except ValueError as exc:
        logger.warning(f"Document processing error for {filename}: {exc}")
        return JSONResponse(
            status_code=400,
            content={"detail": str(exc)},
        )  # type: ignore[return-value]
    except Exception as exc:
        logger.error(f"Failed to ingest document {filename}: {exc}")
        return JSONResponse(
            status_code=500,
            content={"detail": f"Failed to process document: {str(exc)}"},
        )  # type: ignore[return-value]

    chunks_created = result.get("chunks_created", 0)

    # Fire-and-forget: send Telegram notification
    async def _notify_async():
        try:
            await rag.telegram.send_document_uploaded(filename, chunks_created)
        except Exception:
            pass

    asyncio.create_task(_notify_async())

    return UploadResponse(
        status="success",
        filename=filename,
        chunks_created=chunks_created,
        message=f"Document '{filename}' processed and indexed successfully.",
    )
