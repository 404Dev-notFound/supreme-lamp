import os
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
)
from .embeddings import get_embeddings_model
from .vector_store import JSONVectorStore
from .document_processor import DocumentProcessor
from .retriever import FlowCTRLRetriever
from .skill_analyzer import SkillGapAnalyzer
from .generator import RoadmapGenerator

class RAGPipeline:
    """
    Unified LangChain RAG Pipeline orchestrating:
    - Ingestion & Vector Storage
    - Skill Gap Analysis
    - Hybrid Retrieval
    - Grounded Generation
    """
    def __init__(self):
        self.embeddings = get_embeddings_model()
        self.vector_store = JSONVectorStore(
            embedding_function=self.embeddings,
            storage_path=settings.VECTOR_STORE_PATH,
        )
        self.doc_processor = DocumentProcessor(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP,
        )
        self.skill_analyzer = SkillGapAnalyzer()
        self.generator = RoadmapGenerator()

        # Load existing index or build from documents
        self.initialize_index()

        self.retriever = FlowCTRLRetriever(
            vector_store=self.vector_store,
            top_k=settings.TOP_K,
            similarity_threshold=settings.SIMILARITY_THRESHOLD,
        )

    def initialize_index(self) -> int:
        """Loads vector store from disk. If absent or empty, indexes all knowledge base documents."""
        count = self.vector_store.load_local()
        if count == 0:
            print("[RAGPipeline] Vector store empty or absent. Starting knowledge base indexing...")
            count = self.reindex()
        else:
            print(f"[RAGPipeline] Successfully loaded {count} documents from vector store.")
        return count

    def reindex(self) -> int:
        """Reloads all documents, computes embeddings, and persists vector store to disk."""
        docs = self.doc_processor.load_all_documents()
        if docs:
            self.vector_store.documents = []
            self.vector_store.vectors = []
            self.vector_store._ids = []
            self.vector_store.add_documents(docs)
            self.vector_store.save_local()
            print(f"[RAGPipeline] Re-indexed and saved {len(docs)} documents.")
            return len(docs)
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
        # 1. Analyze skill gaps
        assessment = self.skill_analyzer.analyze_gaps(
            current_skills=profile.currentSkills or [],
            target_role=profile.targetRole,
        )
        gaps_list = assessment.criticalGaps + assessment.recommendedGaps

        # 2. Retrieve relevant grounded documents
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
        results = self.vector_store.similarity_search_with_score(
            query=query,
            k=top_k,
            filter=filter,
            min_score=settings.SIMILARITY_THRESHOLD,
        )

        items: List[QueryResultItem] = []
        for doc, score in results:
            items.append(QueryResultItem(
                id=doc.metadata.get("id", ""),
                content=doc.page_content,
                metadata=doc.metadata,
                score=round(float(score), 4),
            ))

        return QueryResponse(query=query, results=items, count=len(items))
