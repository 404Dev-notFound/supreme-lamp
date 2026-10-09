import json
from pathlib import Path
from typing import List, Dict, Any, Union, Optional
from .schemas import SkillAssessmentResponse, SkillGap, UserProfile
from .config import settings

class SkillGapAnalyzer:
    """
    Skill Assessment & Prerequisite Resolver.
    Computes Current Skills -> Required Skills -> Skill Gaps.
    Strictly prioritizes missing prerequisites before advanced concepts.
    """
    def __init__(self):
        self.taxonomy = self._load_taxonomy()
        self.career_paths = self._load_career_paths()

    def _load_taxonomy(self) -> List[Dict[str, Any]]:
        tax_file = settings.KNOWLEDGE_BASE_DIR / "skills_taxonomy.json"
        if tax_file.exists():
            try:
                with open(tax_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    return data if isinstance(data, list) else []
            except Exception:
                pass
        return []

    def _load_career_paths(self) -> List[Dict[str, Any]]:
        cp_file = settings.KNOWLEDGE_BASE_DIR / "career_paths.json"
        if cp_file.exists():
            try:
                with open(cp_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    return data if isinstance(data, list) else []
            except Exception:
                pass
        return []

    def _normalize_skill(self, skill: Union[str, Dict[str, Any]]) -> str:
        if isinstance(skill, str):
            return skill.lower().strip()
        if isinstance(skill, dict):
            return str(skill.get("name", "")).lower().strip()
        return ""

    def analyze_gaps(
        self,
        current_skills: List[Union[str, Dict[str, Any]]],
        target_role: str,
        target_domain: Optional[str] = None,
    ) -> SkillAssessmentResponse:
        current_normalized = {self._normalize_skill(s) for s in (current_skills or []) if self._normalize_skill(s)}
        role_lower = target_role.lower()

        # Build skill metadata lookup from taxonomy
        skill_meta: Dict[str, Dict[str, Any]] = {}
        for item in self.taxonomy:
            name = item.get("name", "")
            if name:
                skill_meta[name.lower()] = item

        # Find matching career path
        matched_path = None
        for path in self.career_paths:
            title = path.get("title", "").lower()
            roles = [r.lower() for r in path.get("roles", [])]
            if role_lower in title or any(role_lower in r for r in roles):
                matched_path = path
                break

        if not matched_path and self.career_paths:
            matched_path = self.career_paths[0]

        required_skills: List[str] = []
        if matched_path:
            required_skills = matched_path.get("coreSkills", [])
        if not required_skills:
            # Fall back to taxonomy items matching domain
            for item in self.taxonomy:
                if target_domain and target_domain.lower() in item.get("domain", "").lower():
                    required_skills.append(item.get("name", ""))
            if not required_skills:
                required_skills = [item.get("name", "") for item in self.taxonomy[:8]]

        matched_skills: List[str] = []
        critical_gaps: List[str] = []
        missing_prereqs: List[str] = []
        recommended_gaps: List[str] = []
        all_gaps: List[SkillGap] = []

        for req in required_skills:
            req_norm = req.lower()
            meta = skill_meta.get(req_norm, {})
            prereqs = meta.get("prerequisites", [])
            importance = meta.get("importance", "Core")

            if req_norm in current_normalized or any(req_norm in c for c in current_normalized):
                matched_skills.append(req)
            else:
                missing_for_this = [p for p in prereqs if p.lower() not in current_normalized]
                if missing_for_this:
                    missing_prereqs.extend(missing_for_this)

                is_critical = importance == "Core" or meta.get("level") in ["Beginner", "Intermediate"]
                if is_critical:
                    critical_gaps.append(req)
                else:
                    recommended_gaps.append(req)

                all_gaps.append(SkillGap(
                    name=req,
                    category=meta.get("category", matched_path.get("domain", "General") if matched_path else "General"),
                    importance="CRITICAL" if is_critical else "IMPORTANT",
                    prerequisites=prereqs,
                ))

        missing_prereqs = list(dict.fromkeys(missing_prereqs))
        total_eval = len(matched_skills) + len(critical_gaps) + len(recommended_gaps)
        readiness_score = round((len(matched_skills) / total_eval * 100) if total_eval > 0 else 25.0, 1)

        return SkillAssessmentResponse(
            targetRole=target_role,
            matchedSkills=matched_skills,
            missingPrerequisites=missing_prereqs,
            criticalGaps=critical_gaps,
            recommendedGaps=recommended_gaps,
            allGaps=all_gaps,
            readinessScore=readiness_score,
        )
