import asyncio
import sys
from pathlib import Path

# Add project root to path
root_dir = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(root_dir))

from RAG.python_rag.pipeline import RAGPipeline
from RAG.python_rag.schemas import UserProfile

async def run_tests():
    print("=" * 60)
    print("RUNNING FLOWCTRL PYTHON LANGCHAIN RAG TEST SUITE")
    print("=" * 60)

    # 1. Pipeline Initialization
    print("\n[Test 1] Initializing RAG Pipeline...")
    pipeline = RAGPipeline()
    doc_count = len(pipeline.vector_store.documents)
    assert doc_count > 0, f"Vector store should contain indexed documents, got {doc_count}"
    print(f"PASS: Vector store loaded with {doc_count} documents.")

    # 2. Semantic Search / Retrieval
    print("\n[Test 2] Testing Semantic Retrieval for 'Distributed Systems'...")
    results = pipeline.query(query="Distributed Systems Consensus Raft", top_k=3)
    assert results.count > 0, "Query should return at least 1 document"
    print(f"PASS: Retrieved {results.count} results. Top match: '{results.results[0].metadata.get('title')}' with score {results.results[0].score}")

    # 3. Skill Gap Assessment
    print("\n[Test 3] Testing Skill Gap Analysis for 'Backend Engineer'...")
    assessment = pipeline.assess_skills(
        current_skills=["Python", "Git", "REST APIs"],
        target_role="Backend Engineer",
    )
    assert assessment.targetRole == "Backend Engineer"
    assert len(assessment.criticalGaps) > 0 or len(assessment.recommendedGaps) > 0
    print(f"PASS: Detected {len(assessment.matchedSkills)} matched skills, {len(assessment.criticalGaps)} critical gaps, readiness: {assessment.readinessScore}%")

    # 4. Roadmap Generation
    print("\n[Test 4] Testing Personalized Roadmap Generation...")
    profile = UserProfile(
        targetRole="Backend Engineer",
        targetCompanyType="Product-based company",
        experienceLevel="Beginner",
        currentSkills=["Python", "SQL Basics"],
        careerGoals=["Become a Senior Backend Architect", "Master Microservices"],
    )
    roadmap = await pipeline.generate_roadmap(profile)
    assert roadmap.roadmapTitle != ""
    assert len(roadmap.stages) > 0
    total_items = sum(len(s.items) for s in roadmap.stages)
    assert total_items > 0
    print(f"PASS: Generated roadmap '{roadmap.roadmapTitle}' with {len(roadmap.stages)} stages and {total_items} total topics.")

    # 5. Dynamic Recommendations
    print("\n[Test 5] Testing Dynamic Adaptive Recommendations...")
    recs = await pipeline.get_recommendations(
        profile=profile,
        completed_topics=["Python", "SQL Basics"],
    )
    assert len(recs.recommendations) > 0
    print(f"PASS: Generated {len(recs.recommendations)} adaptive recommendations:")
    for r in recs.recommendations:
        print(f"  - [{r.priority}] {r.topic}: {r.reason[:60]}...")

    print("\n" + "=" * 60)
    print("ALL TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(run_tests())
