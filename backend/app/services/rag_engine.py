import time
from datetime import datetime, timezone
from typing import Any, Dict, List

from app.config import settings
from app.database.chroma_client import ChromaClient
from app.database.sheets_client import SheetsLogger
from app.services.embedder import Embedder
from app.services.groq_client import GroqClient
from app.services.telegram_notifier import TelegramNotifier
from app.services.document_processor import extract_text_from_pdf, chunk_text
from app.utils.logger import logger


class RAGEngine:
    """Orchestrates document ingestion and RAG queries."""

    def __init__(self) -> None:
        logger.info("Initializing RAG Engine...")
        self.embedder = Embedder(model_name=settings.EMBEDDING_MODEL)
        self.chroma_client = ChromaClient(
            persist_directory=settings.CHROMA_PERSIST_DIR,
            collection_name=settings.CHROMA_COLLECTION_NAME,
        )
        self.groq_client = GroqClient(
            api_key=settings.GROQ_API_KEY,
            model=settings.GROQ_MODEL,
        )
        self.sheets_logger = SheetsLogger(
            sheets_id=settings.GOOGLE_SHEETS_ID,
            creds_json=settings.GOOGLE_CREDS_JSON,
        )
        self.telegram = TelegramNotifier(
            bot_token=settings.TELEGRAM_BOT_TOKEN,
            admin_chat_id=settings.TELEGRAM_ADMIN_CHAT_ID,
        )
        logger.info("RAG Engine initialized")

    def ingest_document(self, pdf_bytes: bytes, filename: str) -> Dict[str, Any]:
        logger.info(f"Ingesting document: {filename}")
        pages = extract_text_from_pdf(pdf_bytes)
        if not pages:
            raise ValueError(f"No text could be extracted from {filename}")
        chunks = chunk_text(
            pages,
            chunk_size=settings.CHUNK_SIZE,
            overlap=settings.CHUNK_OVERLAP,
        )
        if not chunks:
            raise ValueError(f"No chunks created from {filename}")
        texts = [c["text"] for c in chunks]
        embeddings = self.embedder.embed_batch(texts)
        for chunk, emb in zip(chunks, embeddings):
            chunk["id"] = f"{filename}__chunk_{chunk['chunk_index']}"
            chunk["embedding"] = emb
        count = self.chroma_client.add_documents(chunks, filename)
        logger.info(f"Document {filename}: {count} chunks indexed")
        return {
            "status": "success",
            "chunks_created": count,
            "filename": filename,
        }

    def query(self, question: str, user_phone: str = "unknown") -> Dict[str, Any]:
        start = time.time()
        query_embedding = self.embedder.embed_text(question)
        results = self.chroma_client.query(query_embedding, settings.TOP_K_RESULTS)
        distances = [r["distance"] for r in results] if results else [1.0]
        confidence = self.calculate_confidence(distances)
        elapsed_ms = round((time.time() - start) * 1000, 2)

        if confidence < settings.CONFIDENCE_THRESHOLD:
            answer = "I don't have enough information to answer that confidently. Let me connect you with a human."
            response = {
                "answer": answer,
                "sources": [],
                "confidence": confidence,
                "escalated": True,
                "chunks_used": 0,
                "response_time_ms": elapsed_ms,
            }
            self._log_conversation(question, response, user_phone)
            return response

        llm_result = self.groq_client.generate_answer(question, results)
        sources = [
            {"filename": r["filename"], "page": r["page"], "text": r["text"][:200]}
            for r in results
        ]
        response = {
            "answer": llm_result["answer"],
            "sources": sources,
            "confidence": confidence,
            "escalated": False,
            "chunks_used": len(results),
            "response_time_ms": elapsed_ms,
        }
        self._log_conversation(question, response, user_phone)
        return response

    def calculate_confidence(self, distances: List[float]) -> float:
        if not distances:
            return 0.0
        confidence = 1.0 - min(distances)
        return max(0.0, min(1.0, confidence))

    def _log_conversation(self, question: str, response: Dict[str, Any], user_phone: str) -> None:
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "user_phone": user_phone,
            "question": question,
            "answer": response["answer"],
            "confidence": response["confidence"],
            "sources": response.get("sources", []),
            "escalated": response.get("escalated", False),
            "response_time_ms": response.get("response_time_ms", 0),
        }
        try:
            self.sheets_logger.log_conversation(log_entry)
        except Exception as exc:
            logger.warning(f"Failed to log conversation: {exc}")
