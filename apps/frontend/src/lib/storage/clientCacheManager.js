/**
 * FlowCTRL Unified Client Cache Manager
 * 
 * Multi-tier caching orchestrator coordinating:
 * Layer 1: In-Memory LRU Cache (<1ms)
 * Layer 2: In-Flight Request Deduplication (prevents parallel duplicate fetches)
 * Layer 3: Persistent IndexedDB Storage (~5-15ms)
 * Layer 4: Resilient Network Fetch with ETag & 304 Revalidation
 * 
 * Supports Strategies:
 * - STALE_WHILE_REVALIDATE (SWR): Instant local display + non-blocking background refresh
 * - CACHE_FIRST: Serves local data if unexpired, saves network calls
 * - NETWORK_FIRST: Fresh network data with local offline fallback
 * - NETWORK_ONLY: Direct network without local storage
 */

import { memoryCache, inFlightPool } from "./inMemoryCache";
import { idbStorage, STORES } from "./indexedDbStorage";

export const CACHE_STRATEGIES = {
  SWR: "STALE_WHILE_REVALIDATE",
  CACHE_FIRST: "CACHE_FIRST",
  NETWORK_FIRST: "NETWORK_FIRST",
  NETWORK_ONLY: "NETWORK_ONLY",
  CACHE_ONLY: "CACHE_ONLY",
};

// Default TTL configurations per data category (in milliseconds)
export const DEFAULT_TTLS = {
  ROADMAPS_CATALOG: 24 * 60 * 60 * 1000,    // 24 Hours
  ROADMAP_DETAIL: 48 * 60 * 60 * 1000,      // 48 Hours
  DSA_CATALOG: 24 * 60 * 60 * 1000,         // 24 Hours
  DSA_DETAIL: 48 * 60 * 60 * 1000,          // 48 Hours
  PROJECTS_CATALOG: 12 * 60 * 60 * 1000,    // 12 Hours
  PROJECT_DETAIL: 24 * 60 * 60 * 1000,      // 24 Hours
  RESOURCES_CATALOG: 12 * 60 * 60 * 1000,   // 12 Hours
  ANNOUNCEMENTS: 30 * 60 * 1000,            // 30 Minutes
  USER_PROGRESS: 5 * 60 * 1000,             // 5 Minutes
  STATIC_METADATA: 7 * 24 * 60 * 60 * 1000, // 7 Days
};

class ClientCacheManager {
  constructor() {
    this.memory = memoryCache;
    this.idb = idbStorage;
    this.flightPool = inFlightPool;

    // Global performance telemetry counters
    this.telemetry = {
      memoryHits: 0,
      idbHits: 0,
      networkHits: 0,
      notModified304: 0,
      dedupedRequests: 0,
    };

    // Cross-tab synchronization via BroadcastChannel
    this.broadcastChannel =
      typeof window !== "undefined" && "BroadcastChannel" in window
        ? new BroadcastChannel("flowctrl_cache_sync")
        : null;

    if (this.broadcastChannel) {
      this.broadcastChannel.onmessage = (event) => {
        try {
          const { type, key, storeName, data } = event.data || {};
          if (type === "invalidate" && key) {
            this.memory.delete(key);
          } else if (type === "update" && key && data) {
            this.memory.set(key, data);
            window.dispatchEvent(
              new CustomEvent(`flowctrl:cache-updated:${key}`, { detail: data })
            );
          } else if (type === "clear_user") {
            this.memory.clear();
          }
        } catch {}
      };
    }
  }

  /**
   * Helper to generate a deterministic cache key from URL and parameters
   */
  buildCacheKey(url, params = {}) {
    if (!params || Object.keys(params).length === 0) return url;
    const sorted = Object.keys(params)
      .sort()
      .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== "")
      .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
      .join("&");
    return sorted ? `${url}?${sorted}` : url;
  }

  /**
   * Primary intelligent data fetcher with multi-tier storage
   */
  async execute({
    url,
    params = {},
    cacheKey = null,
    storeName = STORES.API_CACHE,
    strategy = CACHE_STRATEGIES.SWR,
    ttlMs = DEFAULT_TTLS.ROADMAPS_CATALOG,
    fetcher = null,
    onBackgroundUpdate = null,
  }) {
    const key = cacheKey || this.buildCacheKey(url, params);

    // ==========================================
    // Strategy: NETWORK_ONLY (with concurrent request deduplication)
    // ==========================================
    if (strategy === CACHE_STRATEGIES.NETWORK_ONLY) {
      return this.flightPool.dedupe(key, async () => {
        return this._performNetworkFetch(url, params, key, storeName, ttlMs, fetcher);
      });
    }

    // ==========================================
    // Check Layer 1: In-Memory LRU Cache
    // ==========================================
    const memoryRecord = this.memory.get(key);
    const isMemoryEmptyArray = memoryRecord && Array.isArray(memoryRecord.data) && memoryRecord.data.length === 0;
    if (memoryRecord && !isMemoryEmptyArray) {
      this.telemetry.memoryHits++;

      // If SWR and stale, trigger non-blocking background revalidation
      if (
        strategy === CACHE_STRATEGIES.SWR &&
        Date.now() > (memoryRecord.expiresAt || 0)
      ) {
        this._revalidateInBackground(url, params, key, storeName, ttlMs, fetcher, memoryRecord.etag, onBackgroundUpdate);
      }

      return memoryRecord.data;
    }

    // ==========================================
    // Check Layer 2: Persistent IndexedDB
    // ==========================================
    let idbRecord = null;
    try {
      idbRecord = await this.idb.get(storeName, key);
    } catch (e) {
      console.warn("IDB read error:", e);
    }

    const isIdbEmptyArray = idbRecord && Array.isArray(idbRecord.data) && idbRecord.data.length === 0;
    if (idbRecord && idbRecord.data && !isIdbEmptyArray) {
      this.telemetry.idbHits++;

      // Warm in-memory cache
      this.memory.set(key, idbRecord, Math.min(ttlMs, 10 * 60 * 1000));

      const isStale = Date.now() > (idbRecord.expiresAt || 0);

      // If CACHE_FIRST and unexpired, return immediately
      if (strategy === CACHE_STRATEGIES.CACHE_FIRST && !isStale) {
        return idbRecord.data;
      }

      // If SWR, return local data instantly and revalidate in background if stale
      if (strategy === CACHE_STRATEGIES.SWR) {
        if (isStale) {
          this._revalidateInBackground(url, params, key, storeName, ttlMs, fetcher, idbRecord.etag, onBackgroundUpdate);
        }
        return idbRecord.data;
      }
    }

    // ==========================================
    // Strategy: CACHE_ONLY
    // ==========================================
    if (strategy === CACHE_STRATEGIES.CACHE_ONLY) {
      return idbRecord?.data || null;
    }

    // ==========================================
    // Layer 3: Network Fetch with In-Flight Deduplication
    // ==========================================
    return this.flightPool.dedupe(key, async () => {
      return this._performNetworkFetch(url, params, key, storeName, ttlMs, fetcher, idbRecord?.etag);
    });
  }

  /**
   * Internal network fetch with ETag support and multi-layer storage persistence
   */
  async _performNetworkFetch(url, params, key, storeName, ttlMs, customFetcher, etag = null) {
    this.telemetry.networkHits++;

    try {
      let rawData;
      let newEtag = null;

      if (customFetcher) {
        rawData = await customFetcher();
      } else {
        const fullUrl = this.buildCacheKey(url, params);
        const headers = {
          "Accept": "application/json",
        };
        if (etag) {
          headers["If-None-Match"] = etag;
        }

        const res = await fetch(fullUrl, {
          method: "GET",
          headers,
          credentials: "include",
        });

        // 304 Not Modified handling
        if (res.status === 304 && etag) {
          this.telemetry.notModified304++;
          // Refresh TTL on existing cache record
          const existing = (await this.idb.get(storeName, key)) || this.memory.get(key);
          if (existing) {
            existing.expiresAt = Date.now() + ttlMs;
            existing.timestamp = Date.now();
            await this.idb.set(storeName, existing);
            this.memory.set(key, existing, Math.min(ttlMs, 10 * 60 * 1000));
            return existing.data;
          }
        }

        if (!res.ok) {
          throw new Error(`Network response error: ${res.status} ${res.statusText}`);
        }

        newEtag = res.headers.get("etag") || null;
        rawData = await res.json();
      }

      // Extract payload (handles standard { success, data } envelopes, preserving pagination if present)
      const data = (rawData?.data !== undefined && !rawData.pagination) ? rawData.data : rawData;

      // Persist to Layer 1 (In-Memory) & Layer 2 (IndexedDB)
      const cacheRecord = {
        cacheKey: key,
        key: key,
        slug: key,
        id: key,
        url,
        data,
        etag: newEtag,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttlMs,
      };

      this.memory.set(key, cacheRecord, Math.min(ttlMs, 10 * 60 * 1000));
      await this.idb.set(storeName, cacheRecord);

      return data;
    } catch (err) {
      console.warn(`Network fetch failed for ${key}, checking fallback:`, err.message);
      // Resilient fallback: return stale local data if network failed (offline resiliency)
      const fallbackRecord = this.memory.get(key) || (await this.idb.get(storeName, key));
      if (fallbackRecord?.data) {
        return fallbackRecord.data;
      }
      throw err;
    }
  }

  /**
   * Non-blocking background revalidation for SWR pattern
   */
  _revalidateInBackground(url, params, key, storeName, ttlMs, customFetcher, etag, onBackgroundUpdate) {
    // Avoid revalidating if already in-flight
    if (this.flightPool.hasActive(key)) return;

    this.flightPool.dedupe(key, async () => {
      try {
        const freshData = await this._performNetworkFetch(url, params, key, storeName, ttlMs, customFetcher, etag);
        if (freshData && typeof onBackgroundUpdate === "function") {
          onBackgroundUpdate(freshData);
        }
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent(`flowctrl:cache-updated:${key}`, { detail: freshData })
          );
        }
      } catch (err) {
        // Silently preserve stale cache on background network fail
      }
    });
  }

  /**
   * Invalidate specific cache key across memory and IndexedDB
   */
  async invalidate(key, storeName = STORES.API_CACHE) {
    this.memory.delete(key);
    await this.idb.delete(storeName, key);
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type: "invalidate", key, storeName });
    }
  }

  /**
   * Clear all user-specific data on logout or account switch
   */
  async clearUserNamespace(userId) {
    if (!userId) return;
    this.memory.clear();
    await this.idb.clear(STORES.USER_PROGRESS);
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type: "clear_user", userId });
    }
  }

  /**
   * Retrieve performance & hit-ratio telemetry
   */
  getTelemetry() {
    const memMetrics = this.memory.getMetrics();
    const totalLocalHits = this.telemetry.memoryHits + this.telemetry.idbHits;
    const totalRequests = totalLocalHits + this.telemetry.networkHits;
    const clientHitRatio =
      totalRequests > 0 ? ((totalLocalHits / totalRequests) * 100).toFixed(2) : "0.00";

    return {
      memoryHits: this.telemetry.memoryHits,
      idbHits: this.telemetry.idbHits,
      networkHits: this.telemetry.networkHits,
      notModified304: this.telemetry.notModified304,
      totalRequests,
      clientHitRatio: `${clientHitRatio}%`,
      memoryCacheSize: memMetrics.size,
    };
  }
}

export const clientCache = new ClientCacheManager();

if (typeof window !== "undefined") {
  window.__FLOWCTRL_STORAGE__ = {
    clientCache,
    idbStorage,
    memoryCache,
    inFlightPool,
    CACHE_STRATEGIES,
    DEFAULT_TTLS,
    STORES,
  };
}

