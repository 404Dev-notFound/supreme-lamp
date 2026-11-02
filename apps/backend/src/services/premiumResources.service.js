const { prisma } = require("../lib/prisma");

class ResourceNotFoundError extends Error {
  constructor(message = "Resource not found", statusCode = 404) {
    super(message);
    this.name = "ResourceNotFoundError";
    this.statusCode = statusCode;
    this.code = "RESOURCE_NOT_FOUND";
  }
}

/**
 * List all curated resources.
 * Strips confidential module content and deep source links if client is not an active Premium member.
 */
async function listResources({ isPremium = false, category = null, level = null, search = null } = {}) {
  const where = {
    isActive: true,
  };

  if (category) {
    where.categorySlug = category;
  }

  if (level) {
    where.level = { equals: level, mode: "insensitive" };
  }

  if (search && search.trim()) {
    const q = search.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
    ];
  }

  const items = await prisma.premiumResource.findMany({
    where,
    include: {
      category: {
        select: { id: true, slug: true, name: true, icon: true },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return items.map((r) => {
    const isLocked = r.accessLevel === "PREMIUM" && !isPremium;

    // For non-premium users, build safe teaser outline without deep URLs
    let moduleOutlines = [];
    if (r.content?.modules && Array.isArray(r.content.modules)) {
      moduleOutlines = r.content.modules.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        topicCount: m.topics?.length || 0,
      }));
    }

    return {
      id: r.id,
      slug: r.slug,
      title: r.title,
      description: r.description,
      categorySlug: r.categorySlug,
      category: r.category,
      accessLevel: r.accessLevel,
      level: r.level,
      badge: r.badge,
      iconName: r.iconName,
      estimatedHours: r.estimatedHours,
      topicsCount: r.topicsCount || moduleOutlines.reduce((acc, m) => acc + m.topicCount, 0),
      isLocked,
      isPremiumTrack: r.accessLevel === "PREMIUM",
      isFeatured: r.isFeatured,
      sortOrder: r.sortOrder,
      moduleOutlines,
      // Only include full curriculum if verified Premium or Free access
      ...(isLocked ? {} : { content: r.content }),
    };
  });
}

/**
 * Get single resource by slug with entitlement enforcement.
 */
async function getResourceBySlug(slug, { isPremium = false } = {}) {
  const resource = await prisma.premiumResource.findUnique({
    where: { slug },
    include: {
      category: true,
    },
  });

  if (!resource || !resource.isActive) {
    throw new ResourceNotFoundError(`Resource '${slug}' was not found.`);
  }

  const isLocked = resource.accessLevel === "PREMIUM" && !isPremium;

  const moduleOutlines = (resource.content?.modules || []).map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    topicCount: m.topics?.length || 0,
  }));

  if (isLocked) {
    return {
      id: resource.id,
      slug: resource.slug,
      title: resource.title,
      description: resource.description,
      categorySlug: resource.categorySlug,
      category: resource.category,
      accessLevel: resource.accessLevel,
      level: resource.level,
      badge: resource.badge,
      iconName: resource.iconName,
      estimatedHours: resource.estimatedHours,
      topicsCount: resource.topicsCount || moduleOutlines.reduce((acc, m) => acc + m.topicCount, 0),
      isLocked: true,
      isPremiumTrack: true,
      moduleOutlines,
      preview: {
        overview: resource.content?.overview || resource.description,
        prerequisites: resource.content?.prerequisites || [],
      },
    };
  }

  return {
    ...resource,
    isLocked: false,
    isPremiumTrack: resource.accessLevel === "PREMIUM",
    moduleOutlines,
  };
}

/**
 * Get all resource categories.
 */
async function getResourceCategories() {
  return prisma.resourceCategory.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: {
        select: { resources: true },
      },
    },
  });
}

module.exports = {
  ResourceNotFoundError,
  listResources,
  getResourceBySlug,
  getResourceCategories,
};

