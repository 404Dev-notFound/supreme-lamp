import os
import re
import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from .config import settings

def clean_text(text: str) -> str:
    """Sanitizes text and removes prompt injection attempts."""
    if not isinstance(text, str):
        return ""
    # Strip HTML / angle brackets that could manipulate prompt XML tags
    cleaned = re.sub(r"[<>]", "", text)
    # Strip dangerous instruction injection keywords
    cleaned = re.sub(r"(?i)\b(system|assistant|user):\s*", "", cleaned)
    cleaned = re.sub(r"\r\n", "\n", cleaned)
    cleaned = re.sub(r"\r", "\n", cleaned)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned.strip()

class DocumentProcessor:
    """
    Production document processor for FlowCTRL.
    Loads, cleans, chunks, and metadata-enriches knowledge base data,
    domain curricula, and platform roadmaps into LangChain Documents.
    """
    def __init__(self, chunk_size: int = settings.CHUNK_SIZE, chunk_overlap: int = settings.CHUNK_OVERLAP):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""],
        )

    def load_all_documents(self) -> List[Document]:
        """Loads and processes all available knowledge sources into LangChain Documents."""
        docs: List[Document] = []
        
        # 1. Load domain curricula from RAG/knowledge_base/domains
        docs.extend(self._load_domain_curricula())

        # 2. Load career paths & company profiles
        docs.extend(self._load_career_paths_and_companies())

        # 3. Load curated resources
        docs.extend(self._load_curated_resources())

        # 4. Load roadmap-data JSONs (curated subset to prevent token explosion)
        docs.extend(self._load_roadmap_data())

        # 5. Load Project-Building Tutorials catalog
        docs.extend(self._load_project_tutorials())

        return docs

    def _load_domain_curricula(self) -> List[Document]:
        docs: List[Document] = []
        domains_dir = settings.KNOWLEDGE_BASE_DIR / "domains"
        if not domains_dir.exists():
            return docs

        for file_path in domains_dir.glob("*.json"):
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)

                domain_name = data.get("domain", file_path.stem.replace("_", " ").title())
                roles = data.get("roles", [])

                for role_info in roles:
                    role_name = role_info.get("roleName", "Software Engineer")
                    stages = role_info.get("stages", [])

                    for stage in stages:
                        stage_name = stage.get("stageName", "Core Skills")
                        stage_desc = stage.get("stageDescription", "")
                        topics = stage.get("topics", [])

                        for topic in topics:
                            title = clean_text(topic.get("title", ""))
                            summary = clean_text(topic.get("summary", ""))
                            difficulty = topic.get("difficulty", "Intermediate")
                            prereqs = topic.get("prerequisites", [])
                            effort = topic.get("estimatedEffort", "15 hours")
                            resources = topic.get("resources", [])
                            practice = topic.get("practiceTasks", [])
                            project = topic.get("realWorldProject", f"Build a {title} feature")
                            completion = topic.get("completionProof", f"Implement tests for {title}")
                            next_step = topic.get("nextRecommendedStep", "Continue to next topic")

                            # Build grounded structured text chunk
                            res_text = "\n".join([f"- [{r.get('type','doc')}] {r.get('title','')}: {r.get('url','')}" for r in resources])
                            tasks_text = "\n".join([f"* Task: {clean_text(t)}" for t in practice])

                            content = (
                                f"### Topic: {title}\n"
                                f"**Role:** {role_name} | **Domain:** {domain_name} | **Stage:** {stage_name}\n"
                                f"**Difficulty:** {difficulty} | **Effort:** {effort}\n"
                                f"**Summary:** {summary}\n"
                                f"**Prerequisites:** {', '.join(prereqs) if prereqs else 'None'}\n"
                                f"**Resources:**\n{res_text if res_text else '- [doc] Official Docs: Resource not available in the current knowledge base'}\n"
                                f"**Practice Tasks:**\n{tasks_text if tasks_text else '* Task: Practice core exercises'}\n"
                                f"* Real-World Project: {project}\n"
                                f"* Completion Proof: {completion}\n"
                                f"* Next Step: {next_step}"
                            )

                            doc_id = f"chunk_{domain_name.lower().replace(' ', '_')}_{title.lower().replace(' ', '_')[:30]}"
                            docs.append(Document(
                                page_content=content,
                                metadata={
                                    "id": doc_id,
                                    "title": title,
                                    "role": role_name,
                                    "domain": domain_name,
                                    "stage": stage_name,
                                    "difficulty": difficulty,
                                    "prerequisites": prereqs,
                                    "estimated_effort": effort,
                                    "resources": resources,
                                    "practice_tasks": practice,
                                    "project": project,
                                    "completion_proof": completion,
                                    "next_step": next_step,
                                    "type": "topic",
                                },
                            ))
            except Exception as e:
                print(f"[DocumentProcessor] Error loading domain file {file_path}: {e}")

        return docs

    def _load_career_paths_and_companies(self) -> List[Document]:
        docs: List[Document] = []
        kb_dir = settings.KNOWLEDGE_BASE_DIR

        # Career Paths
        cp_file = kb_dir / "career_paths.json"
        if cp_file.exists():
            try:
                with open(cp_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                paths = data if isinstance(data, list) else data.get("careerPaths", [])
                for cp in paths:
                    title = clean_text(cp.get("title", ""))
                    desc = clean_text(cp.get("description", ""))
                    milestones = cp.get("progressionMilestones", [])
                    m_text = "\n".join([f"- Level {m.get('level','')}: {m.get('title','')} (Skills: {', '.join(m.get('keySkills', []))})" for m in milestones])

                    content = (
                        f"### Career Path: {title}\n"
                        f"**Description:** {desc}\n"
                        f"**Progression Milestones:**\n{m_text}"
                    )
                    docs.append(Document(
                        page_content=content,
                        metadata={
                            "id": f"career_path_{title.lower().replace(' ', '_')}",
                            "title": title,
                            "role": title,
                            "domain": cp.get("domain", "Engineering"),
                            "type": "career_path",
                        },
                    ))
            except Exception as e:
                print(f"[DocumentProcessor] Error loading career paths: {e}")

        # Company Profiles
        comp_file = kb_dir / "company_profiles.json"
        if comp_file.exists():
            try:
                with open(comp_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                profiles = data if isinstance(data, list) else data.get("companyProfiles", [])
                for comp in profiles:
                    type_name = clean_text(comp.get("type", ""))
                    desc = clean_text(comp.get("description", ""))
                    focus = comp.get("hiringFocus", [])
                    expectations = comp.get("expectations", {})

                    content = (
                        f"### Company Profile: {type_name}\n"
                        f"**Description:** {desc}\n"
                        f"**Hiring Focus:** {', '.join(focus)}\n"
                        f"**Expectations:** System Design ({expectations.get('systemDesign','')}), Coding Standards ({expectations.get('codingStandards','')})"
                    )
                    docs.append(Document(
                        page_content=content,
                        metadata={
                            "id": f"company_profile_{type_name.lower().replace(' ', '_')}",
                            "title": type_name,
                            "type": "company_profile",
                        },
                    ))
            except Exception as e:
                print(f"[DocumentProcessor] Error loading company profiles: {e}")

        return docs

    def _load_curated_resources(self) -> List[Document]:
        docs: List[Document] = []
        res_file = settings.KNOWLEDGE_BASE_DIR / "curated_resources.json"
        if not res_file.exists():
            return docs

        try:
            with open(res_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            resources = data if isinstance(data, list) else data.get("resources", [])
            for res in resources:
                topic = clean_text(res.get("topic", ""))
                title = clean_text(res.get("title", ""))
                url = clean_text(res.get("url", ""))
                res_type = clean_text(res.get("type", "documentation"))
                quality = res.get("qualityTier", "official")

                content = (
                    f"### Verified Resource for {topic}\n"
                    f"**Title:** {title}\n"
                    f"**Type:** {res_type} | **Tier:** {quality}\n"
                    f"**URL:** {url}"
                )
                docs.append(Document(
                    page_content=content,
                    metadata={
                        "id": f"resource_{topic.lower().replace(' ', '_')[:20]}_{res_type}",
                        "title": title,
                        "topic": topic,
                        "url": url,
                        "res_type": res_type,
                        "type": "curated_resource",
                    },
                ))
        except Exception as e:
            print(f"[DocumentProcessor] Error loading curated resources: {e}")

        return docs

    def _load_roadmap_data(self) -> List[Document]:
        docs: List[Document] = []
        roadmap_dir = settings.ROADMAP_DATA_DIR
        if not roadmap_dir.exists():
            return docs

        # Key roadmaps to index
        key_roadmaps = [
            "backend.json", "frontend.json", "full-stack.json",
            "devops.json", "ai-engineer.json", "system-design.json",
            "cyber-security.json", "data-engineer.json"
        ]

        for r_name in key_roadmaps:
            f_path = roadmap_dir / r_name
            if not f_path.exists():
                continue
            try:
                with open(f_path, "r", encoding="utf-8") as f:
                    r_data = json.load(f)

                title = clean_text(r_data.get("title", r_name.replace(".json", "").title()))
                nodes = r_data.get("nodes", [])

                for node in nodes:
                    n_title = clean_text(node.get("title", ""))
                    n_desc = clean_text(node.get("description", ""))
                    if not n_title or len(n_title) < 2:
                        continue

                    content = (
                        f"### Topic: {n_title}\n"
                        f"**Track:** {title}\n"
                        f"**Description:** {n_desc}\n"
                        f"* Real-World Project: Build practical application for {n_title}\n"
                        f"* Completion Proof: Verify test suites for {n_title}"
                    )
                    doc_id = f"roadmap_{r_name.replace('.json', '')}_{n_title.lower().replace(' ', '_')[:25]}"
                    docs.append(Document(
                        page_content=content,
                        metadata={
                            "id": doc_id,
                            "title": n_title,
                            "role": title,
                            "track": title,
                            "type": "roadmap_topic",
                        },
                    ))
            except Exception as e:
                print(f"[DocumentProcessor] Error loading roadmap {r_name}: {e}")

        return docs

    def _load_project_tutorials(self) -> List[Document]:
        docs: List[Document] = []
        projects_file = Path(__file__).resolve().parent.parent.parent / "data" / "unified_projects.json"
        if not projects_file.exists():
            return docs

        try:
            with open(projects_file, "r", encoding="utf-8") as f:
                projects = json.load(f)

            for p in projects:
                title = clean_text(p.get("title", ""))
                slug = p.get("slug", "")
                desc = clean_text(p.get("description", ""))
                lang = p.get("language", "")
                diff = p.get("difficulty", "Intermediate")
                p_type = clean_text(p.get("projectType", "Tutorial"))
                tut_url = p.get("tutorialUrl", "")
                git_url = p.get("githubUrl", "")
                sources = p.get("sourceRepositories", [])
                what_build = clean_text(p.get("whatYouWillBuild", ""))
                outcomes = p.get("learningOutcomes", [])
                steps = p.get("steps", [])

                step_text = ""
                if steps:
                    step_text = "\n**Steps:**\n" + "\n".join([f"- Step {s.get('stepNumber')}: {s.get('title')}" for s in steps[:5]])

                content = (
                    f"### Project Tutorial: {title}\n"
                    f"**Category:** {p_type} | **Language:** {lang} | **Difficulty:** {diff}\n"
                    f"**Summary:** {desc}\n"
                    f"**What You Will Build:** {what_build if what_build else desc}\n"
                    f"**Source URL:** {tut_url or git_url}\n"
                    f"**GitHub:** {git_url}\n"
                    f"**Learning Outcomes:** {', '.join(outcomes) if outcomes else 'Hands-on system implementation'}\n"
                    f"{step_text}"
                )

                docs.append(Document(
                    page_content=content,
                    metadata={
                        "id": f"tutorial_{slug[:40]}",
                        "title": title,
                        "slug": slug,
                        "type": "project_tutorial",
                        "category": p_type,
                        "language": lang,
                        "difficulty": diff,
                        "url": tut_url or git_url,
                        "githubUrl": git_url,
                        "sourceRepositories": sources,
                    },
                ))
        except Exception as e:
            print(f"[DocumentProcessor] Error loading project tutorials: {e}")

        return docs
