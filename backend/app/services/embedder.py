import threading
import time
from typing import List

from app.utils.logger import logger


class Embedder:
    """Singleton sentence-embedder using sentence-transformers."""

    _instance = None
    _lock = threading.Lock()

    def __new__(cls, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    instance = super().__new__(cls)
                    instance._model = None
                    instance._model_name = model_name
                    instance._loaded = False
                    cls._instance = instance
        return cls._instance

    def _load_model(self) -> None:
        if self._loaded:
            return
        with self._lock:
            if self._loaded:
                return
            try:
                start = time.time()
                from sentence_transformers import SentenceTransformer
                self._model = SentenceTransformer(self._model_name)
                elapsed = round(time.time() - start, 2)
                logger.info(f"Embedding model loaded in {elapsed}s: {self._model_name}")
                self._loaded = True
            except Exception as exc:
                logger.error(f"Failed to load embedding model: {exc}")
                raise

    def embed_text(self, text: str) -> List[float]:
        self._load_model()
        try:
            embedding = self._model.encode(text, convert_to_numpy=True)
            return embedding.tolist()
        except Exception as exc:
            logger.error(f"Embedding failed: {exc}")
            return [0.0] * 384

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        self._load_model()
        try:
            embeddings = self._model.encode(texts, convert_to_numpy=True)
            return embeddings.tolist()
        except Exception as exc:
            logger.error(f"Batch embedding failed: {exc}")
            return [[0.0] * 384 for _ in texts]
