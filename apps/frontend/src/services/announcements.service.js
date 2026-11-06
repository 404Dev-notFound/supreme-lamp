/**
 * Client-Side-First Announcements Service
 * 
 * Provides:
 * - Multi-layer caching for platform broadcasts and notifications (30m TTL)
 * - SWR background updates
 */

import { clientCache, CACHE_STRATEGIES, DEFAULT_TTLS } from "@/lib/storage/clientCacheManager";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
import { STORES } from "@/lib/storage/indexedDbStorage";

class AnnouncementsClientService {
  /**
   * Fetch all platform announcements with SWR caching
   */
  async fetchAnnouncements({ category = "all", onBackgroundUpdate } = {}) {
        const params = category && category !== "all" ? { category } : {};
    const cacheKey = clientCache.buildCacheKey(`${API_BASE}/api/announcements`, params);

    return clientCache.execute({
      url: `${API_BASE}/api/announcements`,
      params,
      cacheKey,
      storeName: STORES.ANNOUNCEMENTS,
      strategy: CACHE_STRATEGIES.SWR,
      ttlMs: DEFAULT_TTLS.ANNOUNCEMENTS,
      onBackgroundUpdate,
      fetcher: async () => {
        const queryParams = new URLSearchParams();
        if (params.category) queryParams.append("category", params.category);

        const res = await fetch(`${API_BASE}/api/announcements?${queryParams.toString()}`, {
          credentials: "include",
          headers: { Accept: "application/json" },
        });

        if (!res.ok) throw new Error("Failed to load announcements");
        const json = await res.json();
        return json.data || [];
      },
    });
  }
}

export const announcementsService = new AnnouncementsClientService();

