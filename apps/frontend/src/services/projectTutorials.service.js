/**
 * Client-Side-First Service for Project-Building Tutorials
 * 
 * Provides:
 * - Multi-layer caching for catalog (12h TTL), categories (7d TTL), and languages (7d TTL)
 * - SWR caching for individual project detail guides (24h TTL)
 * - Optimistic local mutations on step completion and bookmarks
 */

import { clientCache, CACHE_STRATEGIES, DEFAULT_TTLS } from "@/lib/storage/clientCacheManager";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
import { STORES } from "@/lib/storage/indexedDbStorage";

export const projectTutorialsService = {
  /**
   * Fetch project catalog with filters, search, and pagination via SWR cache
   */
  async fetchProjects({
    search = "",
    category = "",
    language = "",
    difficulty = "",
    page = 1,
    limit = 12,
    sort = "recommended",
  } = {}) {
        const params = {
      search,
      category: category && category !== "all" ? category : undefined,
      language: language && language !== "all" ? language : undefined,
      difficulty: difficulty && difficulty !== "all" ? difficulty : undefined,
      page: String(page),
      limit: String(limit),
      sort,
    };

    const cacheKey = clientCache.buildCacheKey(`${API_BASE}/api/project-tutorials`, params);

    return clientCache.execute({
      url: `${API_BASE}/api/project-tutorials`,
      params,
      cacheKey,
      storeName: STORES.PROJECT_TUTORIALS,
      strategy: CACHE_STRATEGIES.SWR,
      ttlMs: DEFAULT_TTLS.PROJECTS_CATALOG,
      fetcher: async () => {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined) queryParams.append(k, v);
        });

        const res = await fetch(`${API_BASE}/api/project-tutorials?${queryParams.toString()}`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) throw new Error(`Failed to load projects: ${res.statusText}`);
        return res.json();
      },
    });
  },

  /**
   * Fetch all categories with 7-day TTL cache
   */
  async fetchCategories() {
        return clientCache.execute({
      url: `${API_BASE}/api/project-tutorials/categories`,
      cacheKey: "projects:categories",
      storeName: STORES.PROJECT_TUTORIALS,
      strategy: CACHE_STRATEGIES.SWR,
      ttlMs: DEFAULT_TTLS.STATIC_METADATA,
      fetcher: async () => {
        const res = await fetch(`${API_BASE}/api/project-tutorials/categories`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to load categories");
        const json = await res.json();
        return json.data || [];
      },
    });
  },

  /**
   * Fetch all languages with 7-day TTL cache
   */
  async fetchLanguages() {
    return clientCache.execute({
      url: `${API_BASE}/api/project-tutorials/languages`,
      cacheKey: "projects:languages",
      storeName: STORES.PROJECT_TUTORIALS,
      strategy: CACHE_STRATEGIES.SWR,
      ttlMs: DEFAULT_TTLS.STATIC_METADATA,
      fetcher: async () => {
        const res = await fetch(`${API_BASE}/api/project-tutorials/languages`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to load languages");
        const json = await res.json();
        return json.data || [];
      },
    });
  },

  /**
   * Fetch project detail by slug with 24h SWR cache
   */
  async fetchProjectBySlug(slug) {
    if (!slug) return null;

    const cacheKey = `projects:detail:${slug}`;

    return clientCache.execute({
      url: `${API_BASE}/api/project-tutorials/${slug}`,
      cacheKey,
      storeName: STORES.PROJECT_TUTORIALS,
      strategy: CACHE_STRATEGIES.SWR,
      ttlMs: DEFAULT_TTLS.PROJECT_DETAIL,
      fetcher: async () => {
        const res = await fetch(`${API_BASE}/api/project-tutorials/${slug}`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) {
          if (res.status === 404) return null;
          throw new Error(`Failed to load project: ${res.statusText}`);
        }
        return res.json();
      },
    });
  },

  /**
   * Start building a project
   */
  async startProject(projectId) {
    const res = await fetch(`${API_BASE}/api/project-tutorials/${projectId}/start`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("Failed to start project");
    const json = await res.json();
    // Invalidate user progress cache
    await clientCache.idb.delete(STORES.USER_PROGRESS, `progress:${projectId}`);
    return json;
  },

  /**
   * Update step completion status
   */
  async updateStepProgress(projectId, stepNumber, isCompleted, notes = null) {
    const res = await fetch(`${API_BASE}/api/project-tutorials/${projectId}/steps/${stepNumber}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isCompleted, notes }),
    });
    if (!res.ok) throw new Error("Failed to update step progress");
    const json = await res.json();
    return json;
  },

  /**
   * Mark whole project as complete
   */
  async completeProject(projectId) {
    const res = await fetch(`${API_BASE}/api/project-tutorials/${projectId}/complete`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("Failed to complete project");
    return res.json();
  },

  /**
   * Fetch current user's active and completed projects
   */
  async fetchMyProgress() {
    const res = await fetch(`${API_BASE}/api/project-tutorials/user/my-progress`, {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("Failed to fetch my progress");
    return res.json();
  },

  /**
   * Toggle project bookmark
   */
  async toggleBookmark(projectId) {
    const res = await fetch(`${API_BASE}/api/project-tutorials/${projectId}/bookmark`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("Failed to toggle bookmark");
    return res.json();
  },

  /**
   * Fetch current user's bookmarked projects
   */
  async fetchMyBookmarks() {
    const res = await fetch(`${API_BASE}/api/project-tutorials/user/bookmarks`, {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("Failed to fetch bookmarks");
    return res.json();
  },
};
