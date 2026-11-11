import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

let CACHED_RESOURCES = null;

function getResourcesData() {
  if (CACHED_RESOURCES && Array.isArray(CACHED_RESOURCES) && CACHED_RESOURCES.length > 0) {
    return CACHED_RESOURCES;
  }

  const cwd = process.cwd();
  const candidatePaths = [
    path.resolve(cwd, "../../data/unified_resources.json"),
    path.resolve(cwd, "../data/unified_resources.json"),
    path.resolve(cwd, "data/unified_resources.json"),
  ];

  let rawList = [];
  for (const p of candidatePaths) {
    try {
      if (fs.existsSync(p)) {
        rawList = JSON.parse(fs.readFileSync(p, "utf8"));
        if (Array.isArray(rawList) && rawList.length > 0) break;
      }
    } catch (e) {
      // continue
    }
  }

  let seedList = [];
  const seedPaths = [
    path.resolve(cwd, "../../flowCTRL data files/seeds/premium_resources.seed.json"),
    path.resolve(cwd, "../flowCTRL data files/seeds/premium_resources.seed.json"),
    path.resolve(cwd, "flowCTRL data files/seeds/premium_resources.seed.json"),
  ];

  for (const p of seedPaths) {
    try {
      if (fs.existsSync(p)) {
        seedList = JSON.parse(fs.readFileSync(p, "utf8"));
        if (Array.isArray(seedList) && seedList.length > 0) break;
      }
    } catch (e) {
      // continue
    }
  }

  const categoryNameMap = {
    books: "Books",
    documentation: "Documentation",
    "courses-tutorials": "Courses & Tutorials",
    cheatsheets: "Cheatsheets",
    "interactive-practice": "Interactive Practice",
    "system-architecture": "System Architecture",
    awesome: "Curated Awesome",
    podcasts: "Podcasts & Audio",
  };

  const categoryIconMap = {
    books: "BookOpen",
    documentation: "FileText",
    "courses-tutorials": "GraduationCap",
    cheatsheets: "FileCode",
    "interactive-practice": "PlayCircle",
    "system-architecture": "Layers",
    awesome: "Sparkles",
    podcasts: "Headphones",
  };

  const formattedSeeds = seedList.map((s, idx) => ({
    id: s.id || `prem-${s.slug}`,
    slug: s.slug,
    title: s.title,
    description: s.description,
    categorySlug: s.categorySlug || "system-architecture",
    category: {
      id: s.categorySlug || "system-architecture",
      slug: s.categorySlug || "system-architecture",
      name: categoryNameMap[s.categorySlug] || "System Architecture",
      icon: s.iconName || "Sparkles",
    },
    accessLevel: s.accessLevel || "PREMIUM",
    level: s.level || "Advanced",
    badge: s.badge || "PREMIUM",
    iconName: s.iconName || "Sparkles",
    estimatedHours: s.estimatedHours || 30,
    topicsCount: s.topicsCount || 5,
    isLocked: false,
    isPremiumTrack: true,
    isFeatured: true,
    isPinned: true,
    sortOrder: idx,
    url: s.externalUrl || `/resources/${s.slug}`,
    externalUrl: s.externalUrl || `/resources/${s.slug}`,
    author: s.content?.author || "flowCTRL Staff Engineering",
    format: s.content?.format || "GUIDE",
    language: s.content?.language || "System Architecture",
    type: s.content?.type || "CURRICULUM",
    rating: s.content?.rating || 4.9,
    tags: s.content?.tags || ["Architecture", "System Design", "Distributed Systems"],
  }));

  const seedSlugs = new Set(seedList.map((s) => s.slug));

  const formattedUnified = rawList
    .filter((u) => !seedSlugs.has(u.slug))
    .map((u, idx) => {
      const catSlug =
        u.categorySlug ||
        (u.category ? String(u.category).toLowerCase().replace(/\s+/g, "-") : "books");

      return {
        id: u.id || `res-${u.slug}`,
        slug: u.slug,
        title: u.title,
        description: u.description || "",
        categorySlug: catSlug,
        category: {
          id: catSlug,
          slug: catSlug,
          name: categoryNameMap[catSlug] || u.category || catSlug,
          icon: categoryIconMap[catSlug] || "BookOpen",
        },
        accessLevel: u.accessLevel || "FREE",
        level: u.level || "Intermediate",
        badge: u.badge || u.type || "RESOURCE",
        iconName: categoryIconMap[catSlug] || "BookOpen",
        estimatedHours: u.estimatedHours,
        topicsCount: u.topicsCount || 1,
        isLocked: false,
        isPremiumTrack: u.accessLevel === "PREMIUM",
        isFeatured: Boolean(u.isFeatured),
        isPinned: Boolean(u.isPinned),
        sortOrder: 10 + idx,
        url: u.url || u.externalUrl || null,
        externalUrl: u.externalUrl || u.url || null,
        author: u.author || "Community Curated",
        format: u.format || (u.type === "BOOK" ? "BOOK" : "WEB"),
        language: u.language || "General",
        type: u.type || "BOOK",
        rating: u.rating || 4.8,
        tags: Array.isArray(u.tags) ? u.tags : [],
      };
    });

  CACHED_RESOURCES = [...formattedSeeds, ...formattedUnified];
  return CACHED_RESOURCES;
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");
    const category = searchParams.get("category");
    const level = searchParams.get("level");
    const search = searchParams.get("search");

    let dataset = getResourcesData();

    if (category && category !== "all") {
      const cat = category.toLowerCase().trim();
      dataset = dataset.filter(
        (r) =>
          (r.categorySlug && r.categorySlug.toLowerCase() === cat) ||
          (r.category?.slug && r.category.slug.toLowerCase() === cat) ||
          (r.category?.name && r.category.name.toLowerCase() === cat) ||
          (r.type && r.type.toLowerCase() === cat)
      );
    }

    if (level && level !== "all") {
      const lvl = level.toLowerCase().trim();
      dataset = dataset.filter((r) => r.level && r.level.toLowerCase() === lvl);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      dataset = dataset.filter((r) => {
        const matchTitle = r.title && r.title.toLowerCase().includes(q);
        const matchDesc = r.description && r.description.toLowerCase().includes(q);
        const matchSlug = r.slug && r.slug.toLowerCase().includes(q);
        const matchAuthor = r.author && r.author.toLowerCase().includes(q);
        const matchTags = Array.isArray(r.tags) && r.tags.some((t) => t.toLowerCase().includes(q));
        return matchTitle || matchDesc || matchSlug || matchAuthor || matchTags;
      });
    }

    const total = dataset.length;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 24));
    const skip = (pageNum - 1) * limitNum;

    const items = dataset.slice(skip, skip + limitNum);

    const res = NextResponse.json({
      success: true,
      resources: items,
      total,
      count: items.length,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      limit: limitNum,
    });

    res.headers.set("Cache-Control", "public, max-age=60, s-maxage=300");
    return res;
  } catch (error) {
    console.error("[Next.js Resources API Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load curated resources." },
      { status: 500 }
    );
  }
}

