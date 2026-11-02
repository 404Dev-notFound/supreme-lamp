from typing import List, Dict, Any, Optional
from langchain_core.documents import Document
from langchain_core.retrievers import BaseRetriever
from langchain_core.callbacks.manager import CallbackManagerForRetrieverRun
from pydantic import Field
from .vector_store import JSONVectorStore
from .schemas import UserProfile
from .config import settings

class FlowCTRLRetriever(BaseRetriever):
    """
    Hybrid semantic retriever with domain awareness and metadata filtering.
    Retrieves verified topics, prerequisites, curated resources, and projects.
    """
    vector_store: JSONVectorStore = Field(...)
    top_k: int = Field(default=settings.TOP_K)
    similarity_threshold: float = Field(default=settings.SIMILARITY_THRESHOLD)

    class Config:
        arbitrary_types_allowed = True

    def _get_relevant_documents(
        self, query: str, *, run_manager: Optional[CallbackManagerForRetrieverRun] = None
    ) -> List[Document]:
        results = self.vector_store.similarity_search_with_score(
            query=query,
            k=self.top_k,
            min_score=self.similarity_threshold,
        )
        return [doc for doc, _ in results]

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
