const {
  getAllRoadmaps,
  getRoadmapBySlug,
  getTopicDetail,
  searchRoadmaps,
} = require("@flowctrl/roadmap-data");
const { prisma } = require("../lib/prisma");

class RoadmapsService {
  async getAllRoadmaps({ search, category, level, isPremium = false } = {}) {
    let results = search ? searchRoadmaps(search) : getAllRoadmaps();

    // Tag free roadmaps explicitly
    results = results.map((r) => ({
      ...r,
      accessLevel: "FREE",
      isPremium: false,
      isLocked: false,
    }));

    // Fetch active premium resources from PostgreSQL
    try {
      const premiumWhere = { isActive: true };
      if (category && category !== "all") {
        premiumWhere.categorySlug = category;
      }
      if (level) {
        premiumWhere.level = { equals: level, mode: "insensitive" };
      }

      const premiumResources = await prisma.premiumResource.findMany({
        where: premiumWhere,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      });

      const premiumMapped = premiumResources.map((p) => {
        const isLocked = !isPremium;
        return {
          slug: p.slug,
          title: p.title,
          description: p.description,
          category: p.categorySlug || "skill",
          level: p.level || "Advanced",
          topicCount: p.topicsCount || (p.content?.modules?.length || 0),
          iconName: p.iconName || "Sparkles",
          badge: p.badge || "PREMIUM",
          accessLevel: "PREMIUM",
          isPremium: true,
          isLocked,
          isFeatured: p.isFeatured,
          estimatedHours: p.estimatedHours,
        };
      });

      let filteredPremium = premiumMapped;
      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        filteredPremium = premiumMapped.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.slug.toLowerCase().includes(q),
        );
      }

      results = [...results, ...filteredPremium];
    } catch (e) {
      console.warn("Could not fetch premium resources from DB:", e.message);
    }

    if (category && category !== "all") {
      results = results.filter(
        (r) => r.category && r.category.toLowerCase() === category.toLowerCase(),
      );
    }

    if (level) {
      results = results.filter(
        (r) => r.level && r.level.toLowerCase() === level.toLowerCase(),
      );
    }

    return results;
  }

  async getRoadmapBySlug(slug, { isPremium = false } = {}) {
    // 1. Check if it's a standard free roadmap
    const baseRoadmap = getRoadmapBySlug(slug);
    if (baseRoadmap) {
      return {
        ...baseRoadmap,
        accessLevel: "FREE",
        isPremium: false,
        isLocked: false,
      };
    }

    // 2. Check if it's a premium resource from PostgreSQL
    try {
      const premiumResource = await prisma.premiumResource.findUnique({
        where: { slug },
      });

      if (premiumResource && premiumResource.isActive) {
        const isLocked = !isPremium;
        if (isLocked) {
          return {
            slug: premiumResource.slug,
            title: premiumResource.title,
            description: premiumResource.description,
            category: premiumResource.categorySlug,
            level: premiumResource.level,
            badge: premiumResource.badge,
            iconName: premiumResource.iconName,
            topicCount: premiumResource.topicsCount,
            accessLevel: "PREMIUM",
            isPremium: true,
            isLocked: true,
            preview: {
              overview:
                premiumResource.content?.overview || premiumResource.description,
              prerequisites: premiumResource.content?.prerequisites || [],
              modules: (premiumResource.content?.modules || []).map((m) => ({
                id: m.id,
                title: m.title,
                description: m.description,
                topicCount: m.topics?.length || 0,
              })),
            },
          };
        }

        // Convert premium modules to nodes/topics format for roadmap visualizer
        const nodes = [];
        const topics = {};
        const modules = premiumResource.content?.modules || [];

        modules.forEach((mod, modIdx) => {
          const modNodeId = `mod-${modIdx + 1}`;
          nodes.push({
            id: modNodeId,
            label: mod.title,
            type: "group",
            position: { x: 250, y: modIdx * 160 },
          });

          (mod.topics || []).forEach((top, topIdx) => {
            const topId = top.id || `${modNodeId}-top-${topIdx + 1}`;
            topics[topId] = {
              id: topId,
              title: top.title,
              description: top.summary || top.title,
              resources: top.resources || [],
            };
          });
        });

        return {
          slug: premiumResource.slug,
          title: premiumResource.title,
          description: premiumResource.description,
          category: premiumResource.categorySlug,
          level: premiumResource.level,
          badge: premiumResource.badge,
          iconName: premiumResource.iconName,
          accessLevel: "PREMIUM",
          isPremium: true,
          isLocked: false,
          nodes,
          topics,
          content: premiumResource.content,
        };
      }
    } catch (e) {
      console.warn("Error querying premium roadmap by slug:", e.message);
    }

    return null;
  }

  getTopicDetail(slug, topicId) {
    return getTopicDetail(slug, topicId);
  }
}

module.exports = new RoadmapsService();
