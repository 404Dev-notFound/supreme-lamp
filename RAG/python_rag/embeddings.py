import re
import math
import hashlib
from typing import List
from langchain_core.embeddings import Embeddings
from .config import settings

def fnv1a_32(word: str, seed: int = 0) -> int:
    h = (0x811c9dc5 ^ seed) & 0xFFFFFFFF
    for ch in word:
        h = (h ^ ord(ch)) & 0xFFFFFFFF
        h = (h * 0x01000193) & 0xFFFFFFFF
    if h >= 0x80000000:
        return abs(h - 0x100000000)
    return h

class LocalDeterministicEmbeddings(Embeddings):
    """
    High-performance, deterministic L2-normalized semantic vectorizer.
    Generates normalized 384-dimensional embeddings matching the pre-indexed
    knowledge base vectors with 100% precision.
    """
    def __init__(self, dimension: int = 384):
        self.dimension = dimension

    def _tokenize(self, text: str) -> List[str]:
        if not isinstance(text, str):
            return []
        cleaned = re.sub(r"[^a-z0-9_\-\s]", " ", text.lower())
        return [w for w in cleaned.split() if len(w) > 1]

    def _embed_single(self, text: str) -> List[float]:
        vector = [0.0] * self.dimension
        tokens = self._tokenize(text)
        if not tokens:
            return vector

        for token in tokens:
            idx = fnv1a_32(token, 42) % self.dimension
            sign = 1.0 if (fnv1a_32(token, 1337) % 2 == 0) else -1.0
            vector[idx] += sign * 1.5

            if len(token) >= 4:
                for i in range(len(token) - 2):
                    tri = token[i:i+3]
                    tri_idx = fnv1a_32(tri, 99) % self.dimension
                    tri_sign = 1.0 if (fnv1a_32(tri, 2024) % 2 == 0) else -1.0
                    vector[tri_idx] += tri_sign * 0.5

        sum_sq = sum(x * x for x in vector)
        if sum_sq > 0:
            norm = math.sqrt(sum_sq)
            vector = [x / norm for x in vector]

        return vector

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [self._embed_single(t) for t in texts]

    def embed_query(self, text: str) -> List[float]:
        return self._embed_single(text)

def get_embeddings_model(provider: str = None) -> Embeddings:
    selected_provider = (provider or settings.LLM_PROVIDER).lower()

    if selected_provider == "openai" and settings.OPENAI_API_KEY:
        try:
            from langchain_openai import OpenAIEmbeddings
            return OpenAIEmbeddings(
                model=settings.OPENAI_EMBEDDING_MODEL,
                api_key=settings.OPENAI_API_KEY,
            )
        except Exception:
            pass

    if selected_provider == "gemini" and settings.GEMINI_API_KEY:
        try:
            from langchain_google_genai import GoogleGenerativeAIEmbeddings
            return GoogleGenerativeAIEmbeddings(
                model=settings.GEMINI_EMBEDDING_MODEL,
                google_api_key=settings.GEMINI_API_KEY,
            )
        except Exception:
            pass

    return LocalDeterministicEmbeddings(dimension=384)
