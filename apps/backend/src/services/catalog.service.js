const { prisma } = require("../lib/prisma");

class CatalogError extends Error {
  constructor(message, statusCode = 400, code = "CATALOG_ERROR") {
    super(message);
    this.name = "CatalogError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * List Categories
 */
async function listCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { skills: true } },
    },
  });
}

/**
 * List Skills with search and category filtering
 */
async function listSkills({ category = "", search = "", page = 1, limit = 50 } = {}) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const skip = (safePage - 1) * safeLimit;

  const where = {};
  if (category && typeof category === "string" && category.trim()) {
    where.category = { equals: category.trim(), mode: "insensitive" };
  }

  if (search && typeof search === "string" && search.trim()) {
    where.name = { contains: search.trim(), mode: "insensitive" };
  }

  const [total, skills] = await prisma.$transaction([
    prisma.skill.count({ where }),
    prisma.skill.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    skills,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
}

/**
 * List Career Paths
 */
async function listCareerPaths({ level = "", search = "" } = {}) {
  const where = {};
  if (level && typeof level === "string" && level.trim()) {
    where.level = { equals: level.trim(), mode: "insensitive" };
  }
  if (search && typeof search === "string" && search.trim()) {
    where.OR = [
      { title: { contains: search.trim(), mode: "insensitive" } },
      { description: { contains: search.trim(), mode: "insensitive" } },
    ];
  }

  return prisma.careerPath.findMany({
    where,
    orderBy: { title: "asc" },
  });
}

/**
 * Get Career Path by Slug
 */
async function getCareerPathBySlug(slug) {
  const cp = await prisma.careerPath.findUnique({
    where: { slug },
  });

  if (!cp) {
    throw new CatalogError(`Career path '${slug}' not found.`, 404, "NOT_FOUND");
  }

  return cp;
}

/**
 * Get user skills
 */
async function getUserSkills(userId) {
  return prisma.userSkill.findMany({
    where: { userId },
    include: {
      skill: true,
    },
    orderBy: { proficiency: "desc" },
  });
}

/**
 * Add or update user skill
 */
async function addUserSkill({ userId, skillName, proficiency = 3 }) {
  const cleanSkillName = String(skillName).trim();
  if (!cleanSkillName) {
    throw new CatalogError("Skill name is required.", 400, "INVALID_SKILL");
  }

  const skill = await prisma.skill.upsert({
    where: { name: cleanSkillName },
    create: { name: cleanSkillName, category: "General" },
    update: {},
  });

  const userSkill = await prisma.userSkill.upsert({
    where: {
      userId_skillId: {
        userId,
        skillId: skill.id,
      },
    },
    create: {
      userId,
      skillId: skill.id,
      proficiency,
    },
    update: {
      proficiency,
    },
    include: {
      skill: true,
    },
  });

  return userSkill;
}

/**
 * Remove user skill
 */
async function removeUserSkill({ userId, skillId }) {
  const existing = await prisma.userSkill.findFirst({
    where: {
      userId,
      OR: [{ skillId }, { skill: { name: skillId } }],
    },
  });

  if (!existing) {
    throw new CatalogError("User skill not found.", 404, "NOT_FOUND");
  }

  await prisma.userSkill.delete({
    where: { id: existing.id },
  });

  return { message: "Skill removed successfully." };
}

module.exports = {
  listCategories,
  listSkills,
  listCareerPaths,
  getCareerPathBySlug,
  getUserSkills,
  addUserSkill,
  removeUserSkill,
  CatalogError,
};
