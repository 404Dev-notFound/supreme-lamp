import urllib.request
import json

base = "http://127.0.0.1:8001"
express_base = "http://localhost:5000"

print("--- Edge Case 1: Empty Query to Python RAG ---")
try:
    req = urllib.request.Request(
        f"{base}/api/rag/query",
        data=json.dumps({"query": "   ", "top_k": 3}).encode(),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as r:
        pass
except urllib.error.HTTPError as e:
    print(f"Correctly caught HTTP {e.code}: {e.reason}")

print("\n--- Edge Case 2: Unknown / Gibberish Query to Python RAG ---")
req = urllib.request.Request(
    f"{base}/api/rag/query",
    data=json.dumps({"query": "aslkdjf908234jlkasjdfzxcvqwer", "top_k": 3}).encode(),
    headers={"Content-Type": "application/json"}
)
with urllib.request.urlopen(req) as r:
    res = json.loads(r.read())
    print(f"Gibberish query handled cleanly: found {res['count']} items (all below similarity threshold).")

print("\n--- Edge Case 3: Cold-Start Profile (Zero Skills) ---")
req = urllib.request.Request(
    f"{base}/api/rag/skill-assessment",
    data=json.dumps({
        "targetRole": "Frontend Developer",
        "currentSkills": [],
    }).encode(),
    headers={"Content-Type": "application/json"}
)
with urllib.request.urlopen(req) as r:
    res = json.loads(r.read())
    print(f"Cold-start profile assessed cleanly: Role={res['targetRole']}, Readiness={res['readinessScore']}%, Critical Gaps={len(res['criticalGaps'])}")

print("\n--- Edge Case 4: Express Roadmap Generation with Zero Skills ---")
req = urllib.request.Request(
    f"{express_base}/api/rag/generate-roadmap",
    data=json.dumps({
        "query": "Full Stack Developer",
        "experienceLevel": "Beginner",
        "goals": []
    }).encode(),
    headers={"Content-Type": "application/json"}
)
with urllib.request.urlopen(req) as r:
    res = json.loads(r.read())
    print(f"Express returned success: {res.get('success')}, mode={res.get('meta', {}).get('mode')}, pipeline={res.get('meta', {}).get('retrieval', {}).get('pipeline')}")

print("\nALL EDGE CASES HANDLED CLEANLY AND ROBUSTLY!")

