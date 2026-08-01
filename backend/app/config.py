from typing import List, Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables and .env file."""

    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    CHROMA_PERSIST_DIR: str = "/tmp/chroma_db"
    CHROMA_COLLECTION_NAME: str = "flowmind_docs"
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 50
    CONFIDENCE_THRESHOLD: float = 0.6
    TOP_K_RESULTS: int = 3
    GOOGLE_SHEETS_ID: Optional[str] = None
    GOOGLE_CREDS_JSON: Optional[str] = None
    TELEGRAM_BOT_TOKEN: Optional[str] = None
    TELEGRAM_ADMIN_CHAT_ID: Optional[str] = None
    DEMO_MODE: bool = True
    CORS_ORIGINS: List[str] = ["*"]
    LOG_LEVEL: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )


settings = Settings()
