const fs = require("fs");
const path = require("path");
const config = require("../config");

/**
 * Computes: Current Skills → Required Skills → Skill Gaps → Learning Path.
 * Uses skills taxonomy to detect missing prerequisites, role requirements, and learning priorities.
 */
class SkillGapAnalyzer {
  constructor(taxonomyPath) {
    this.taxonomyPath = taxonomyPath || path.join(config.knowledgeBasePath, "skills_taxonomy.json");
    this.taxonomy = [];
    this.skillMap = new Map();
    this.loadTaxonomy();
  }

  loadTaxonomy() {
    try {
      if (fs.existsSync(this.taxonomyPath)) {
        const raw = fs.readFileSync(this.taxonomyPath, "utf-8");
        this.taxonomy = JSON.parse(raw);
        for (const skill of this.taxonomy) {
          this.skillMap.set(skill.name.toLowerCase(), skill);
          this.skillMap.set(skill.id.toLowerCase(), skill);
        }
      }
    } catch (e) {
      this.taxonomy = [];
    }
  }

  /**
   * Analyzes skill gaps between user's current skills and target role requirements
   */
  analyzeGaps({ currentSkills = [], targetRole = "", targetDomain = "", requiredSkills = [] }) {
    // 1. Index user's known skills and their proficiency (1-5)
    // Proficiency >= 4 is considered "Mastered"
    const userKnown = new Map();
    for (const item of currentSkills) {
      const name = typeof item === "string" ? item : item.name;
      const level = typeof item === "object" ? item.proficiency || 3 : 3;
      if (name) {
        userKnown.set(name.toLowerCase(), level);
      }
    }

    // 2. Identify required skills for the role
    const needed = new Set();

    // From explicit required skills
    for (const r of requiredSkills) {
      needed.add(r.toLowerCase());
    }

    // From taxonomy matching role or domain
    for (const s of this.taxonomy) {
      if (targetDomain && s.domain?.toLowerCase() === targetDomain.toLowerCase()) {
        needed.add(s.name.toLowerCase());
      }
    }

    // Default required skills if empty
    if (needed.size === 0) {
      if (targetRole.toLowerCase().includes("backend")) {
        ["javascript", "node.js", "postgresql", "rest apis", "docker", "system design"].forEach((s) => needed.add(s));
      } else if (targetRole.toLowerCase().includes("frontend")) {
        ["javascript", "react", "typescript", "next.js", "css", "web vitals"].forEach((s) => needed.add(s));
      } else if (targetRole.toLowerCase().includes("ai") || targetRole.toLowerCase().includes("ml")) {
        ["python", "pandas", "scikit-learn", "pytorch", "vector databases", "rag"].forEach((s) => needed.add(s));
      } else {
        ["javascript", "python", "sql", "git", "data structures"].forEach((s) => needed.add(s));
      }
    }

    // 3. Compute Gaps:
    // Filter out skills the user has mastered (proficiency >= 4)
    // unless they are prerequisites for a missing skill!
    const gaps = [];
    const missingPrerequisites = [];

    for (const reqSkillName of needed) {
      const userLevel = userKnown.get(reqSkillName);
      const isMastered = userLevel && userLevel >= 4;

      if (!isMastered) {
        const taxonomyItem = this.skillMap.get(reqSkillName);
        const priority = taxonomyItem?.importance === "Core" ? "HIGH" : "MEDIUM";

        // Check if this needed skill has prerequisites that the user doesn't have
        if (taxonomyItem && Array.isArray(taxonomyItem.prerequisites)) {
          for (const prereqId of taxonomyItem.prerequisites) {
            const prereqSkill = this.skillMap.get(prereqId.toLowerCase());
            const prereqName = prereqSkill ? prereqSkill.name : prereqId;
            const hasPrereq = userKnown.has(prereqName.toLowerCase());

            if (!hasPrereq && !missingPrerequisites.some((p) => p.name.toLowerCase() === prereqName.toLowerCase())) {
              missingPrerequisites.push({
                name: prereqName,
                priority: "CRITICAL_PREREQUISITE",
                reason: `Prerequisite required before learning ${taxonomyItem.name}`,
                difficulty: prereqSkill?.level || "Beginner",
              });
            }
          }
        }

        gaps.push({
          name: taxonomyItem ? taxonomyItem.name : reqSkillName,
          currentLevel: userLevel || 0,
          targetLevel: 4,
          priority: userLevel ? "MEDIUM" : priority,
          reason: userLevel
            ? `Current proficiency is level ${userLevel}/5; requires advanced mastery.`
            : `Missing core competency for target role ${targetRole}.`,
          difficulty: taxonomyItem?.level || "Intermediate",
        });
      }
    }

    // Place critical prerequisites at the start of learning path
    const prioritizedGaps = [...missingPrerequisites, ...gaps];

    return {
      masteredSkills: Array.from(userKnown.entries())
        .filter(([_, lvl]) => lvl >= 4)
        .map(([name, lvl]) => ({ name, level: lvl })),
      inProgressSkills: Array.from(userKnown.entries())
        .filter(([_, lvl]) => lvl > 0 && lvl < 4)
        .map(([name, lvl]) => ({ name, level: lvl })),
      skillGaps: prioritizedGaps,
      totalGapsCount: prioritizedGaps.length,
    };
  }
}

module.exports = {
  SkillGapAnalyzer,
};
