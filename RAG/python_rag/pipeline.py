import os
import time
from typing import List, Dict, Any, Optional
from langchain_core.documents import Document

from .config import settings
from .schemas import (
    UserProfile,
    SkillAssessmentResponse,
    RoadmapResponse,
    RecommendationResponse,
    QueryResultItem,
    QueryResponse,
    PersonalizedRoadmapResponse,
)
from .embeddings import get_embeddings_model
from .vector_store import QdrantVectorStore
from .document_processor import DocumentProcessor
from .retriever import FlowCTRLRetriever
from .skill_analyzer import SkillGapAnalyzer
from .generator import RoadmapGenerator
from .roadmap_catalog import RoadmapCatalog

class RAGPipeline:
    """
    Unified LangChain RAG Pipeline orchestrating:
    - Ingestion & Qdrant Vector Storage
    - Skill Gap Analysis
    - Hybrid Semantic Retrieval
    - Grounded Generation
    - Full 92+ Roadmap Catalog Search & Course Retrieval
    """
    def __init__(self):
        print("[RAGPipeline] Initializing embedding model...")
        self.embeddings = get_embeddings_model()
        print(f"[RAGPipeline] Connecting to Qdrant vector store at {settings.QDRANT_STORAGE_PATH} (collection='{settings.COLLECTION_NAME}')...")
        self.vector_store = QdrantVectorStore(
            embedding_function=self.embeddings,
            collection_name=settings.COLLECTION_NAME,
            storage_path=settings.QDRANT_STORAGE_PATH,
        )
        self.doc_processor = DocumentProcessor(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP,
        )
        self.skill_analyzer = SkillGapAnalyzer()
        self.generator = RoadmapGenerator()
        self.catalog = RoadmapCatalog()

        # Check or build index in Qdrant
        self.initialize_index()

        self.retriever = FlowCTRLRetriever(
            vector_store=self.vector_store,
            top_k=settings.TOP_K,
            similarity_threshold=settings.SIMILARITY_THRESHOLD,
        )

    def initialize_index(self) -> int:
        """Checks if Qdrant collection has vectors. If empty, indexes all knowledge base documents."""
        count = self.vector_store.count()
        if count == 0:
            print("[RAGPipeline] Qdrant collection is empty. Starting knowledge base indexing...")
            count = self.reindex()
        else:
            print(f"[RAGPipeline] Successfully verified {count} indexed documents in Qdrant collection '{settings.COLLECTION_NAME}'.")
        return count

    def reindex(self, limit: Optional[int] = None) -> int:
        """Reloads all documents, computes embeddings, and indexes them into Qdrant."""
        t0 = time.time()
        print("[RAGPipeline] Loading and chunking knowledge base documents...")
        docs = self.doc_processor.load_all_documents()
        if limit and limit > 0:
            docs = docs[:limit]
        if docs:
            print(f"[RAGPipeline] Loaded {len(docs)} documents. Resetting and indexing into Qdrant...")
            self.vector_store.clear()
            self.vector_store.add_documents(docs, batch_size=64)
            elapsed = time.time() - t0
            print(f"[RAGPipeline] Successfully re-indexed {len(docs)} documents into Qdrant in {elapsed:.2f}s.")
            return len(docs)
        print("[RAGPipeline] Warning: No documents found to index.")
        return 0

    def assess_skills(
        self,
        current_skills: List[Any],
        target_role: str,
        target_domain: Optional[str] = None,
    ) -> SkillAssessmentResponse:
        return self.skill_analyzer.analyze_gaps(
            current_skills=current_skills,
            target_role=target_role,
            target_domain=target_domain,
        )

    async def generate_roadmap(self, profile: UserProfile) -> RoadmapResponse:
        t0 = time.time()

        # 1. Analyze skill gaps
        assessment = self.skill_analyzer.analyze_gaps(
            current_skills=profile.currentSkills or [],
            target_role=profile.targetRole,
        )
        gaps_list = assessment.criticalGaps + assessment.recommendedGaps

        # 2. Retrieve relevant grounded documents from Qdrant
        retrieved_docs = self.retriever.retrieve_for_roadmap(
            user_profile=profile,
            skill_gaps=gaps_list,
            k=settings.TOP_K,
        )

        context_str = FlowCTRLRetriever.format_context(retrieved_docs)

        # 3. Generate structured roadmap
        roadmap = await self.generator.generate_roadmap(
            user_profile=profile,
            skill_gaps=gaps_list,
            retrieved_context=context_str,
        )

        timing_ms = round((time.time() - t0) * 1000, 2)
        roadmap.provenance = {
            "mode": "rag",
            "pipeline": "python_langchain_qdrant",
            "vectorBackend": "qdrant",
            "collection": settings.COLLECTION_NAME,
            "embeddingModel": settings.EMBEDDING_MODEL_NAME,
            "retrievalSucceeded": len(retrieved_docs) > 0,
            "documentsRetrieved": len(retrieved_docs),
            "executionTimeMs": timing_ms,
        }
        return roadmap

    async def get_recommendations(
        self,
        profile: UserProfile,
        completed_topics: Optional[List[str]] = None,
    ) -> RecommendationResponse:
        completed = completed_topics or []
        assessment = self.skill_analyzer.analyze_gaps(
            current_skills=profile.currentSkills or [],
            target_role=profile.targetRole,
        )
        remaining = [g for g in (assessment.criticalGaps + assessment.recommendedGaps) if g not in completed]

        retrieved_docs = self.retriever.retrieve_for_recommendations(
            user_profile=profile,
            completed_topics=completed,
            remaining_gaps=remaining,
            k=6,
        )

        context_str = FlowCTRLRetriever.format_context(retrieved_docs)

        return await self.generator.generate_recommendations(
            user_profile=profile,
            completed_topics=completed,
            remaining_gaps=remaining,
            retrieved_context=context_str,
        )

    def query(
        self,
        query: str,
        top_k: int = 5,
        filter: Optional[Dict[str, Any]] = None,
    ) -> QueryResponse:
        t0 = time.time()
        results = self.vector_store.similarity_search_with_score(
            query=query,
            k=top_k,
            filter=filter,
            min_score=settings.SIMILARITY_THRESHOLD,
        )
        timing_ms = round((time.time() - t0) * 1000, 2)

        items: List[QueryResultItem] = []
        for doc, score in results:
            items.append(QueryResultItem(
                id=doc.metadata.get("id", ""),
                content=doc.page_content,
                metadata=doc.metadata,
                score=round(float(score), 4),
            ))

        return QueryResponse(
            query=query,
            results=items,
            count=len(items),
            timing_ms=timing_ms,
            backend="qdrant",
        )

    def generate_roadmap_from_query(
        self,
        query: str,
        experience_level: str = "Beginner",
        goals: Optional[List[str]] = None,
    ) -> PersonalizedRoadmapResponse:
        t0 = time.time()
        result = self.catalog.generate_personalized_roadmap(
            query=query,
            experience_level=experience_level,
            goals=goals,
        )
        timing_ms = round((time.time() - t0) * 1000, 2)
        if hasattr(result, "provenance") and isinstance(result.provenance, dict):
            result.provenance["mode"] = "rag"
            result.provenance["pipeline"] = "python_langchain_qdrant"
            result.provenance["vectorBackend"] = "qdrant"
            result.provenance["executionTimeMs"] = timing_ms
        return result
