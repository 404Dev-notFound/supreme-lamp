/**
 * Client-Side-First Curated Resources Service
 * 
 * Provides:
 * - Multi-layer caching for paginated resource lists and category metadata
 * - In-memory prefix indexing for zero-latency keystroke search
 * - Offline fallback support for previously loaded resource pages
 */

import { clientCache, CACHE_STRATEGIES, DEFAULT_TTLS } from "@/lib/storage/clientCacheManager";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
import { STORES } from "@/lib/storage/indexedDbStorage";

class ResourcesClientService {
  /**
   * Fetch paginated resources with SWR caching
   */
  async fetchResources({
    page = 1,
    limit = 24,
    category = "all",
    level = "all",
    search = "",
    onBackgroundUpdate,
  } = {}) {
        const params = {
      page: String(page),
      limit: String(limit),
      category: category && category !== "all" ? category : undefined,
      level: level && level !== "all" ? level : undefined,
      search: search && search.trim() ? search.trim() : undefined,
    };

    const cacheKey = clientCache.buildCacheKey(`${API_BASE}/api/resources`, params);

    return clientCache.execute({
      url: `${API_BASE}/api/resources`,
      params,
      cacheKey,
      storeName: STORES.RESOURCES,
      strategy: CACHE_STRATEGIES.SWR,
      ttlMs: DEFAULT_TTLS.RESOURCES_CATALOG,
      onBackgroundUpdate,
      fetcher: async () => {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined) queryParams.append(k, v);
        });

        const res = await fetch(`${API_BASE}/api/resources?${queryParams.toString()}`, {
          headers: { Accept: "application/json" },
        });

        if (!res.ok) throw new Error("Failed to load curated resources");
        const json = await res.json();
        return json;
      },
    });
  }

  /**
   * Fetch resource categories with 7-day TTL cache
   */
  async fetchCategories({ onBackgroundUpdate } = {}) {
        return clientCache.execute({
      url: `${API_BASE}/api/resources/categories`,
      cacheKey: "resources:categories",
      storeName: STORES.RESOURCES,
      strategy: CACHE_STRATEGIES.SWR,
      ttlMs: DEFAULT_TTLS.STATIC_METADATA,
      onBackgroundUpdate,
      fetcher: async () => {
        const res = await fetch(`${API_BASE}/api/resources/categories`);
        if (!res.ok) throw new Error("Failed to load resource categories");
        const json = await res.json();
        return json.data || [];
      },
    });
  }
}

export const resourcesService = new ResourcesClientService();

