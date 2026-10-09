# flowCTRL RAG: Personalized Career Roadmap & Recommendation Engine

Production-ready, Retrieval-Augmented Generation (RAG) system built with **Python and LangChain** for personalized career roadmaps and adaptive learning path recommendations in the flowCTRL platform.

---

## Table of Contents
1. [Core Features](#core-features)
2. [Folder Structure](#folder-structure)
3. [Architecture Overview](#architecture-overview)
4. [Python LangChain RAG Pipeline](#python-langchain-rag-pipeline)
5. [Setup & Running the Service](#setup--running-the-service)
6. [API Endpoints](#api-endpoints)
7. [Testing](#testing)
8. [Security & Anti-Hallucination](#security--anti-hallucination)

---

## Core Features

- **Language & Framework**: Implemented using **Python 3.14** and **LangChain 1.4+** (`langchain`, `langchain-core`, `langchain-text-splitters`, `langchain-community`).
- **Personalized Career Roadmaps**: Generates custom curricula tailored to user career goals, target company types (Product, Startup, Enterprise, R&D), and experience levels.
- **Skill Assessment & Gap Analysis**: Resolves `Current Skills → Required Skills → Skill Gaps → Learning Path`, strictly prioritizing missing prerequisites before advanced topics.
- **Production Vector Store**: Persistent vector database indexing over 1,960 verified topics and 90+ roadmap tracks.
- **Hybrid Semantic Retrieval**: Multi-angle semantic search using LangChain's `BaseRetriever` and metadata filtering.
- **Adaptive Recommendations**: Dynamically evaluates user progress (`Completed Topics → Re-evaluation → New Retrieval → Prioritized Recommendations`).
- **Zero Hallucination Guarantee**: Strict grounding fences prevent invented technologies, fabricated URLs, or ungrounded assumptions.
- **Modular AI Providers**: Seamlessly supports OpenAI (`gpt-4o-mini`), Google Gemini (`gemini-1.5-flash`), Groq (`llama-3.3-70b-versatile`), or Local deterministic semantic synthesis with zero external dependencies.

---

## Folder Structure

```
RAG/
├── requirements.txt               # Python package dependencies
├── .env.example                   # Environment configuration template
├── README.md                      # Primary documentation
├── python_rag/                    # Python LangChain Backend Implementation
│   ├── __init__.py                # Package initialization
│   ├── config.py                  # Pydantic settings & env loader
│   ├── schemas.py                 # Pydantic request/response models
│   ├── document_processor.py      # LangChain Document loading, cleaning, chunking
│   ├── embeddings.py              # LangChain Embeddings (Local 384d, OpenAI, Gemini)
│   ├── vector_store.py            # LangChain JSONVectorStore with cosine similarity
│   ├── retriever.py               # LangChain FlowCTRLRetriever with domain filters
│   ├── prompts.py                 # ChatPromptTemplates with anti-injection fences
│   ├── generator.py               # LangChain LCEL generation & grounded synthesis
│   ├── skill_analyzer.py          # Prerequisite-aware skill gap analyzer
│   ├── pipeline.py                # Unified RAGPipeline orchestrator
│   ├── main.py                    # FastAPI REST API server
│   └── test_pipeline.py           # Comprehensive automated test suite
├── knowledge_base/                # Structured Grounding Data
│   ├── career_paths.json          # Industry career paths, roles & progression
│   ├── company_profiles.json      # Company hiring expectations (Product, Startup, etc.)
│   ├── skills_taxonomy.json       # Skills taxonomy, hierarchy, and prerequisite graph
│   ├── curated_resources.json     # Verified learning resources, practice tasks & projects
│   └── domains/                   # Domain-specific curricula
│       ├── backend_engineering.json
│       ├── frontend_engineering.json
│       ├── ai_machine_learning.json
│       ├── cloud_devops.json
│       └── cybersecurity.json
└── data/
    └── vector_store.json          # Persistent vector index (1,960+ indexed topics)
```

---

## Architecture Overview

```
                      +-----------------------------+
                      |   FlowCTRL Frontend/Client  |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |    Express API Backend      |
                      |   (apps/backend on :5000)   |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      | Python LangChain RAG Service|
                      |     (FastAPI on :8001)      |
                      +--------------+--------------+
                                     |
          +--------------------------+--------------------------+
          |                          |                          |
          v                          v                          v
  +---------------+          +---------------+          +---------------+
  | Document      |          | FlowCTRL      |          | LangChain     |
  | Processor     |          | Retriever     |          | Generator     |
  | (Chunk/Clean) |          | (VectorStore) |          | (LCEL/LLM)    |
  +---------------+          +---------------+          +---------------+
```

---

## Setup & Running the Service

### 1. Install Dependencies
```bash
pip install -r RAG/requirements.txt
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp RAG/.env.example RAG/.env
```
Default mode runs with `RAG_LLM_PROVIDER=local`, requiring no external API keys.

### 3. Start the Python RAG Microservice
```bash
python -m uvicorn RAG.python_rag.main:app --host 127.0.0.1 --port 8001
```

The service will start at `http://127.0.0.1:8001`.

---

## API Endpoints

The Python RAG service exposes the following REST endpoints:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check, active provider, model info, and vector store count |
| `POST` | `/api/rag/skill-assessment` | Analyze `Current Skills → Required Skills → Skill Gaps` |
| `POST` | `/api/rag/generate` | Generate personalized learning roadmap |
| `POST` | `/api/rag/recommendations` | Get dynamic adaptive recommendations based on progress |
| `POST` | `/api/rag/query` | Semantic search and retrieval over knowledge base |
| `POST` | `/api/rag/reindex` | Trigger full document re-indexing and vector store update |

---

## Testing

Run the dedicated automated LangChain test suite:
```bash
python RAG/python_rag/test_pipeline.py
```

The test validates:
1. Pipeline initialization and persistent vector store loading (1,960 documents).
2. Semantic similarity retrieval with cosine scoring.
3. Prerequisite-aware skill gap assessment.
4. Personalized roadmap generation with multi-stage curricula.
5. Dynamic adaptive recommendations.

---

## Security & Anti-Hallucination

1. **Prompt Injection Defense**: Strips control characters, angle brackets, and system role markers before embedding or generation.
2. **Untrusted Data Isolation**: All retrieved context is framed inside bounded `<retrieved_context>` tags and treated as untrusted data.
3. **Zero URL Fabrication**: Fallback resources explicitly resolve to `"Resource not available in the current knowledge base"` rather than fabricating fictitious links.
4. **Secret Protection**: API keys are loaded via environment variables and never exposed to client applications.
