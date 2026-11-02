const { sanitizeInput } = require("../config/promptTemplates");

const VALID_COMPANY_TYPES = [
  "Product-based company",
  "Service-based company",
  "Startup",
  "R&D",
  "Research",
  "Academia",
  "Freelancing",
  "Open-source",
  "Entrepreneurship",
  "Government / public-sector technology roles",
  "Other",
];

const VALID_DOMAINS = [
  "Software Development",
  "Web Development",
  "Backend Engineering",
  "Frontend Engineering",
  "Mobile Development",
  "Cloud / DevOps",
  "AI/ML",
  "Data Science",
  "Cybersecurity",
  "Embedded / IoT",
  "Blockchain / Web3",
  "Game Development",
  "Other",
];

const VALID_LEVELS = ["Beginner", "Intermediate", "Senior", "Lead"];

/**
 * Validates and normalizes structured user career profiles and skill assessments.
 */
class UserProfileMapper {
  static mapProfile(rawInput = {}) {
    if (!rawInput || typeof rawInput !== "object") {
      throw new Error("Invalid profile payload: expected object.");
    }

    // 1. Target Role & Domain
    const targetRole = sanitizeInput(rawInput.targetRole || "Full Stack Developer");
    let targetDomain = sanitizeInput(rawInput.targetDomain || "Software Development");
    if (!VALID_DOMAINS.includes(targetDomain)) {
      targetDomain = "Software Development";
    }

    // 2. Company Type / Industry Goal
    let targetCompanyType = sanitizeInput(rawInput.targetCompanyType || "Product-based company");
    if (!VALID_COMPANY_TYPES.includes(targetCompanyType)) {
      targetCompanyType = "Product-based company";
    }

    // 3. Career Goals (allow multiple)
    let careerGoals = [];
    if (Array.isArray(rawInput.careerGoals)) {
      careerGoals = rawInput.careerGoals
        .map(sanitizeInput)
        .filter((g) => g.length > 0 && g.length <= 80);
    } else if (typeof rawInput.careerGoals === "string") {
      careerGoals = [sanitizeInput(rawInput.careerGoals)].filter(Boolean);
    }
    if (careerGoals.length === 0) {
      careerGoals = [targetCompanyType];
    }

    // 4. Experience Level
    let experienceLevel = sanitizeInput(rawInput.experienceLevel || "Beginner");
    if (!VALID_LEVELS.includes(experienceLevel)) {
      experienceLevel = "Beginner";
    }

    // 5. Current Technical Skills & Proficiency (1-5)
    let currentSkills = [];
    if (Array.isArray(rawInput.currentSkills)) {
      currentSkills = rawInput.currentSkills.map((item) => {
        if (typeof item === "string") {
          return {
            name: sanitizeInput(item),
            proficiency: 3, // Default intermediate if unrated
          };
        }
        if (item && typeof item === "object") {
          const name = sanitizeInput(item.name || item.skill || "");
          const proficiency = Math.max(1, Math.min(5, parseInt(item.proficiency || 3, 10)));
          return { name, proficiency };
        }
        return null;
      }).filter((s) => s && s.name.length > 0);
    }

    // 6. Technologies user specifically desires to learn
    let desiredTechnologies = [];
    if (Array.isArray(rawInput.desiredTechnologies)) {
      desiredTechnologies = rawInput.desiredTechnologies.map(sanitizeInput).filter(Boolean);
    }

    // 7. Preferred Learning Direction
    const preferredDirection = sanitizeInput(
      rawInput.preferredDirection || "Hands-on projects with deep fundamentals"
    );

    return {
      userId: rawInput.userId || null,
      targetRole,
      targetDomain,
      targetCompanyType,
      careerGoals,
      experienceLevel,
      currentSkills,
      desiredTechnologies,
      preferredDirection,
      completedProjectsCount: Math.max(0, parseInt(rawInput.completedProjectsCount || 0, 10)),
      updatedAt: new Date().toISOString(),
    };
  }
}

module.exports = {
  UserProfileMapper,
  VALID_COMPANY_TYPES,
  VALID_DOMAINS,
  VALID_LEVELS,
};
