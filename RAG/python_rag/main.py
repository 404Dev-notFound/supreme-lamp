import time
import uuid
import uvicorn
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException, Request, Header, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .schemas import (
    UserProfile,
    SkillAssessmentRequest,
    SkillAssessmentResponse,
    RoadmapResponse,
    RoadmapQueryRequest,
    PersonalizedRoadmapResponse,
    RecommendationRequest,
    RecommendationResponse,
    QueryRequest,
    QueryResponse,
    HealthResponse,
    ReadinessResponse,
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
    description="Production Retrieval-Augmented Generation for Personalized Career Roadmaps & Learning Recommendations backed by Qdrant and MiniLM",
    version="2.1.0",
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

# Request tracking middleware
@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
    t0 = time.time()
    try:
        response = await call_next(request)
        duration_ms = round((time.time() - t0) * 1000, 2)
        response.headers["X-Request-Id"] = request_id
        response.headers["X-Response-Time"] = f"{duration_ms}ms"
        return response
    except Exception as exc:
        duration_ms = round((time.time() - t0) * 1000, 2)
        print(f"[RAG Service] Error processing request {request.url.path} ({request_id}) after {duration_ms}ms: {exc}")
        return JSONResponse(
            status_code=500,
            content={
                "detail": f"Internal server error: {str(exc)}",
                "status": "error",
                "requestId": request_id,
            },
            headers={"X-Request-Id": request_id},
        )

@app.get("/", response_model=HealthResponse)
@app.get("/health", response_model=HealthResponse)
async def health():
    count = rag_pipeline.vector_store.count() if (rag_pipeline and rag_pipeline.vector_store) else 0
    return HealthResponse(
        status="healthy",
        provider=settings.LLM_PROVIDER,
        vectorBackend="qdrant",
        vectorStoreCount=count,
        collection=settings.COLLECTION_NAME,
        models={
            "llm": (
                settings.OPENAI_MODEL if settings.LLM_PROVIDER == "openai"
                else settings.GEMINI_MODEL if settings.LLM_PROVIDER == "gemini"
                else settings.GROQ_MODEL if settings.LLM_PROVIDER == "groq"
                else "local_grounded"
            ),
            "embeddings": settings.EMBEDDING_MODEL_NAME,
        },
    )

@app.get("/ready", response_model=ReadinessResponse)
async def ready():
    """Readiness probe verifying actual vector DB connection, indexing status, and embedding model inference."""
    if not rag_pipeline or not rag_pipeline.vector_store:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="RAG Pipeline not yet initialized")

    try:
        # 1. Verify Qdrant connection and point count
        count = rag_pipeline.vector_store.count()
        if count == 0:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Qdrant vector store is not ready: collection is unindexed (0 vectors found).",
            )

        # 2. Verify actual semantic embedding model inference
        test_vec = rag_pipeline.embeddings.embed_query("flowctrl readiness probe")
        if not test_vec or len(test_vec) != settings.EMBEDDING_DIMENSION:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Embedding model failure: produced vector size {len(test_vec) if test_vec else 0}, expected {settings.EMBEDDING_DIMENSION}.",
            )

        return ReadinessResponse(
            ready=True,
            status="ready",
            vectorDatabase={
                "backend": "qdrant",
                "collection": settings.COLLECTION_NAME,
                "dimension": settings.EMBEDDING_DIMENSION,
                "storagePath": str(settings.QDRANT_STORAGE_PATH),
                "healthy": True,
            },
            embeddingModel={
                "name": settings.EMBEDDING_MODEL_NAME,
                "dimension": settings.EMBEDDING_DIMENSION,
                "version": settings.EMBEDDING_VERSION,
                "ready": True,
            },
            indexedDocuments=count,
            timestamp=datetime.now(timezone.utc).isoformat(),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Readiness check failed: {str(e)}",
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

@app.post("/api/rag/generate-roadmap", response_model=PersonalizedRoadmapResponse)
async def generate_personalized_roadmap(req: RoadmapQueryRequest):
    try:
        if not req.query or not req.query.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="query cannot be empty. Describe what you want to learn or become.",
            )
        return rag_pipeline.generate_roadmap_from_query(
            query=req.query.strip(),
            experience_level=req.experienceLevel or "Beginner",
            goals=req.goals or [],
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Personalized roadmap generation failed: {str(e)}",
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
async def reindex_knowledge_base(
    x_admin_key: str = Header(None, alias="x-admin-key"),
    authorization: str = Header(None),
    limit: int = Query(None),
):
    """Admin-secured knowledge base re-indexing into Qdrant."""
    token = x_admin_key
    if not token and authorization:
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1]

    if not token or not settings.RAG_ADMIN_SECRET or token != settings.RAG_ADMIN_SECRET:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Valid administrative key required to trigger reindexing.",
        )

    try:
        count = rag_pipeline.reindex(limit=limit)
        return {
            "status": "success",
            "indexedDocuments": count,
            "vectorBackend": "qdrant",
            "collection": settings.COLLECTION_NAME,
            "embeddingModel": settings.EMBEDDING_MODEL_NAME,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Reindexing failed: {str(e)}",
        )

if __name__ == "__main__":
    uvicorn.run("RAG.python_rag.main:app", host=settings.HOST, port=settings.PORT, reload=False)
