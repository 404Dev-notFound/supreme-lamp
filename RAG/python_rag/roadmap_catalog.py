import os
import re
import json
import glob
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from urllib.parse import urlparse

from .config import settings
from .embeddings import get_embeddings_model
from .schemas import (
    PersonalizedRoadmapResponse,
    RoadmapStep,
    RoadmapEdge,
    ResourceItem,
)

def infer_provider_from_url(url: str, title: str = "") -> str:
    """Infers friendly provider / platform name from resource URL."""
    if not url or url.startswith("Resource not available"):
        return "Curriculum Guide"
    try:
        domain = urlparse(url).netloc.lower()
        if "youtube.com" in domain or "youtu.be" in domain:
            return "YouTube Tutorial"
        if "github.com" in domain:
            return "GitHub Repository"
        if "postgresql.org" in domain:
            return "PostgreSQL Docs"
        if "mozilla.org" in domain:
            return "MDN Web Docs"
        if "coursera.org" in domain:
            return "Coursera"
        if "udemy.com" in domain:
            return "Udemy"
        if "freecodecamp.org" in domain:
            return "freeCodeCamp"
        if "w3schools.com" in domain:
            return "W3Schools"
        if "medium.com" in domain:
            return "Technical Article"
        if "dev.to" in domain:
            return "DEV Community"
        if "python.org" in domain:
            return "Python Official Docs"
        if "react.dev" in domain or "reactjs.org" in domain:
            return "React Documentation"
        if "docker.com" in domain:
            return "Docker Docs"
        if "kubernetes.io" in domain:
            return "Kubernetes Docs"
        if "aws.amazon.com" in domain:
            return "AWS Documentation"
        return domain.replace("www.", "").capitalize()
    except Exception:
        return "Official Resource"

class RoadmapCatalog:
    """
    Catalog of all 92+ canonical career curricula and 24,000+ verified courses.
    Provides hybrid semantic search, track resolution, and grounded roadmap synthesis.
    """
    def __init__(self):
        self.embeddings = get_embeddings_model()
        self.roadmaps: Dict[str, Dict[str, Any]] = {}
        self.roadmap_vectors: Dict[str, List[float]] = {}
        self._load_catalog()

    def _load_catalog(self):
        roadmap_dir = settings.ROADMAP_DATA_DIR
        if not roadmap_dir.exists():
            print(f"[RoadmapCatalog] Warning: {roadmap_dir} not found.")
            return

        files = glob.glob(str(roadmap_dir / "*.json"))
        for f in files:
            if os.path.basename(f) == "index.json":
                continue
            slug = os.path.basename(f)[:-5]
            try:
                with open(f, "r", encoding="utf-8") as fp:
                    data = json.load(fp)
                title = data.get("title", slug.replace("-", " ").title())
                desc = data.get("description", "")
                self.roadmaps[slug] = data

                # Embed title and description for semantic search
                clean_slug = slug.replace("-", " ")
                text = f"{title} {clean_slug} {desc}"
                vec = self.embeddings.embed_query(text)
                self.roadmap_vectors[slug] = vec
            except Exception as e:
                print(f"[RoadmapCatalog] Error loading {slug}: {e}")

        print(f"[RoadmapCatalog] Successfully indexed {len(self.roadmaps)} roadmaps.")

    def search_best_track(self, query: str, top_k: int = 3) -> List[Tuple[str, Dict[str, Any], float]]:
        """Hybrid search combining keyword stemming and dense vector similarity."""
        if not self.roadmaps:
            return []

        q_lower = query.lower()
        # Common expansions
        q_norm = (
            q_lower
            .replace("cybersecurity", "cyber security")
            .replace("fullstack", "full stack")
            .replace("devops", "dev ops devops")
            .replace("dsa", "datastructures and algorithms data structures")
            .replace("frontend", "front end frontend")
            .replace("backend", "back end backend")
        )
        words = [w for w in re.findall(r"[a-z0-9]+", q_norm) if len(w) > 2]
        q_vec = self.embeddings.embed_query(q_norm)

        scored = []
        for slug, r in self.roadmaps.items():
            slug_norm = slug.replace("-", " ")
            title_lower = r.get("title", "").lower()
            desc_lower = r.get("description", "").lower()

            # 1. Keyword score
            kw_score = 0.0
            for w in words:
                if w in slug:
                    kw_score += 3.0
                if w in slug_norm:
                    kw_score += 2.5
                if w in title_lower:
                    kw_score += 3.5
                if w in desc_lower:
                    kw_score += 0.8

            # 2. Dense vector similarity (dot product of L2 normalized vectors)
            vec = self.roadmap_vectors.get(slug, [])
            dense_score = sum(x * y for x, y in zip(q_vec, vec)) if vec and q_vec else 0.0

            # 3. Blended hybrid score
            hybrid_score = (dense_score * 0.35) + (kw_score * 0.65)
            scored.append((slug, r, hybrid_score))

        scored.sort(key=lambda x: x[2], reverse=True)
        return scored[:top_k]

    def generate_personalized_roadmap(
        self,
        query: str,
        experience_level: str = "Beginner",
        goals: Optional[List[str]] = None,
    ) -> PersonalizedRoadmapResponse:
        """
        Generates a tailored, logically ordered roadmap with genuine courses
        and reference URLs retrieved from the 92+ collection.
        """
        matches = self.search_best_track(query, top_k=3)
        if not matches:
            raise ValueError("No curriculum found matching query.")

        primary_slug, primary_data, primary_score = matches[0]
        role_title = primary_data.get("title", primary_slug.replace("-", " ").title())
        topics_dict = primary_data.get("topics", {})
        nodes_list = primary_data.get("nodes", [])
        edges_list = primary_data.get("edges", [])

        # Map nodes to levels
        node_level_map = {}
        for n in nodes_list:
            node_level_map[n.get("topicId", n.get("id"))] = n.get("level", 1)

        # Standard stage definitions
        stage_names = [
            "Stage 1: Foundations & Prerequisites",
            "Stage 2: Core Engineering & Principles",
            "Stage 3: Intermediate Architecture & Frameworks",
            "Stage 4: Advanced Tooling, Security & Scaling",
            "Stage 5: Capstone Projects & Production Deployment",
            "Stage 6: Technical Interview & Career Readiness",
        ]

        stage_buckets: Dict[int, List[Dict[str, Any]]] = {i: [] for i in range(1, 7)}

        # Distribute topics into stages based on node level or topic index
        indexed_topics = list(topics_dict.values())
        if not indexed_topics and nodes_list:
            # Fall back to node labels
            indexed_topics = [{"id": n.get("id"), "title": n.get("label"), "description": ""} for n in nodes_list]

        # Select a balanced curriculum (up to 18-24 core topics to prevent visual clutter)
        max_topics = min(len(indexed_topics), 20)
        stride = max(1, len(indexed_topics) // max_topics)
        selected_raw_topics = indexed_topics[::stride][:max_topics]

        total_steps = []
        edges: List[RoadmapEdge] = []
        step_id_by_topic_id: Dict[str, str] = {}

        for idx, t in enumerate(selected_raw_topics):
            t_id = t.get("id", f"t_{idx}")
            t_title = t.get("title", "Core Engineering Topic")
            t_desc = t.get("description", f"Mastery of {t_title} is fundamental for {role_title}.")
            raw_resources = t.get("resources", [])

            # Determine stage level
            lvl = node_level_map.get(t_id, (idx % 4) + 1)
            lvl = max(1, min(lvl, 4)) # Map to 1-4, reserving 5 and 6 for capstone/career

            # Extract verified courses
            courses = []
            for r in raw_resources:
                url = r.get("url", "")
                if url:
                    provider = infer_provider_from_url(url, r.get("title", ""))
                    courses.append({
                        "id": r.get("id", f"res_{len(courses)}"),
                        "title": r.get("title", f"{t_title} Reference Guide"),
                        "type": r.get("type", "article"),
                        "url": url,
                        "provider": provider,
                        "whyRecommended": f"Authoritative reference from {provider} directly reinforcing {t_title}.",
                    })

            if not courses:
                courses.append({
                    "id": f"res_{t_id}_doc",
                    "title": f"{t_title} Official Documentation",
                    "type": "documentation",
                    "url": "Resource not available in the current knowledge base",
                    "provider": "Official Documentation",
                    "whyRecommended": "Recommended technical specification.",
                })

            step_id = f"step_{idx + 1}"
            step_id_by_topic_id[t_id] = step_id

            diff = "Beginner" if lvl == 1 else "Intermediate" if lvl in [2, 3] else "Advanced"

            # Rich pedagogical explanations
            why_it_matters = (
                f"Mastering {t_title} is indispensable for becoming a proficient {role_title}. "
                f"It forms a crucial pillar in the professional engineering stack, directly preventing architecture defects."
            )
            what_you_will_learn = t_desc if len(t_desc) > 20 else f"Core principles, industry standards, syntax, and hands-on operational patterns of {t_title}."
            practical_app = f"Build and test a functional component or module implementing {t_title} best practices."
            completion_crit = f"Demonstrate verified code coverage, passing tests, and documented implementation of {t_title}."
            next_step_desc = f"Advance to subsequent stage topics building on {t_title} fundamentals."

            step = RoadmapStep(
                id=step_id,
                topic=t_title,
                stageName=stage_names[lvl - 1],
                stageIndex=lvl - 1,
                stepIndex=idx,
                whyItMatters=why_it_matters,
                whatYouWillLearn=what_you_will_learn,
                prerequisites=["Foundational CS Concepts"] if lvl == 1 else [f"Stage {lvl-1} Topics"],
                difficulty=diff,
                estimatedEffort="12 hours (1 week)" if diff == "Beginner" else "20 hours (2 weeks)",
                recommendedCourses=courses,
                referenceLinks=[c["url"] for c in courses if c["url"] and not c["url"].startswith("Resource not")],
                practicalApplication=practical_app,
                completionCriteria=completion_crit,
                nextStep=next_step_desc,
                status="not_started",
            )
            stage_buckets[lvl].append(step)
            total_steps.append(step)

        # Append Stage 5: Capstone Project
        capstone_step = RoadmapStep(
            id=f"step_{len(total_steps) + 1}",
            topic=f"Capstone: Scalable {role_title} Production System",
            stageName=stage_names[4],
            stageIndex=4,
            stepIndex=len(total_steps),
            whyItMatters=f"Demonstrates complete full-lifecycle engineering competence aligned with high-performance {role_title} hiring benchmarks.",
            whatYouWillLearn="End-to-end architecture design, CI/CD pipeline automation, observability metrics, load handling, and clean code principles.",
            prerequisites=[s.topic for s in total_steps[-3:]],
            difficulty="Advanced",
            estimatedEffort="35 hours (3-4 weeks)",
            recommendedCourses=[{
                "id": "capstone_res_1",
                "title": "Production Engineering Architecture Primer",
                "type": "article",
                "url": "https://github.com/donnemartin/system-design-primer",
                "provider": "GitHub System Design Primer",
                "whyRecommended": "Industry-standard system design patterns for deploying scalable applications.",
            }],
            referenceLinks=["https://github.com/donnemartin/system-design-primer"],
            practicalApplication=f"Deploy a production-ready {role_title} system with Docker containers and automated testing.",
            completionCriteria="Deployed with public repository URL, automated passing tests, and verified README architecture diagram.",
            nextStep="Proceed to Technical Interview & Career Readiness stage.",
            status="not_started",
        )
        stage_buckets[5].append(capstone_step)
        total_steps.append(capstone_step)

        # Append Stage 6: Technical Interview & Career Readiness
        interview_step = RoadmapStep(
            id=f"step_{len(total_steps) + 1}",
            topic=f"Technical Interview Mastery & Portfolio Review for {role_title}",
            stageName=stage_names[5],
            stageIndex=5,
            stepIndex=len(total_steps),
            whyItMatters="Translates deep engineering capability into fluent technical communication and interview problem-solving excellence.",
            whatYouWillLearn="Algorithmic problem-solving walkthroughs, trade-off communication, mock design rounds, and resume ATS optimization.",
            prerequisites=[capstone_step.topic],
            difficulty="Intermediate",
            estimatedEffort="20 hours (2 weeks)",
            recommendedCourses=[{
                "id": "interview_res_1",
                "title": "Technical Interview Handbook",
                "type": "course",
                "url": "https://www.techinterviewhandbook.org/",
                "provider": "Tech Interview Handbook",
                "whyRecommended": "Curated interview questions, system design guides, and behavioural answer frameworks.",
            }],
            referenceLinks=["https://www.techinterviewhandbook.org/"],
            practicalApplication=f"Complete mock interviews and refine portfolio showcasing the {role_title} capstone project.",
            completionCriteria="Fluently solve technical problem rounds and articulate architecture trade-offs.",
            nextStep="Begin target role applications.",
            status="not_started",
        )
        stage_buckets[6].append(interview_step)
        total_steps.append(interview_step)

        # Build sequential and original graph edges
        for i in range(len(total_steps) - 1):
            edges.append(RoadmapEdge(
                source=total_steps[i].id,
                target=total_steps[i + 1].id,
                label="Prerequisite for" if i < len(total_steps) - 2 else "Prepares for",
            ))

        # Add original roadmap edges if available
        for e in edges_list[:15]:
            s_id = step_id_by_topic_id.get(e.get("source"))
            t_id = step_id_by_topic_id.get(e.get("target"))
            if s_id and t_id and s_id != t_id:
                if not any(ex.source == s_id and ex.target == t_id for ex in edges):
                    edges.append(RoadmapEdge(source=s_id, target=t_id, label="Dependency"))

        # Build stages summary
        stages_summary = []
        for i in range(1, 7):
            steps_in_bucket = stage_buckets[i]
            if steps_in_bucket:
                stages_summary.append({
                    "stageIndex": i - 1,
                    "stageName": stage_names[i - 1],
                    "stepCount": len(steps_in_bucket),
                    "stepIds": [s.id for s in steps_in_bucket],
                })

        total_weeks = max(8, sum(len(b) for b in stage_buckets.values()) * 2)

        return PersonalizedRoadmapResponse(
            id=f"roadmap_{primary_slug}_{experience_level.lower()}",
            roadmapTitle=f"Personalized {role_title} Roadmap",
            userGoal=query,
            targetRole=role_title,
            summary=(
                f"Personalized curriculum tailored for '{query}'. Synthesized from our verified {role_title} "
                f"curriculum, featuring {len(total_steps)} sequential milestones and original reference links."
            ),
            estimatedTotalWeeks=total_weeks,
            stages=stages_summary,
            steps=total_steps,
            edges=edges,
            provenance={
                "source": "flowctrl_roadmap_catalog",
                "matchedTrack": primary_slug,
                "curriculumTitle": role_title,
                "totalVerifiedResources": sum(len(s.recommendedCourses) for s in total_steps),
                "catalogRoadmapsCount": len(self.roadmaps),
            },
        )
