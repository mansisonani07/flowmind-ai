import threading
from typing import Any, Dict, List

import chromadb
from chromadb.config import Settings as ChromaSettings

from app.utils.logger import logger


class ChromaClient:
    """Wrapper around ChromaDB for document storage and retrieval."""

    def __init__(self, persist_directory: str, collection_name: str) -> None:
        self._lock = threading.Lock()
        try:
            self._client = chromadb.PersistentClient(
                path=persist_directory,
                settings=ChromaSettings(anonymized_telemetry=False),
            )
            self._collection = self._client.get_or_create_collection(
                name=collection_name,
                metadata={"hnsw:space": "cosine"},
            )
            logger.info(f"ChromaDB initialized: collection={collection_name}")
        except Exception as exc:
            logger.error(f"ChromaDB init failed: {exc}")
            raise

    def add_documents(self, chunks: List[Dict[str, Any]], filename: str) -> int:
        with self._lock:
            ids = []
            documents = []
            metadatas = []
            embeddings = []
            for chunk in chunks:
                chunk_id = chunk["id"]
                ids.append(chunk_id)
                documents.append(chunk["text"])
                metadatas.append({
                    "filename": filename,
                    "page": chunk.get("page", 0),
                    "chunk_index": chunk.get("chunk_index", 0),
                })
                embeddings.append(chunk["embedding"])
            try:
                self._collection.add(
                    ids=ids,
                    documents=documents,
                    metadatas=metadatas,
                    embeddings=embeddings,
                )
                logger.info(f"Added {len(ids)} chunks for {filename}")
                return len(ids)
            except Exception as exc:
                logger.error(f"Failed to add documents for {filename}: {exc}")
                return 0

    def query(self, query_embedding: List[float], top_k: int = 3) -> List[Dict[str, Any]]:
        try:
            results = self._collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                include=["documents", "metadatas", "distances"],
            )
            chunks = []
            if results and results["documents"] and results["documents"][0]:
                for i in range(len(results["documents"][0])):
                    distance = results["distances"][0][i]
                    chunks.append({
                        "text": results["documents"][0][i],
                        "filename": results["metadatas"][0][i]["filename"],
                        "page": results["metadatas"][0][i]["page"],
                        "chunk_index": results["metadatas"][0][i]["chunk_index"],
                        "distance": distance,
                        "similarity": 1.0 - distance,
                    })
            return chunks
        except Exception as exc:
            logger.error(f"ChromaDB query failed: {exc}")
            return []

    def delete_document(self, filename: str) -> int:
        with self._lock:
            try:
                existing = self._collection.get(where={"filename": filename})
                count = len(existing["ids"]) if existing and existing["ids"] else 0
                if count > 0:
                    self._collection.delete(where={"filename": filename})
                    logger.info(f"Deleted {count} chunks for {filename}")
                return count
            except Exception as exc:
                logger.error(f"Failed to delete document {filename}: {exc}")
                return 0

    def list_documents(self) -> List[str]:
        try:
            all_meta = self._collection.get(include=["metadatas"])
            if not all_meta or not all_meta["metadatas"]:
                return []
            filenames = set()
            for m in all_meta["metadatas"]:
                if "filename" in m:
                    filenames.add(m["filename"])
            return sorted(filenames)
        except Exception as exc:
            logger.error(f"Failed to list documents: {exc}")
            return []

    def get_stats(self) -> Dict[str, Any]:
        try:
            filenames = self.list_documents()
            all_data = self._collection.get(include=[])
            total_chunks = len(all_data["ids"]) if all_data and all_data["ids"] else 0
            return {
                "total_documents": len(filenames),
                "total_chunks": total_chunks,
            }
        except Exception as exc:
            logger.error(f"Failed to get ChromaDB stats: {exc}")
            return {"total_documents": 0, "total_chunks": 0}
