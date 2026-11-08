/**
 * Client-Side-First Roadmaps Service
 * 
 * Provides:
 * - Multi-layer caching (Memory LRU -> IndexedDB -> Network SWR)
 * - Intelligent prefetching of adjacent roadmaps
 * - Zero-latency route navigation on repeat visits
 */

import { clientCache, CACHE_STRATEGIES, DEFAULT_TTLS } from "@/lib/storage/clientCacheManager";
import { apiClient } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
import { STORES } from "@/lib/storage/indexedDbStorage";
import { getAllRoadmaps, getRoadmapBySlug } from "@flowctrl/roadmap-data";

class RoadmapsClientService {
  /**
   * Fetch full roadmaps catalog with SWR caching
   */
  async fetchCatalog({ onBackgroundUpdate } = {}) {
        return clientCache.execute({
      url: `${API_BASE}/api/roadmaps`,
      cacheKey: "roadmaps:catalog",
      storeName: STORES.ROADMAPS,
      strategy: CACHE_STRATEGIES.SWR,
      ttlMs: DEFAULT_TTLS.ROADMAPS_CATALOG,
      onBackgroundUpdate,
      fetcher: async () => {
        try {
          const res = await fetch(`${API_BASE}/api/roadmaps`, {
            credentials: "include",
            headers: { Accept: "application/json" },
          });
          if (res.ok) {
            const json = await res.json();
            if (json?.data && Array.isArray(json.data)) return json.data;
          }
        } catch (err) {
          console.warn("API catalog fetch error, checking static fallback:", err.message);
        }
        // Fallback to embedded static roadmap index
        return getAllRoadmaps().map((r) => ({
          ...r,
          accessLevel: "FREE",
          isPremium: false,
          isLocked: false,
        }));
      },
    });
  }

  /**
   * Fetch complete roadmap detail and graph by slug with SWR caching
   */
  async fetchDetailBySlug(slug, { onBackgroundUpdate } = {}) {
    if (!slug) return null;
    
    return clientCache.execute({
      url: `${API_BASE}/api/roadmaps/${slug}`,
      cacheKey: `roadmaps:detail:${slug}`,
      storeName: STORES.ROADMAPS,
      strategy: CACHE_STRATEGIES.SWR,
      ttlMs: DEFAULT_TTLS.ROADMAP_DETAIL,
      onBackgroundUpdate,
      fetcher: async () => {
        try {
          const res = await fetch(`${API_BASE}/api/roadmaps/${slug}`, {
            credentials: "include",
            headers: { Accept: "application/json" },
          });
          if (res.ok) {
            const json = await res.json();
            if (json?.data) return json.data;
          }
        } catch (err) {
          console.warn(`Detail fetch failed for ${slug}, checking static data:`, err.message);
        }
        return getRoadmapBySlug(slug);
      },
    });
  }

  /**
   * Prefetch roadmap details during idle browser time
   */
  prefetchRoadmap(slug) {
    if (!slug || typeof window === "undefined") return;
    const idleCallback = window.requestIdleCallback || ((cb) => setTimeout(cb, 200));

    idleCallback(() => {
      this.fetchDetailBySlug(slug).catch(() => {});
    });
  }

  /**
   * Explicitly enroll authenticated user in a roadmap track
   */
  async enroll(slug) {
    if (!slug) return null;
    try {
      const res = await apiClient.post(`/api/roadmaps/${slug}/enroll`, {});
      return res?.data || res;
    } catch (err) {
      console.warn("Roadmap enrollment failed:", err.message);
      return null;
    }
  }

  /**
   * Fetch authenticated user progress for a roadmap
   */
  async fetchProgress(slug) {
    if (!slug) return null;
    try {
      const res = await apiClient.get(`/api/roadmaps/${slug}/progress`);
      return res?.data || res;
    } catch {
      return null;
    }
  }

  /**
   * Toggle topic completion on backend
   */
  async toggleTopic(slug, topicId, totalTopicsCount) {
    if (!slug || !topicId) return null;
    try {
      const res = await apiClient.post(`/api/roadmaps/${slug}/progress/toggle`, {
        topicId,
        totalTopicsCount,
      });
      return res?.data || res;
    } catch (err) {
      console.warn("Toggle topic failed:", err.message);
      return null;
    }
  }
}

export const roadmapsService = new RoadmapsClientService();

