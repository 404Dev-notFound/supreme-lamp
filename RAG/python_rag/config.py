import os
from pathlib import Path
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load root .env and RAG/.env if present
root_dir = Path(__file__).resolve().parent.parent.parent
rag_dir = Path(__file__).resolve().parent.parent

load_dotenv(dotenv_path=root_dir / ".env")
load_dotenv(dotenv_path=rag_dir / ".env")

class RAGSettings(BaseSettings):
    # Server & Service Config
    HOST: str = os.getenv("RAG_HOST", "127.0.0.1")
    PORT: int = int(os.getenv("RAG_PORT", "8001"))
    ENVIRONMENT: str = os.getenv("NODE_ENV", "development")

    # LLM Provider: 'openai' | 'gemini' | 'groq' | 'local'
    LLM_PROVIDER: str = os.getenv("RAG_LLM_PROVIDER", "local").lower()

    # OpenAI Settings
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    OPENAI_EMBEDDING_MODEL: str = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")

    # Google Gemini Settings
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    GEMINI_EMBEDDING_MODEL: str = os.getenv("GEMINI_EMBEDDING_MODEL", "text-embedding-004")

    # Groq Settings
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    # Vector Storage & Retrieval
    DATA_DIR: Path = rag_dir / "data"
    KNOWLEDGE_BASE_DIR: Path = rag_dir / "knowledge_base"
    ROADMAP_DATA_DIR: Path = root_dir / "packages" / "roadmap-data" / "src" / "data"
    FLOWCTRL_DATA_DIR: Path = root_dir / "flowCTRL DATA"
    VECTOR_STORE_PATH: Path = rag_dir / "data" / "vector_store.json"

    CHUNK_SIZE: int = int(os.getenv("RAG_CHUNK_SIZE", "500"))
    CHUNK_OVERLAP: int = int(os.getenv("RAG_CHUNK_OVERLAP", "50"))
    TOP_K: int = int(os.getenv("RAG_TOP_K", "8"))
    SIMILARITY_THRESHOLD: float = float(os.getenv("RAG_SIMILARITY_THRESHOLD", "0.25"))
    MAX_CONTEXT_TOKENS: int = int(os.getenv("RAG_MAX_CONTEXT_TOKENS", "3500"))

    # Security
    ALLOW_PROMPT_OVERRIDE: bool = False

    # Centralized Redis Infrastructure Integration
    REDIS_URL: str = os.getenv("REDIS_URL", "")
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
    REDIS_PASSWORD: str = os.getenv("REDIS_PASSWORD", "")
    REDIS_KEY_PREFIX: str = os.getenv("REDIS_KEY_PREFIX", "fc:rag:")
    RAG_CACHE_TTL: int = int(os.getenv("RAG_CACHE_TTL", "1800"))
    COLLECTION_VERSION: str = os.getenv("RAG_COLLECTION_VERSION", "v1")
    EMBEDDING_VERSION: str = os.getenv("RAG_EMBEDDING_VERSION", "v1")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if self.ENVIRONMENT == "production" and self.REDIS_PASSWORD in [
            "redispassword9555",
            "password",
            "default",
            "123456",
        ]:
            raise ValueError(
                "FATAL SECURITY ERROR: In production, REDIS_PASSWORD cannot use default credentials."
            )

settings = RAGSettings()
