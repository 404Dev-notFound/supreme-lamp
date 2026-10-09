import json
import math
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple, Iterable, Type
from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings
from langchain_core.vectorstores import VectorStore
from .config import settings

def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0
    dot = 0.0
    norm_a = 0.0
    norm_b = 0.0
    for a, b in zip(vec_a, vec_b):
        dot += a * b
        norm_a += a * a
        norm_b += b * b
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot / (math.sqrt(norm_a) * math.sqrt(norm_b))

class JSONVectorStore(VectorStore):
    """
    Persistent LangChain Vector Store backed by structured JSON storage.
    Supports cosine similarity search, threshold filtering, metadata filtering,
    and seamless loading of pre-indexed vector stores.
    """
    def __init__(self, embedding_function: Embeddings, storage_path: Path = settings.VECTOR_STORE_PATH):
        self._embedding_function = embedding_function
        self.storage_path = Path(storage_path)
        self.documents: List[Document] = []
        self.vectors: List[List[float]] = []
        self._ids: List[str] = []

    @property
    def embeddings(self) -> Embeddings:
        return self._embedding_function

    def add_texts(
        self,
        texts: Iterable[str],
        metadatas: Optional[List[dict]] = None,
        ids: Optional[List[str]] = None,
        **kwargs: Any,
    ) -> List[str]:
        text_list = list(texts)
        if not text_list:
            return []

        embedded = self._embedding_function.embed_documents(text_list)
        generated_ids: List[str] = []

        for i, (text, vec) in enumerate(zip(text_list, embedded)):
            doc_id = (ids[i] if ids and i < len(ids) else f"doc_{len(self.documents)}_{i}")
            meta = metadatas[i] if metadatas and i < len(metadatas) else {}
            meta["id"] = doc_id

            doc = Document(page_content=text, metadata=meta)
            self.documents.append(doc)
            self.vectors.append(vec)
            self._ids.append(doc_id)
            generated_ids.append(doc_id)

        return generated_ids

    def add_documents(self, documents: List[Document], **kwargs: Any) -> List[str]:
        texts = [doc.page_content for doc in documents]
        metadatas = [doc.metadata for doc in documents]
        ids = [doc.metadata.get("id") for doc in documents]
        return self.add_texts(texts=texts, metadatas=metadatas, ids=ids, **kwargs)

    def similarity_search_by_vector_with_score(
        self,
        embedding: List[float],
        k: int = 4,
        filter: Optional[Dict[str, Any]] = None,
        min_score: float = 0.0,
        **kwargs: Any,
    ) -> List[Tuple[Document, float]]:
        if not self.vectors:
            return []

        scored: List[Tuple[Document, float]] = []

        for doc, doc_vec in zip(self.documents, self.vectors):
            # Apply metadata filter if present
            if filter:
                match = True
                for fk, fv in filter.items():
                    doc_val = doc.metadata.get(fk)
                    if isinstance(fv, list):
                        if isinstance(doc_val, list):
                            if not any(v in doc_val for v in fv):
                                match = False; break
                        elif doc_val not in fv:
                            match = False; break
                    elif isinstance(doc_val, list):
                        if fv not in doc_val:
                            match = False; break
                    elif doc_val != fv:
                        match = False; break
                if not match:
                    continue

            score = cosine_similarity(embedding, doc_vec)
            if score >= min_score:
                scored.append((doc, score))

        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[:k]

    def similarity_search_with_score(
        self,
        query: str,
        k: int = 4,
        filter: Optional[Dict[str, Any]] = None,
        min_score: float = 0.0,
        **kwargs: Any,
    ) -> List[Tuple[Document, float]]:
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
        results = self.similarity_search_with_score(query, k=k, filter=filter, **kwargs)
        return [doc for doc, _ in results]

    def save_local(self, path: Optional[Path] = None) -> None:
        save_path = Path(path or self.storage_path)
        save_path.parent.mkdir(parents=True, exist_ok=True)

        payload = []
        for doc_id, doc, vec in zip(self._ids, self.documents, self.vectors):
            payload.append({
                "id": doc_id,
                "content": doc.page_content,
                "vector": vec,
                "metadata": doc.metadata,
            })

        with open(save_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)

    def load_local(self, path: Optional[Path] = None) -> int:
        load_path = Path(path or self.storage_path)
        if not load_path.exists():
            return 0

        with open(load_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        if not isinstance(data, list):
            return 0

        self.documents = []
        self.vectors = []
        self._ids = []

        for item in data:
            doc_id = item.get("id", f"doc_{len(self.documents)}")
            content = item.get("content", "")
            vector = item.get("vector", [])
            metadata = item.get("metadata", {})
            metadata["id"] = doc_id

            self.documents.append(Document(page_content=content, metadata=metadata))
            self.vectors.append(vector)
            self._ids.append(doc_id)

        return len(self.documents)

    @classmethod
    def from_texts(
        cls: Type["JSONVectorStore"],
        texts: List[str],
        embedding: Embeddings,
        metadatas: Optional[List[dict]] = None,
        **kwargs: Any,
    ) -> "JSONVectorStore":
        store = cls(embedding_function=embedding, **kwargs)
        store.add_texts(texts=texts, metadatas=metadatas)
        return store

    @classmethod
    def from_documents(
        cls: Type["JSONVectorStore"],
        documents: List[Document],
        embedding: Embeddings,
        **kwargs: Any,
    ) -> "JSONVectorStore":
        store = cls(embedding_function=embedding, **kwargs)
        store.add_documents(documents=documents)
        return store
