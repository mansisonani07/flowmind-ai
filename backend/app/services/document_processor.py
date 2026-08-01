import io
import re
from typing import Any, Dict, List

from PyPDF2 import PdfReader

from app.utils.logger import logger


def extract_text_from_pdf(file_bytes: bytes) -> List[Dict[str, Any]]:
    """Extract text from a PDF file, page by page."""
    pages: List[Dict[str, Any]] = []
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        for i, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            text = re.sub(r"\s+", " ", text).strip()
            if text:
                pages.append({"page": i + 1, "text": text})
        logger.info(f"Extracted text from {len(pages)} non-empty pages")
    except Exception as exc:
        logger.error(f"PDF extraction failed: {exc}")
        raise
    return pages


def chunk_text(
    pages: List[Dict[str, Any]],
    chunk_size: int = 500,
    overlap: int = 50,
) -> List[Dict[str, Any]]:
    """Split extracted pages into overlapping chunks."""
    full_text = ""
    page_map: List[tuple] = []
    for p in pages:
        start = len(full_text)
        full_text += p["text"] + " "
        page_map.append((start, len(full_text), p["page"]))
    full_text = full_text.strip()
    if not full_text:
        return []
    chunks: List[Dict[str, Any]] = []
    step = max(1, chunk_size - overlap)
    i = 0
    chunk_index = 0
    while i < len(full_text):
        end = min(i + chunk_size, len(full_text))
        text = full_text[i:end].strip()
        if len(text) < 20:
            i += step
            continue
        start_page = 1
        for s, e, pg in page_map:
            if i < e:
                start_page = pg
                break
        chunks.append({
            "text": text,
            "page": start_page,
            "chunk_index": chunk_index,
        })
        chunk_index += 1
        if end >= len(full_text):
            break
        i += step
    logger.info(f"Created {len(chunks)} chunks from {len(pages)} pages")
    return chunks
