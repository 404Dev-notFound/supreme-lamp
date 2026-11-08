/**
 * Client-Side-First DSA Service
 * 
 * Provides:
 * - Multi-layer caching for 24 languages & algorithms
 * - In-memory SearchTrie for O(L) client-side algorithm prefix search
 * - Instant filtering without repeated server roundtrips
 */

import { clientCache, CACHE_STRATEGIES, DEFAULT_TTLS } from "@/lib/storage/clientCacheManager";
import { apiClient } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
import { STORES } from "@/lib/storage/indexedDbStorage";
import { SearchTrie } from "@/lib/storage/inMemoryCache";

class DsaClientService {
  constructor() {
    this.searchTrie = new SearchTrie();
    this.isTrieIndexed = false;
  }

  /**
   * Fetch all 24 supported languages with SWR caching
   */
  async fetchLanguages({ onBackgroundUpdate } = {}) {
        return clientCache.execute({
      url: `${API_BASE}/api/dsa/languages`,
      cacheKey: "dsa:languages",
      storeName: STORES.DSA,
      strategy: CACHE_STRATEGIES.SWR,
      ttlMs: DEFAULT_TTLS.DSA_CATALOG,
      onBackgroundUpdate,
      fetcher: async () => {
        const res = await fetch(`${API_BASE}/api/dsa/languages`);
        if (!res.ok) throw new Error("Failed to load DSA languages");
        const json = await res.json();
        return json.data || [];
      },
    });
  }

  /**
   * Fetch algorithms catalog (optionally filtered by language)
   */
  async fetchAlgorithms({ language = "all", onBackgroundUpdate } = {}) {
        const key = `dsa:algos:${language}`;
    const params = language && language !== "all" ? { language } : {};

    const algos = await clientCache.execute({
      url: `${API_BASE}/api/dsa`,
      params,
      cacheKey: key,
      storeName: STORES.DSA,
      strategy: CACHE_STRATEGIES.SWR,
      ttlMs: DEFAULT_TTLS.DSA_CATALOG,
      onBackgroundUpdate: (fresh) => {
        this._indexAlgorithmsIntoTrie(fresh);
        if (typeof onBackgroundUpdate === "function") onBackgroundUpdate(fresh);
      },
      fetcher: async () => {
        const queryStr = language && language !== "all" ? `?language=${encodeURIComponent(language)}` : "";
        const res = await fetch(`${API_BASE}/api/dsa${queryStr}`);
        if (!res.ok) throw new Error("Failed to load DSA algorithms");
        const json = await res.json();
        return json.data || [];
      },
    });

    if (Array.isArray(algos) && !this.isTrieIndexed) {
      this._indexAlgorithmsIntoTrie(algos);
    }

    return algos;
  }

  /**
   * Index algorithms into client-side SearchTrie for instant O(L) autocomplete
   */
  _indexAlgorithmsIntoTrie(algorithms = []) {
    if (!Array.isArray(algorithms) || algorithms.length === 0) return;
    this.searchTrie.clear();

    algorithms.forEach((algo) => {
      this.searchTrie.insertItem(algo.id, algo, [
        algo.title,
        algo.category,
        algo.difficulty,
        ...(algo.languagesSupported || []),
      ]);
    });
    this.isTrieIndexed = true;
  }

  /**
   * Instant client-side prefix search via Trie
   */
  searchAlgorithms(prefix, limit = 20) {
    if (!this.isTrieIndexed || !prefix) return [];
    return this.searchTrie.searchPrefix(prefix, limit);
  }

  /**
   * Fetch authenticated user's solved DSA problems from database
   */
  async fetchMyProgress() {
    try {
      const res = await apiClient.get("/api/dsa/progress/my");
      return res?.data || { solvedSlugs: [], count: 0 };
    } catch {
      return { solvedSlugs: [], count: 0 };
    }
  }

  /**
   * Toggle solve status in database
   */
  async toggleSolve(slug, language = "all") {
    if (!slug) return null;
    try {
      const res = await apiClient.post(`/api/dsa/${slug}/solve`, { language });
      return res?.data || res;
    } catch (err) {
      console.warn("Toggle solve failed:", err.message);
      return null;
    }
  }
}

export const dsaService = new DsaClientService();

