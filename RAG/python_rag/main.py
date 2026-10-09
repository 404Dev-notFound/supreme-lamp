import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .schemas import (
    UserProfile,
    SkillAssessmentRequest,
    SkillAssessmentResponse,
    RoadmapResponse,
    RecommendationRequest,
    RecommendationResponse,
    QueryRequest,
    QueryResponse,
    HealthResponse,
)
from .pipeline import RAGPipeline

rag_pipeline: RAGPipeline = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global rag_pipeline
    print(f"[RAG Service] Starting FlowCTRL Python LangChain RAG Service on {settings.HOST}:{settings.PORT}...")
    rag_pipeline = RAGPipeline()
    yield
    print("[RAG Service] Shutting down FlowCTRL RAG Service.")

app = FastAPI(
    title="FlowCTRL Python LangChain RAG Service",
    description="Production Retrieval-Augmented Generation for Personalized Career Roadmaps & Learning Recommendations",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000", "http://127.0.0.1:3000", "http://127.0.0.1:5000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", response_model=HealthResponse)
@app.get("/health", response_model=HealthResponse)
async def health():
    count = len(rag_pipeline.vector_store.documents) if rag_pipeline else 0
    return HealthResponse(
        status="healthy",
        provider=settings.LLM_PROVIDER,
        vectorStoreCount=count,
        models={
            "llm": (
                settings.OPENAI_MODEL if settings.LLM_PROVIDER == "openai"
                else settings.GEMINI_MODEL if settings.LLM_PROVIDER == "gemini"
                else settings.GROQ_MODEL if settings.LLM_PROVIDER == "groq"
                else "local_grounded"
            ),
            "embeddings": (
                settings.OPENAI_EMBEDDING_MODEL if settings.LLM_PROVIDER == "openai"
                else settings.GEMINI_EMBEDDING_MODEL if settings.LLM_PROVIDER == "gemini"
                else "local_deterministic_384d"
            ),
        },
    )

@app.post("/api/rag/skill-assessment", response_model=SkillAssessmentResponse)
async def assess_skills(req: SkillAssessmentRequest):
    try:
        profile = req.profile
        target_role = (profile.targetRole if profile else None) or req.targetRole or "Software Engineer"
        target_domain = req.targetDomain
        current_skills = (profile.currentSkills if profile else None) or req.currentSkills or []

        return rag_pipeline.assess_skills(
            current_skills=current_skills,
            target_role=target_role,
            target_domain=target_domain,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Skill assessment failed: {str(e)}",
        )

@app.post("/api/rag/generate", response_model=RoadmapResponse)
async def generate_roadmap(profile: UserProfile):
    try:
        if not profile.targetRole:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="targetRole is required in user profile.",
            )
        return await rag_pipeline.generate_roadmap(profile)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Roadmap generation failed: {str(e)}",
        )

@app.post("/api/rag/recommendations", response_model=RecommendationResponse)
async def get_recommendations(req: RecommendationRequest):
    try:
        return await rag_pipeline.get_recommendations(
            profile=req.profile,
            completed_topics=req.completedTopics or [],
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Recommendation retrieval failed: {str(e)}",
        )

@app.post("/api/rag/query", response_model=QueryResponse)
async def query_knowledge_base(req: QueryRequest):
    try:
        if not req.query.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="query string cannot be empty.",
            )
        return rag_pipeline.query(
            query=req.query,
            top_k=req.top_k or 5,
            filter=req.filter,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Query search failed: {str(e)}",
        )

@app.post("/api/rag/reindex")
async def reindex_knowledge_base():
    try:
        count = rag_pipeline.reindex()
        return {"status": "success", "indexedDocuments": count}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Reindexing failed: {str(e)}",
        )

if __name__ == "__main__":
    uvicorn.run("RAG.python_rag.main:app", host=settings.HOST, port=settings.PORT, reload=False)
