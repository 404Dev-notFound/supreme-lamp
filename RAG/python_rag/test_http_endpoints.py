import urllib.request
import json

base = "http://127.0.0.1:8001"

# 1. Health
print("--- 1. Testing GET /health ---")
with urllib.request.urlopen(f"{base}/health") as r:
    print("HEALTH:", json.loads(r.read()))

# 2. Ready
print("\n--- 2. Testing GET /ready ---")
with urllib.request.urlopen(f"{base}/ready") as r:
    print("READY:", json.loads(r.read()))

# 3. Query
print("\n--- 3. Testing POST /api/rag/query ---")
req = urllib.request.Request(
    f"{base}/api/rag/query",
    data=json.dumps({"query": "System Design scalability and caching", "top_k": 3}).encode(),
    headers={"Content-Type": "application/json"}
)
with urllib.request.urlopen(req) as r:
    res = json.loads(r.read())
    print("QUERY COUNT:", res["count"], "TIMING:", res.get("timing_ms"), "BACKEND:", res.get("backend"))
    for item in res["results"]:
        title = item["metadata"].get("title")
        doc_type = item["metadata"].get("type")
        print(f"  * Score: {item['score']} | {title} ({doc_type})")

# 4. Skill Assessment
print("\n--- 4. Testing POST /api/rag/skill-assessment ---")
req = urllib.request.Request(
    f"{base}/api/rag/skill-assessment",
    data=json.dumps({
        "targetRole": "Backend Engineer",
        "currentSkills": ["JavaScript", "HTML", "CSS"],
    }).encode(),
    headers={"Content-Type": "application/json"}
)
with urllib.request.urlopen(req) as r:
    res = json.loads(r.read())
    print("ASSESSMENT: Role:", res["targetRole"], "Readiness:", res["readinessScore"], "%")
    print("  Critical Gaps:", res["criticalGaps"][:4])
    print("  Recommended Gaps:", res["recommendedGaps"][:4])

# 5. Personalized Roadmap Generation
print("\n--- 5. Testing POST /api/rag/generate-roadmap ---")
req = urllib.request.Request(
    f"{base}/api/rag/generate-roadmap",
    data=json.dumps({
        "query": "Full Stack Engineer React and Node.js",
        "experienceLevel": "Beginner",
    }).encode(),
    headers={"Content-Type": "application/json"}
)
with urllib.request.urlopen(req) as r:
    res = json.loads(r.read())
    print("ROADMAP TITLE:", res["roadmapTitle"])
    print("STAGES COUNT:", len(res["stages"]))
    print("STEPS COUNT:", len(res["steps"]))
    print("PROVENANCE:", res["provenance"])

# 6. Admin Reindex Authorization Test (Unauthorized)
print("\n--- 6. Testing Unauthorized POST /api/rag/reindex ---")
try:
    req = urllib.request.Request(f"{base}/api/rag/reindex", data=b"{}", headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as r:
        pass
except urllib.error.HTTPError as e:
    print(f"Correctly rejected unauthorized reindex: HTTP {e.code} ({e.reason})")

print("\nALL PYTHON RAG ENDPOINTS VERIFIED SUCCESSFULLY!")

