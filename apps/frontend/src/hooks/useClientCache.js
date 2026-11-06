"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { clientCache, CACHE_STRATEGIES } from "@/lib/storage/clientCacheManager";

/**
 * React Hook for Client-Side-First SWR Data Fetching
 * 
 * Provides:
 * - Instant local display (<5ms) from Memory / IndexedDB
 * - Non-blocking background revalidation
 * - Loading and error states
 * - In-flight request deduplication
 * - Optimistic local mutations
 */
export function useClientCache({
  url,
  params = {},
  storeName,
  strategy = CACHE_STRATEGIES.SWR,
  ttlMs,
  initialData = null,
  enabled = true,
}) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [error, setError] = useState(null);

  const isMountedRef = useRef(true);
  const cacheKey = clientCache.buildCacheKey(url, params);

  const executeFetch = useCallback(
    async (forceNetwork = false) => {
      if (!enabled || !url) return;

      const activeStrategy = forceNetwork ? CACHE_STRATEGIES.NETWORK_ONLY : strategy;

      try {
        // 1. Check if we already have local data to render immediately
        const cached = await clientCache.execute({
          url,
          params,
          cacheKey,
          storeName,
          strategy: CACHE_STRATEGIES.CACHE_ONLY,
        });

        if (cached && isMountedRef.current) {
          setData(cached);
          setLoading(false);
          setIsRevalidating(true);
        } else if (!data) {
          setLoading(true);
        }

        // 2. Perform strategy fetch (SWR / Cache-First / Network)
        const result = await clientCache.execute({
          url,
          params,
          cacheKey,
          storeName,
          strategy: activeStrategy,
          ttlMs,
          onBackgroundUpdate: (fresh) => {
            if (isMountedRef.current) {
              setData(fresh);
              setIsRevalidating(false);
            }
          },
        });

        if (isMountedRef.current) {
          setData(result);
          setLoading(false);
          setIsRevalidating(false);
          setError(null);
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(err.message || "Failed to load data");
          setLoading(false);
          setIsRevalidating(false);
        }
      }
    },
    [url, JSON.stringify(params), storeName, strategy, ttlMs, enabled, cacheKey]
  );

  useEffect(() => {
    isMountedRef.current = true;
    executeFetch();

    // Listen to background cache update events for this cacheKey
    const handleCacheUpdated = (e) => {
      if (isMountedRef.current && e.detail) {
        setData(e.detail);
        setIsRevalidating(false);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener(`flowctrl:cache-updated:${cacheKey}`, handleCacheUpdated);
    }

    return () => {
      isMountedRef.current = false;
      if (typeof window !== "undefined") {
        window.removeEventListener(`flowctrl:cache-updated:${cacheKey}`, handleCacheUpdated);
      }
    };
  }, [executeFetch, cacheKey]);

  /**
   * Optimistic mutation helper: update local cache immediately and sync to server
   */
  const mutate = useCallback(
    async (newData, shouldRevalidate = true) => {
      setData(newData);
      if (newData) {
        await clientCache.idb.set(storeName, {
          cacheKey,
          key: cacheKey,
          slug: cacheKey,
          data: newData,
          timestamp: Date.now(),
          expiresAt: Date.now() + (ttlMs || 60000),
        });
        clientCache.memory.set(cacheKey, { data: newData, expiresAt: Date.now() + 60000 });
      }
      if (shouldRevalidate) {
        await executeFetch(true);
      }
    },
    [cacheKey, storeName, ttlMs, executeFetch]
  );

  return {
    data,
    loading,
    isRevalidating,
    error,
    mutate,
    refresh: () => executeFetch(true),
  };
}

