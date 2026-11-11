import hashlib
import json
from typing import List, Dict, Any, Optional
from langchain_core.documents import Document
from langchain_core.retrievers import BaseRetriever
from langchain_core.callbacks.manager import CallbackManagerForRetrieverRun
from pydantic import Field
from .vector_store import QdrantVectorStore
from .schemas import UserProfile
from .config import settings

_redis_client = None
_redis_checked = False

def get_redis_connection():
    global _redis_client, _redis_checked
    if _redis_checked:
        return _redis_client
    _redis_checked = True
    try:
        import redis
        if settings.REDIS_URL:
            client = redis.Redis.from_url(settings.REDIS_URL, socket_timeout=2.0)
        else:
            client = redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                password=settings.REDIS_PASSWORD or None,
                socket_timeout=2.0,
            )
        client.ping()
        _redis_client = client
        return _redis_client
    except Exception:
        _redis_client = None
        return None

def build_rag_cache_key(
    query: str,
    top_k: int,
    similarity_threshold: float,
    tenant_scope: str = "global",
    authorization_scope: str = "public",
    collection_name: str = "roadmaps",
    document_version: str = "v1",
    embedding_version: str = "v1",
    filters: Optional[Dict[str, Any]] = None,
) -> str:
    """
    Builds a secure, isolated, collision-resistant deterministic cache key for RAG queries.
    Prevents cross-user, cross-tenant, and cross-tier data leakage by explicitly incorporating:
    - Normalized query string (whitespace collapsed, lowercased)
    - Authorization/tenant scope (e.g. role, premium vs standard)
    - Vector collection and document version
    - Embedding model version
    - Retrieval hyperparameters (top_k, similarity_threshold)
    - Metadata filters
    """
    normalized_query = " ".join(query.strip().lower().split())
    filters_serialized = json.dumps(filters or {}, sort_keys=True)
    fingerprint = (
        f"q={normalized_query}|k={top_k}|th={similarity_threshold}|"
        f"tenant={tenant_scope}|auth={authorization_scope}|col={collection_name}|"
        f"doc_v={document_version}|emb_v={embedding_version}|f={filters_serialized}"
    )
    digest = hashlib.sha256(fingerprint.encode("utf-8")).hexdigest()[:32]
    return f"{settings.REDIS_KEY_PREFIX}retrieval:{tenant_scope}:{authorization_scope}:{digest}"

class FlowCTRLRetriever(BaseRetriever):
    """
    Hybrid semantic retriever with domain awareness and metadata filtering.
    Retrieves verified topics, prerequisites, curated resources, and projects.
    """
    vector_store: QdrantVectorStore = Field(...)
    top_k: int = Field(default=settings.TOP_K)
    similarity_threshold: float = Field(default=settings.SIMILARITY_THRESHOLD)
    tenant_scope: str = Field(default="global")
    authorization_scope: str = Field(default="public")
    collection_name: str = Field(default="roadmaps")
    document_version: str = Field(default_factory=lambda: settings.COLLECTION_VERSION)
    embedding_version: str = Field(default_factory=lambda: settings.EMBEDDING_VERSION)

    class Config:
        arbitrary_types_allowed = True

    def _get_relevant_documents(
        self, query: str, *, run_manager: Optional[CallbackManagerForRetrieverRun] = None
    ) -> List[Document]:
        redis_conn = get_redis_connection()
        cache_key = None

        if redis_conn:
            try:
                cache_key = build_rag_cache_key(
                    query=query,
                    top_k=self.top_k,
                    similarity_threshold=self.similarity_threshold,
                    tenant_scope=self.tenant_scope,
                    authorization_scope=self.authorization_scope,
                    collection_name=self.collection_name,
                    document_version=self.document_version,
                    embedding_version=self.embedding_version,
                )
                cached = redis_conn.get(cache_key)
                if cached:
                    data = json.loads(cached.decode("utf-8"))
                    return [Document(page_content=d["page_content"], metadata=d.get("metadata", {})) for d in data]
            except Exception:
                pass

        results = self.vector_store.similarity_search_with_score(
            query=query,
            k=self.top_k,
            min_score=self.similarity_threshold,
        )
        docs = [doc for doc, _ in results]

        if redis_conn and cache_key:
            try:
                serialized = json.dumps([{"page_content": d.page_content, "metadata": d.metadata} for d in docs])
                redis_conn.setex(cache_key, settings.RAG_CACHE_TTL, serialized)
            except Exception:
                pass

        return docs

    def retrieve_for_roadmap(
        self,
        user_profile: UserProfile,
        skill_gaps: Optional[List[str]] = None,
        k: Optional[int] = None,
    ) -> List[Document]:
        """
        Multi-angle retrieval for generating personalized roadmaps:
        1. Role & career goals semantic query
        2. Specific skill gap queries
        3. Prerequisite and project queries
        """
        target_k = k or self.top_k
        docs_by_id: Dict[str, Document] = {}

        # 1. Primary role query
        primary_query = f"{user_profile.targetRole} {user_profile.targetCompanyType} {' '.join(user_profile.careerGoals or [])}"
        primary_docs = self.vector_store.similarity_search_with_score(
            query=primary_query,
            k=target_k,
            min_score=self.similarity_threshold,
        )
        for doc, _ in primary_docs:
            doc_id = doc.metadata.get("id", str(hash(doc.page_content)))
            docs_by_id[doc_id] = doc

        # 2. Skill gap specific queries
        if skill_gaps:
            gap_query = f"learn {' '.join(skill_gaps[:5])}"
            gap_docs = self.vector_store.similarity_search_with_score(
                query=gap_query,
                k=6,
                min_score=self.similarity_threshold,
            )
            for doc, _ in gap_docs:
                doc_id = doc.metadata.get("id", str(hash(doc.page_content)))
                docs_by_id[doc_id] = doc

        # 3. Dedicated project & interview prep query for the role
        prep_query = f"{user_profile.targetRole} interview preparation capstone real-world project"
        prep_docs = self.vector_store.similarity_search_with_score(
            query=prep_query,
            k=4,
            min_score=self.similarity_threshold,
        )
        for doc, _ in prep_docs:
            doc_id = doc.metadata.get("id", str(hash(doc.page_content)))
            docs_by_id[doc_id] = doc

        return list(docs_by_id.values())

    def retrieve_for_recommendations(
        self,
        user_profile: UserProfile,
        completed_topics: List[str],
        remaining_gaps: Optional[List[str]] = None,
        k: int = 6,
    ) -> List[Document]:
        """Retrieves topics building upon recently completed topics."""
        completed_str = " ".join(completed_topics[-4:]) if completed_topics else ""
        gaps_str = " ".join(remaining_gaps[:4]) if remaining_gaps else ""
        query = f"{user_profile.targetRole} advanced after {completed_str} next {gaps_str}"

        results = self.vector_store.similarity_search_with_score(
            query=query,
            k=k,
            min_score=self.similarity_threshold,
        )
        # Filter out already completed topics
        completed_set = {c.lower().strip() for c in completed_topics}
        filtered: List[Document] = []
        for doc, _ in results:
            title = doc.metadata.get("title", "").lower().strip()
            if title not in completed_set:
                filtered.append(doc)

        return filtered

    @staticmethod
    def format_context(documents: List[Document]) -> str:
        """Formats list of retrieved documents into clean context block for LLM."""
        if not documents:
            return "No matching verified topics found in the knowledge base."

        formatted_blocks = []
        for doc in documents:
            formatted_blocks.append(doc.page_content.strip())

        return "\n\n---\n\n".join(formatted_blocks)
