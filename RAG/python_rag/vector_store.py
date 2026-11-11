import os
import uuid
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple, Iterable, Type
from datetime import datetime, timezone

from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings
from langchain_core.vectorstores import VectorStore

from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
    MatchAny,
    PointIdsList,
)

from .config import settings

class QdrantVectorStore(VectorStore):
    """
    Production-grade LangChain Vector Store backed by Qdrant.
    Provides persistent vector storage, HNSW-indexed cosine similarity search,
    payload metadata filtering, deterministic UUID point mapping, incremental updates,
    and safe collection lifecycle management.
    """
    def __init__(
        self,
        embedding_function: Embeddings,
        collection_name: str = settings.COLLECTION_NAME,
        storage_path: Optional[Path] = None,
        client: Optional[QdrantClient] = None,
    ):
        self._embedding_function = embedding_function
        self.collection_name = collection_name
        self.storage_path = Path(storage_path or settings.QDRANT_STORAGE_PATH)

        if client:
            self._client = client
        elif settings.QDRANT_URL:
            self._client = QdrantClient(
                url=settings.QDRANT_URL,
                api_key=settings.QDRANT_API_KEY or None,
                timeout=settings.REQUEST_TIMEOUT_SECONDS,
            )
        else:
            self.storage_path.mkdir(parents=True, exist_ok=True)
            self._client = QdrantClient(path=str(self.storage_path))

        self._ensure_collection_exists()

    @property
    def embeddings(self) -> Embeddings:
        return self._embedding_function

    @property
    def client(self) -> QdrantClient:
        return self._client

    def _ensure_collection_exists(self) -> None:
        """Creates collection if it does not already exist, or validates dimension if it does."""
        try:
            if not self._client.collection_exists(collection_name=self.collection_name):
                print(f"[QdrantVectorStore] Creating collection '{self.collection_name}' (size={settings.EMBEDDING_DIMENSION}, distance=COSINE)...")
                self._client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(
                        size=settings.EMBEDDING_DIMENSION,
                        distance=Distance.COSINE,
                    ),
                )
            else:
                info = self._client.get_collection(collection_name=self.collection_name)
                vectors_config = getattr(info.config.params, "vectors", None)
                existing_dim = None
                if hasattr(vectors_config, "size"):
                    existing_dim = vectors_config.size
                elif isinstance(vectors_config, dict) and "" in vectors_config:
                    existing_dim = getattr(vectors_config[""], "size", None)
                elif hasattr(vectors_config, "params") and hasattr(vectors_config.params, "size"):
                    existing_dim = vectors_config.params.size

                if existing_dim is not None and existing_dim != settings.EMBEDDING_DIMENSION:
                    raise ValueError(
                        f"FATAL VECTOR MISMATCH: Collection '{self.collection_name}' has vector dimension {existing_dim}, "
                        f"but configured embedding dimension is {settings.EMBEDDING_DIMENSION}. "
                        f"Reindexing is required when changing embedding models or vector dimensions."
                    )
        except Exception as e:
            print(f"[QdrantVectorStore] Collection check/creation: {e}")
            raise

    def _to_uuid(self, doc_id: str) -> str:
        """Converts an arbitrary string doc_id into a deterministic UUID string."""
        if not doc_id:
            return str(uuid.uuid4())
        try:
            # Check if already a valid UUID
            return str(uuid.UUID(doc_id))
        except ValueError:
            # Deterministic UUID5 based on DNS namespace
            return str(uuid.uuid5(uuid.NAMESPACE_DNS, doc_id))

    def _build_qdrant_filter(self, filter_dict: Optional[Dict[str, Any]]) -> Optional[Filter]:
        """Translates a simple key-value metadata filter dict into Qdrant Filter conditions."""
        if not filter_dict:
            return None

        conditions = []
        for key, val in filter_dict.items():
            if val is None:
                continue
            if isinstance(val, list):
                conditions.append(FieldCondition(key=key, match=MatchAny(any=val)))
            else:
                conditions.append(FieldCondition(key=key, match=MatchValue(value=val)))

        if not conditions:
            return None
        return Filter(must=conditions)

    def count(self) -> int:
        """Returns the total number of indexed vectors in the collection."""
        try:
            if not self._client.collection_exists(collection_name=self.collection_name):
                return 0
            info = self._client.get_collection(collection_name=self.collection_name)
            return info.points_count or 0
        except Exception:
            return 0

    def add_texts(
        self,
        texts: Iterable[str],
        metadatas: Optional[List[dict]] = None,
        ids: Optional[List[str]] = None,
        batch_size: int = 64,
        **kwargs: Any,
    ) -> List[str]:
        """Embeds and upserts texts with metadata into Qdrant in batches."""
        text_list = list(texts)
        if not text_list:
            return []

        generated_ids: List[str] = []
        meta_list = metadatas if metadatas else [{} for _ in text_list]

        # Process in batches
        for i in range(0, len(text_list), batch_size):
            b_texts = text_list[i : i + batch_size]
            b_metas = meta_list[i : i + batch_size]
            b_ids = (ids[i : i + batch_size]) if ids else None

            # Generate semantic vectors
            vectors = self._embedding_function.embed_documents(b_texts)

            points: List[PointStruct] = []
            for j, (text, vec) in enumerate(zip(b_texts, vectors)):
                raw_id = (b_ids[j] if b_ids and j < len(b_ids) else None)
                if not raw_id:
                    meta_id = b_metas[j].get("id") if j < len(b_metas) else None
                    raw_id = meta_id or f"doc_{i + j}_{uuid.uuid4().hex[:8]}"

                point_uuid = self._to_uuid(raw_id)
                generated_ids.append(raw_id)

                payload = dict(b_metas[j]) if j < len(b_metas) else {}
                payload["id"] = raw_id
                payload["page_content"] = text
                payload["indexed_at"] = datetime.now(timezone.utc).isoformat()
                payload["embedding_model"] = getattr(self._embedding_function, "model_name", settings.EMBEDDING_MODEL_NAME)
                payload["embedding_version"] = getattr(self._embedding_function, "version", settings.EMBEDDING_VERSION)

                points.append(PointStruct(
                    id=point_uuid,
                    vector=vec,
                    payload=payload,
                ))

            self._client.upsert(
                collection_name=self.collection_name,
                points=points,
                wait=True,
            )

        return generated_ids

    def add_documents(self, documents: List[Document], batch_size: int = 64, **kwargs: Any) -> List[str]:
        """Adds a list of LangChain Documents into Qdrant."""
        texts = [doc.page_content for doc in documents]
        metadatas = [doc.metadata for doc in documents]
        ids = [doc.metadata.get("id") for doc in documents]
        return self.add_texts(texts=texts, metadatas=metadatas, ids=ids, batch_size=batch_size, **kwargs)

    def similarity_search_by_vector_with_score(
        self,
        embedding: List[float],
        k: int = 4,
        filter: Optional[Dict[str, Any]] = None,
        min_score: float = 0.0,
        **kwargs: Any,
    ) -> List[Tuple[Document, float]]:
        """Performs vector similarity search against Qdrant collection."""
        if not self._client.collection_exists(self.collection_name):
            return []

        q_filter = self._build_qdrant_filter(filter)

        try:
            search_result = self._client.query_points(
                collection_name=self.collection_name,
                query=embedding,
                query_filter=q_filter,
                limit=k,
                with_payload=True,
            )
            points = search_result.points
        except Exception as e:
            print(f"[QdrantVectorStore] Search query failed: {e}")
            return []

        results: List[Tuple[Document, float]] = []
        for pt in points:
            score = float(pt.score) if pt.score is not None else 0.0
            if score < min_score:
                continue

            payload = pt.payload or {}
            content = payload.get("page_content", "")
            meta = {k: v for k, v in payload.items() if k != "page_content"}
            meta["score"] = score
            meta["point_id"] = str(pt.id)

            results.append((Document(page_content=content, metadata=meta), score))

        return results

    def similarity_search_with_score(
        self,
        query: str,
        k: int = 4,
        filter: Optional[Dict[str, Any]] = None,
        min_score: float = 0.0,
        **kwargs: Any,
    ) -> List[Tuple[Document, float]]:
        """Embeds query and searches for most similar documents with similarity scores."""
        query_vec = self._embedding_function.embed_query(query)
        return self.similarity_search_by_vector_with_score(
            embedding=query_vec, k=k, filter=filter, min_score=min_score, **kwargs
        )

    def similarity_search(
        self,
        query: str,
        k: int = 4,
        filter: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> List[Document]:
        """Returns top-k most similar LangChain Documents."""
        results = self.similarity_search_with_score(query, k=k, filter=filter, **kwargs)
        return [doc for doc, _ in results]

    def delete(self, ids: Optional[List[str]] = None, **kwargs: Any) -> Optional[bool]:
        """Deletes documents by their original IDs or UUIDs."""
        if not ids:
            return False

        point_uuids = [self._to_uuid(i) for i in ids]
        self._client.delete(
            collection_name=self.collection_name,
            points_selector=PointIdsList(points=point_uuids),
            wait=True,
        )
        return True

    def clear(self) -> None:
        """Safely snapshots (if populated), deletes, and recreates the collection."""
        try:
            if self._client.collection_exists(self.collection_name):
                # Attempt backup snapshot if points exist
                try:
                    cnt = self.count()
                    if cnt > 0:
                        self.create_snapshot()
                except Exception as snap_err:
                    print(f"[QdrantVectorStore] Pre-clear snapshot note: {snap_err}")

                self._client.delete_collection(self.collection_name)
            self._client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(
                    size=settings.EMBEDDING_DIMENSION,
                    distance=Distance.COSINE,
                ),
            )
            print(f"[QdrantVectorStore] Collection '{self.collection_name}' safely recreated.")
        except Exception as e:
            print(f"[QdrantVectorStore] Error clearing collection: {e}")
            raise

    def create_snapshot(self) -> Optional[str]:
        """Creates a snapshot of the collection for backup and recovery."""
        try:
            snapshot = self._client.create_snapshot(collection_name=self.collection_name)
            return snapshot.name if snapshot else None
        except Exception as e:
            print(f"[QdrantVectorStore] Failed to create snapshot: {e}")
            return None

    @classmethod
    def from_texts(
        cls: Type["QdrantVectorStore"],
        texts: List[str],
        embedding: Embeddings,
        metadatas: Optional[List[dict]] = None,
        **kwargs: Any,
    ) -> "QdrantVectorStore":
        store = cls(embedding_function=embedding, **kwargs)
        store.add_texts(texts=texts, metadatas=metadatas)
        return store

    @classmethod
    def from_documents(
        cls: Type["QdrantVectorStore"],
        documents: List[Document],
        embedding: Embeddings,
        **kwargs: Any,
    ) -> "QdrantVectorStore":
        store = cls(embedding_function=embedding, **kwargs)
        store.add_documents(documents=documents)
        return store

# Backward-compatibility alias during migration
JSONVectorStore = QdrantVectorStore

