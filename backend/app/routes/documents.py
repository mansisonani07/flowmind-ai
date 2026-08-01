import asyncio
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from app.models.schemas import DocumentInfo, DocumentList
from app.utils.logger import logger

router = APIRouter()


@router.get("/documents", response_model=DocumentList)
async def list_documents(request: Request) -> DocumentList:
    """List all indexed documents."""
    rag = request.app.state.rag_engine
    try:
        filenames: List[str] = rag.chroma_client.list_documents()
    except Exception as exc:
        logger.error(f"Failed to list documents: {exc}")
        return JSONResponse(
            status_code=500,
            content={"detail": f"Failed to list documents: {str(exc)}"},
        )  # type: ignore[return-value]

    documents = []
    for fn in filenames:
        try:
            chunk_count = _count_chunks_for_file(rag, fn)
        except Exception:
            chunk_count = 0
        documents.append(
            DocumentInfo(
                filename=fn,
                chunk_count=chunk_count,
                uploaded_at="unknown",
            )
        )

    return DocumentList(documents=documents, total=len(documents))


def _count_chunks_for_file(rag, filename: str) -> int:
    """Count the number of chunks for a given filename in ChromaDB."""
    collection = rag.chroma_client._collection
    result = collection.get(where={"filename": filename}, include=[])
    return len(result["ids"]) if result and result.get("ids") else 0


@router.delete("/documents/{filename}")
async def delete_document(request: Request, filename: str) -> dict:
    """Delete a document and all its chunks from the index."""
    rag = request.app.state.rag_engine
    try:
        deleted_count = rag.chroma_client.delete_document(filename)
    except Exception as exc:
        logger.error(f"Failed to delete document {filename}: {exc}")
        return JSONResponse(
            status_code=500,
            content={"detail": f"Failed to delete document: {str(exc)}"},
        )  # type: ignore[return-value]

    return {"status": "deleted", "filename": filename, "chunks_removed": deleted_count}


@router.get("/documents/{filename}", response_model=DocumentInfo)
async def get_document(request: Request, filename: str) -> DocumentInfo:
    """Get details about a specific indexed document."""
    rag = request.app.state.rag_engine
    try:
        chunk_count = _count_chunks_for_file(rag, filename)
    except Exception as exc:
        logger.error(f"Failed to get document {filename}: {exc}")
        return JSONResponse(
            status_code=500,
            content={"detail": f"Failed to get document: {str(exc)}"},
        )  # type: ignore[return-value]

    # Attempt to find the earliest chunk timestamp if available
    uploaded_at = "unknown"
    try:
        collection = rag.chroma_client._collection
        result = collection.get(where={"filename": filename}, include=["metadatas"])
        if result and result.get("metadatas") and result["metadatas"][0]:
            first_meta = result["metadatas"][0]
            if "uploaded_at" in first_meta:
                uploaded_at = first_meta["uploaded_at"]
            else:
                uploaded_at = datetime.now(timezone.utc).isoformat()
    except Exception:
        uploaded_at = datetime.now(timezone.utc).isoformat()

    return DocumentInfo(
        filename=filename,
        chunk_count=chunk_count,
        uploaded_at=uploaded_at,
    )
