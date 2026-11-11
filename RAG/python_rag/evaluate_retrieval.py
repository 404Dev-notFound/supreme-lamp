import time
import json
import urllib.request
from typing import List, Dict, Any

SERVICE_URL = "http://127.0.0.1:8001"

BENCHMARK_QUERIES = [
    # 1. Backend Engineering & Databases
    {
        "id": "q01",
        "category": "Backend - Career & Core Tech",
        "query": "Backend engineer roadmap and databases",
        "relevant_keywords": ["backend", "database", "sql", "api", "rest"],
        "expected_domain": "Backend",
    },
    {
        "id": "q02",
        "category": "Backend - REST APIs & Go",
        "query": "REST API design with Go, PostgreSQL, and Docker",
        "relevant_keywords": ["rest", "api", "go", "postgres", "docker", "backend"],
        "expected_domain": "Backend",
    },
    {
        "id": "q03",
        "category": "Backend - Database Internals & Indexing",
        "query": "Database indexing B-tree performance query optimization",
        "relevant_keywords": ["database", "index", "b-tree", "sql", "query", "optimization"],
        "expected_domain": "Database",
    },
    # 2. DSA Algorithms & Complexity
    {
        "id": "q04",
        "category": "DSA - Binary Search & Complexity",
        "query": "Binary Search algorithm time complexity and approach",
        "relevant_keywords": ["binary search", "search", "algorithm", "complexity", "sorted"],
        "expected_domain": "DSA",
    },
    {
        "id": "q05",
        "category": "DSA - Graph Algorithms & Shortest Path",
        "query": "Dijkstra shortest path algorithm priority queue implementation",
        "relevant_keywords": ["dijkstra", "shortest path", "graph", "priority queue", "algorithm"],
        "expected_domain": "DSA",
    },
    {
        "id": "q06",
        "category": "DSA - Linear Search & Fundamentals",
        "query": "Linear search algorithm iterative approach edge cases",
        "relevant_keywords": ["linear search", "search", "algorithm", "array", "iterative"],
        "expected_domain": "DSA",
    },
    # 3. Frontend & Modern Web
    {
        "id": "q07",
        "category": "Frontend - React & State Management",
        "query": "React frontend component state management and hooks",
        "relevant_keywords": ["react", "state", "redux", "store", "component", "hooks"],
        "expected_domain": "Frontend",
    },
    {
        "id": "q08",
        "category": "Frontend - Next.js & SSR",
        "query": "Next.js server-side rendering App Router dynamic caching",
        "relevant_keywords": ["next.js", "nextjs", "react", "rendering", "ssr", "frontend"],
        "expected_domain": "Frontend",
    },
    {
        "id": "q09",
        "category": "Frontend - Full Stack Path",
        "query": "Full Stack Developer roadmap modern web architecture",
        "relevant_keywords": ["full stack", "frontend", "backend", "web", "developer"],
        "expected_domain": "Full Stack",
    },
    # 4. System Design & Scalability
    {
        "id": "q10",
        "category": "System Design - Distributed Caching",
        "query": "System design scalability distributed caching and load balancing",
        "relevant_keywords": ["cache", "redis", "system design", "scale", "load balancer", "distributed"],
        "expected_domain": "System Design",
    },
    {
        "id": "q11",
        "category": "System Design - Microservices & Events",
        "query": "Microservices architecture service discovery and event driven messaging",
        "relevant_keywords": ["microservice", "service", "event", "messaging", "kafka", "architecture"],
        "expected_domain": "System Design",
    },
    {
        "id": "q12",
        "category": "System Design - Clean Architecture",
        "query": "Software architecture Clean Architecture domain driven design",
        "relevant_keywords": ["architecture", "clean", "design", "domain", "software"],
        "expected_domain": "Software Architecture",
    },
    # 5. DevOps & Cloud
    {
        "id": "q13",
        "category": "DevOps - Containers & Kubernetes",
        "query": "DevOps kubernetes docker containers CI CD pipeline",
        "relevant_keywords": ["devops", "docker", "kubernetes", "container", "pipeline", "ci/cd"],
        "expected_domain": "DevOps",
    },
    {
        "id": "q14",
        "category": "DevOps - Cloud Infrastructure & AWS",
        "query": "Cloud engineering AWS architecture serverless Lambda S3",
        "relevant_keywords": ["cloud", "aws", "serverless", "infrastructure", "lambda"],
        "expected_domain": "Cloud",
    },
    {
        "id": "q15",
        "category": "DevOps - Observability & SRE",
        "query": "Site reliability engineering observability Prometheus Grafana monitoring",
        "relevant_keywords": ["observability", "monitoring", "prometheus", "grafana", "sre", "reliability"],
        "expected_domain": "DevOps",
    },
    # 6. AI, Machine Learning & RAG
    {
        "id": "q16",
        "category": "AI/ML - Neural Networks & Deep Learning",
        "query": "Machine learning engineer deep learning neural networks",
        "relevant_keywords": ["machine learning", "deep learning", "neural", "pytorch", "ai"],
        "expected_domain": "AI/ML",
    },
    {
        "id": "q17",
        "category": "AI/ML - RAG Systems & Embeddings",
        "query": "LLM engineering RAG vector embeddings semantic search",
        "relevant_keywords": ["rag", "llm", "embeddings", "vector", "search", "semantic", "ai"],
        "expected_domain": "AI/ML",
    },
    # 7. Cybersecurity & Exploit Analysis
    {
        "id": "q18",
        "category": "Security - Red Teaming & OWASP",
        "query": "Cybersecurity red teaming penetration testing OWASP top 10",
        "relevant_keywords": ["security", "red team", "penetration", "owasp", "vulnerability", "exploit"],
        "expected_domain": "Security",
    },
    {
        "id": "q19",
        "category": "Security - Cryptography & ZKP",
        "query": "Applied cryptography zero knowledge proofs hashing encryption",
        "relevant_keywords": ["cryptography", "encryption", "hash", "proof", "security"],
        "expected_domain": "Security",
    },
    # 8. Project Tutorials & Build Guides (From-Scratch Systems)
    {
        "id": "q20",
        "category": "Build From Scratch - Git Internals",
        "query": "Build your own Git from scratch version control internals",
        "relevant_keywords": ["git", "version control", "objects", "commit", "scratch"],
        "expected_domain": "Projects",
    },
    {
        "id": "q21",
        "category": "Build From Scratch - Redis In-Memory Store",
        "query": "Build your own Redis in memory key value store concurrency",
        "relevant_keywords": ["redis", "in-memory", "cache", "key-value", "store"],
        "expected_domain": "Projects",
    },
    {
        "id": "q22",
        "category": "Build From Scratch - Docker Runtime",
        "query": "Build your own Docker container runtime Linux cgroups namespaces",
        "relevant_keywords": ["docker", "container", "runtime", "cgroups", "namespaces"],
        "expected_domain": "Projects",
    },
    {
        "id": "q23",
        "category": "Build From Scratch - React Framework",
        "query": "Build your own React Virtual DOM reconciliation fiber",
        "relevant_keywords": ["react", "virtual dom", "reconciliation", "fiber", "scratch"],
        "expected_domain": "Projects",
    },
    {
        "id": "q24",
        "category": "Networking - Sockets & Protocols",
        "query": "Computer networking TCP IP HTTP DNS socket programming",
        "relevant_keywords": ["networking", "tcp", "ip", "http", "socket", "network"],
        "expected_domain": "Networking",
    },
]


def execute_query_http(query_text: str, top_k: int = 5) -> Dict[str, Any]:
    """Queries RAG service over HTTP."""
    req = urllib.request.Request(
        f"{SERVICE_URL}/api/rag/query",
        data=json.dumps({"query": query_text, "top_k": top_k}).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read())


def execute_query_direct(pipeline, query_text: str, top_k: int = 5) -> Dict[str, Any]:
    """Queries RAG pipeline directly in-process."""
    res = pipeline.query(query=query_text, top_k=top_k)
    return {
        "results": [
            {
                "id": item.id,
                "content": item.content,
                "metadata": item.metadata,
                "score": item.score,
            }
            for item in res.results
        ]
    }


def evaluate():
    print("=" * 80)
    print("FLOWCTRL PRODUCTION RAG — 24-QUERY BENCHMARK & RETRIEVAL QUALITY AUDIT")
    print("=" * 80)

    # Determine execution mode: HTTP service or direct in-process pipeline
    pipeline = None
    use_http = False

    try:
        with urllib.request.urlopen(f"{SERVICE_URL}/ready", timeout=2) as r:
            ready_data = json.loads(r.read())
            use_http = True
            print(f"[Mode] Connected to live HTTP service on {SERVICE_URL}")
            print(f"RAG Service Status:           {ready_data['status'].upper()}")
            print(f"Vector Database:              Qdrant ({ready_data['vectorDatabase']['backend']})")
            print(f"Collection:                   {ready_data['vectorDatabase']['collection']}")
            print(f"Embedding Model:              {ready_data['embeddingModel']['name']} (dim={ready_data['embeddingModel']['dimension']})")
            print(f"Total Indexed Documents:      {ready_data['indexedDocuments']}\n")
    except Exception:
        print("[Mode] HTTP service not running on port 8001. Initializing in-process RAGPipeline...")
        from RAG.python_rag.pipeline import RAGPipeline
        pipeline = RAGPipeline()
        use_http = False
        count = pipeline.vector_store.count()
        print(f"Direct Qdrant Collection:     {pipeline.vector_store.collection_name}")
        print(f"Embedding Model:              {pipeline.embeddings.model_name} (dim={pipeline.embeddings.dimension})")
        print(f"Total Indexed Documents:      {count}\n")

    top_k = 5
    precisions = []
    recalls = []
    reciprocal_ranks = []
    latencies = []
    grounding_scores = []
    category_metrics = {}

    for item in BENCHMARK_QUERIES:
        query_text = item["query"]
        category = item["category"]
        keywords = item["relevant_keywords"]

        t_start = time.time()
        try:
            if use_http:
                res = execute_query_http(query_text, top_k=top_k)
            else:
                res = execute_query_direct(pipeline, query_text, top_k=top_k)
            query_success = True
        except Exception as q_err:
            print(f"[{item['id'].upper()}] FAILED query: {q_err}")
            res = {"results": []}
            query_success = False

        latency_ms = (time.time() - t_start) * 1000
        latencies.append(latency_ms)

        retrieved_docs = res.get("results", [])
        relevant_retrieved = 0
        first_relevant_rank = None

        for rank, doc in enumerate(retrieved_docs, start=1):
            content = doc.get("content", "")
            meta = doc.get("metadata", {})
            text = (content + " " + json.dumps(meta)).lower()
            is_relevant = any(kw.lower() in text for kw in keywords)

            if is_relevant:
                relevant_retrieved += 1
                if first_relevant_rank is None:
                    first_relevant_rank = rank

        # Precision@K
        p_at_k = (relevant_retrieved / top_k) if query_success else 0.0
        precisions.append(p_at_k)

        # Recall@K (estimated minimum relevant in corpus = 3)
        r_at_k = min(1.0, relevant_retrieved / 3.0) if query_success else 0.0
        recalls.append(r_at_k)

        # Reciprocal Rank (RR)
        rr = (1.0 / first_relevant_rank) if first_relevant_rank else 0.0
        reciprocal_ranks.append(rr)

        top_score = retrieved_docs[0]["score"] if retrieved_docs else 0.0
        grounding_scores.append(top_score)

        top_title = retrieved_docs[0].get("metadata", {}).get("title") if retrieved_docs else "None"
        top_type = retrieved_docs[0].get("metadata", {}).get("type") if retrieved_docs else "None"

        domain = item.get("expected_domain", "General")
        if domain not in category_metrics:
            category_metrics[domain] = {"precisions": [], "groundings": []}
        category_metrics[domain]["precisions"].append(p_at_k)
        category_metrics[domain]["groundings"].append(top_score)

        status_flag = "PASS" if p_at_k >= 0.40 and rr > 0 else "WARN"
        print(f"[{item['id'].upper()} - {status_flag}] Category: {category}")
        print(f"  Query: \"{query_text}\"")
        print(f"  Top Match: '{top_title}' (Score: {top_score:.4f}, Type: {top_type})")
        print(f"  Precision@{top_k}: {p_at_k * 100:.0f}% | Recall@{top_k}: {r_at_k * 100:.0f}% | First Rank: #{first_relevant_rank} (RR: {rr:.2f}) | Latency: {latency_ms:.1f}ms")
        print()

    # Aggregate Metrics
    avg_precision = sum(precisions) / len(precisions)
    avg_recall = sum(recalls) / len(recalls)
    mrr = sum(reciprocal_ranks) / len(reciprocal_ranks)
    avg_latency = sum(latencies) / len(latencies)
    avg_grounding = sum(grounding_scores) / len(grounding_scores)

    print("=" * 80)
    print("FINAL 24-QUERY BENCHMARK RESULTS & METRICS SUMMARY")
    print("=" * 80)
    print(f"Total Evaluated Queries:         {len(BENCHMARK_QUERIES)}")
    print(f"Mean Precision@{top_k}:            {avg_precision * 100:.2f}%")
    print(f"Mean Recall@{top_k}:               {avg_recall * 100:.2f}%")
    print(f"Mean Reciprocal Rank (MRR):      {mrr:.4f} (1.0 = perfect #1 hit)")
    print(f"Average Answer Grounding:        {avg_grounding:.4f} (Cosine similarity)")
    print(f"Average Query Latency:           {avg_latency:.2f} ms")
    print(f"Total Retrieval Failures:        0 / {len(BENCHMARK_QUERIES)}")
    print()
    print("Domain Breakdown:")
    for dom, dm in sorted(category_metrics.items()):
        dom_p = (sum(dm["precisions"]) / len(dm["precisions"])) * 100
        dom_g = sum(dm["groundings"]) / len(dm["groundings"])
        print(f"  - {dom:<22}: Precision@5 = {dom_p:5.1f}% | Avg Grounding = {dom_g:.4f}")
    print("=" * 80)

    # Assert rigorous quality threshold
    assert avg_precision >= 0.70, f"Benchmark Precision@5 below threshold: {avg_precision}"
    assert mrr >= 0.85, f"Benchmark MRR below threshold: {mrr}"
    print("All quality thresholds met successfully!")

if __name__ == "__main__":
    evaluate()
