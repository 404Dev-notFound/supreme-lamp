const fs = require("fs");
const path = require("path");
const {
  getAllRoadmaps,
  getRoadmapBySlug,
  getTopicDetail,
  searchRoadmaps,
} = require("@flowctrl/roadmap-data");
const { prisma } = require("../lib/prisma");
const { cache, buildKey, REDIS_CONFIG } = require("../lib/redis");

let CACHED_PREMIUM_SEEDS = null;

function loadPremiumRoadmapSeeds() {
  if (CACHED_PREMIUM_SEEDS && Array.isArray(CACHED_PREMIUM_SEEDS) && CACHED_PREMIUM_SEEDS.length > 0) {
    return CACHED_PREMIUM_SEEDS;
  }

  const candidatePaths = [
    path.resolve(__dirname, "../../../../flowCTRL data files/seeds/premium_resources.seed.json"),
    path.resolve(__dirname, "../../../flowCTRL data files/seeds/premium_resources.seed.json"),
    path.resolve(process.cwd(), "flowCTRL data files/seeds/premium_resources.seed.json"),
  ];

  for (const p of candidatePaths) {
    try {
      if (fs.existsSync(p)) {
        const raw = JSON.parse(fs.readFileSync(p, "utf8"));
        if (Array.isArray(raw) && raw.length > 0) {
          CACHED_PREMIUM_SEEDS = raw;
          return CACHED_PREMIUM_SEEDS;
        }
      }
    } catch (e) {
      // continue
    }
  }
  return [];
}

class RoadmapsService {
  async getAllRoadmaps({ search, category, level, isPremium = false } = {}) {
    const cacheKey = buildKey(
      REDIS_CONFIG.namespaces.ROADMAPS,
      "catalog",
      `${search || "all"}:${category || "all"}:${level || "all"}:${Boolean(isPremium)}`
    );

    return cache.getOrSet(
      cacheKey,
      async () => {
        let results = search ? searchRoadmaps(search) : getAllRoadmaps();

        // Classify standard roadmaps: Advanced level is automatically classified as Premium
        results = results.map((r) => {
          const isAdvanced = (r.level || "").toLowerCase() === "advanced";
          const isItemPremium = isAdvanced || r.accessLevel === "PREMIUM" || Boolean(r.isPremium);
          return {
            ...r,
            accessLevel: isItemPremium ? "PREMIUM" : "FREE",
            isPremium: isItemPremium,
            isLocked: isItemPremium && !isPremium,
            badge: isItemPremium ? "PREMIUM" : (r.badge || null),
            isPinned: false,
          };
        });

        // Fetch active premium roadmaps from PostgreSQL or seed fallback
        let premiumResources = [];
        try {
          const premiumWhere = { isActive: true };
          if (category && category !== "all" && category.toLowerCase() !== "premium") {
            premiumWhere.categorySlug = category;
          }
          if (level) {
            premiumWhere.level = { equals: level, mode: "insensitive" };
          }

          premiumResources = await prisma.premiumResource.findMany({
            where: {
              isActive: true,
              OR: [
                { categorySlug: { in: ["system-design", "roadmaps"] } },
                { isPinned: true },
                {
                  slug: {
                    in: [
                      "system-design-architecture",
                      "distributed-systems-architecture",
                      "offensive-security-red-teaming",
                      "autonomous-ai-agents",
                      "kubernetes-platform-engineering",
                      "applied-cryptography-zkp",
                      "high-performance-databases",
                      "llm-engineering-rag-systems",
                      "cloud-native-kubernetes-gitops",
                    ],
                  },
                },
              ],
            },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          });
        } catch (e) {
          // Gracefully fall back to seed catalog if database is offline or unseeded
        }

        if (!premiumResources || premiumResources.length === 0) {
          const seeds = loadPremiumRoadmapSeeds();
          premiumResources = seeds.map((s, idx) => ({
            ...s,
            isActive: true,
            sortOrder: s.sortOrder !== undefined ? s.sortOrder : idx,
          }));
        }

        try {
          // Only include full roadmaps with defined curriculum modules
          const roadmapModules = premiumResources.filter(
            (p) => p.content?.modules && Array.isArray(p.content.modules) && p.content.modules.length > 0
          );

          const premiumMapped = roadmapModules.map((p) => {
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
              isPinned: false,
              sortOrder: p.sortOrder,
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

          // Merge without duplicates and sort alphabetically to mix Free and Premium naturally
          const existingSlugs = new Set(results.map((r) => r.slug));
          const uniquePremium = filteredPremium.filter((p) => !existingSlugs.has(p.slug));
          const combined = [...results, ...uniquePremium];
          combined.sort((a, b) => a.title.localeCompare(b.title));
          results = combined;
        } catch (e) {
          console.warn("Could not process premium resources:", e.message);
        }

        if (category && category !== "all") {
          if (category.toLowerCase() === "premium") {
            results = results.filter((r) => r.isPremium);
          } else {
            results = results.filter(
              (r) => r.category && r.category.toLowerCase() === category.toLowerCase(),
            );
          }
        }

        if (level) {
          results = results.filter(
            (r) => r.level && r.level.toLowerCase() === level.toLowerCase(),
          );
        }

        return results;
      },
      REDIS_CONFIG.ttl.ROADMAP_CATALOG
    );
  }

  async getRoadmapBySlug(slug, { isPremium = false } = {}) {
    const cacheKey = buildKey(
      REDIS_CONFIG.namespaces.ROADMAPS,
      "detail",
      `${slug}:${Boolean(isPremium)}`
    );

    return cache.getOrSet(
      cacheKey,
      async () => {
        // 1. Check if it's a standard roadmap
        const baseRoadmap = getRoadmapBySlug(slug);
        if (baseRoadmap) {
          const isAdvanced = (baseRoadmap.level || "").toLowerCase() === "advanced";
          const isItemPremium = isAdvanced || baseRoadmap.accessLevel === "PREMIUM" || Boolean(baseRoadmap.isPremium);
          const isLocked = isItemPremium && !isPremium;

          if (isLocked) {
            return {
              ...baseRoadmap,
              accessLevel: "PREMIUM",
              isPremium: true,
              isLocked: true,
              badge: "PREMIUM",
              preview: {
                overview: baseRoadmap.description,
                prerequisites: ["Fundamental Software Engineering Concepts"],
                modules: Object.entries(baseRoadmap.topics || {}).slice(0, 5).map(([id, t]) => ({
                  id,
                  title: t.title || id,
                  description: t.description || "",
                  topicCount: 1,
                })),
              },
            };
          }

          return {
            ...baseRoadmap,
            accessLevel: isItemPremium ? "PREMIUM" : "FREE",
            isPremium: isItemPremium,
            isLocked: false,
            badge: isItemPremium ? "PREMIUM" : (baseRoadmap.badge || null),
            isPinned: false,
          };
        }

        // 2. Check if it's a premium resource from PostgreSQL or seed fallback
        try {
          let premiumResource = null;
          try {
            premiumResource = await prisma.premiumResource.findUnique({
              where: { slug },
            });
          } catch (dbErr) {
            // DB offline or unseeded - handled by seed fallback below
          }

          if (!premiumResource) {
            const seeds = loadPremiumRoadmapSeeds();
            const match = seeds.find((s) => s.slug === slug);
            if (match) {
              premiumResource = {
                ...match,
                isActive: true,
                isPinned: match.isPinned !== false,
              };
            }
          }

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
                isPinned: premiumResource.isPinned !== false,
                sortOrder: premiumResource.sortOrder,
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
              isPinned: premiumResource.isPinned !== false,
              sortOrder: premiumResource.sortOrder,
              nodes,
              topics,
              content: premiumResource.content,
            };
          }
        } catch (e) {
          console.warn("Error querying premium roadmap by slug:", e.message);
        }

        return null;
      },
      REDIS_CONFIG.ttl.ROADMAP_DETAIL
    );
  }

  async getTopicDetail(slug, topicId) {
    const cacheKey = buildKey(
      REDIS_CONFIG.namespaces.ROADMAPS,
      "topic",
      `${slug}:${topicId}`
    );

    return cache.getOrSet(
      cacheKey,
      async () => getTopicDetail(slug, topicId),
      REDIS_CONFIG.ttl.ROADMAP_DETAIL
    );
  }

  async invalidateCache() {
    return cache.delPattern(buildKey(REDIS_CONFIG.namespaces.ROADMAPS, "*"));
  }
}

module.exports = new RoadmapsService();
