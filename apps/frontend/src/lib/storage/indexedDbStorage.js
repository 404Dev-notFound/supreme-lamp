/**
 * FlowCTRL Enterprise IndexedDB Storage Layer
 * 
 * Provides resilient, structured client-side persistence for Roadmaps, DSA,
 * Project Tutorials, Curated Resources, Announcements, and SWR API Caching.
 * 
 * Features:
 * - Versioned schema migration
 * - Index-based query support
 * - Storage Quota handling & LRU eviction
 * - Automatic connection management
 * - Transparent SSR & Private Browsing in-memory fallback
 */

const DB_NAME = "flowctrl_client_v1";
const DB_VERSION = 1;

export const STORES = {
  ROADMAPS: "roadmaps",
  DSA: "dsa",
  PROJECT_TUTORIALS: "projectTutorials",
  RESOURCES: "resources",
  ANNOUNCEMENTS: "announcements",
  USER_PROGRESS: "userProgress",
  API_CACHE: "apiCache",
};

class IndexedDbStorage {
  constructor() {
    this.db = null;
    this.isSupported =
      typeof window !== "undefined" && typeof window.indexedDB !== "undefined";
    this.memoryFallback = new Map();
  }

  /**
   * Open or reuse connection to IndexedDB database
   */
  async getDb() {
    if (!this.isSupported) return null;
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = event.target.result;

          // 1. Roadmaps Store
          if (!db.objectStoreNames.contains(STORES.ROADMAPS)) {
            const roadmapsStore = db.createObjectStore(STORES.ROADMAPS, { keyPath: "slug" });
            roadmapsStore.createIndex("category", "category", { unique: false });
            roadmapsStore.createIndex("level", "level", { unique: false });
            roadmapsStore.createIndex("isPremium", "isPremium", { unique: false });
            roadmapsStore.createIndex("updatedAt", "updatedAt", { unique: false });
          }

          // 2. DSA Store
          if (!db.objectStoreNames.contains(STORES.DSA)) {
            const dsaStore = db.createObjectStore(STORES.DSA, { keyPath: "id" });
            dsaStore.createIndex("language", "language", { unique: false });
            dsaStore.createIndex("category", "category", { unique: false });
            dsaStore.createIndex("difficulty", "difficulty", { unique: false });
            dsaStore.createIndex("updatedAt", "updatedAt", { unique: false });
          }

          // 3. Project Tutorials Store
          if (!db.objectStoreNames.contains(STORES.PROJECT_TUTORIALS)) {
            const projectsStore = db.createObjectStore(STORES.PROJECT_TUTORIALS, { keyPath: "slug" });
            projectsStore.createIndex("categorySlug", "categorySlug", { unique: false });
            projectsStore.createIndex("language", "language", { unique: false });
            projectsStore.createIndex("difficulty", "difficulty", { unique: false });
            projectsStore.createIndex("updatedAt", "updatedAt", { unique: false });
          }

          // 4. Resources Store
          if (!db.objectStoreNames.contains(STORES.RESOURCES)) {
            const resourcesStore = db.createObjectStore(STORES.RESOURCES, { keyPath: "slug" });
            resourcesStore.createIndex("categorySlug", "categorySlug", { unique: false });
            resourcesStore.createIndex("level", "level", { unique: false });
            resourcesStore.createIndex("language", "language", { unique: false });
            resourcesStore.createIndex("updatedAt", "updatedAt", { unique: false });
          }

          // 5. Announcements Store
          if (!db.objectStoreNames.contains(STORES.ANNOUNCEMENTS)) {
            const annStore = db.createObjectStore(STORES.ANNOUNCEMENTS, { keyPath: "id" });
            annStore.createIndex("category", "category", { unique: false });
            annStore.createIndex("priority", "priority", { unique: false });
            annStore.createIndex("status", "status", { unique: false });
            annStore.createIndex("dateTime", "dateTime", { unique: false });
          }

          // 6. User Progress Store (local optimistic progress)
          if (!db.objectStoreNames.contains(STORES.USER_PROGRESS)) {
            const progressStore = db.createObjectStore(STORES.USER_PROGRESS, { keyPath: "key" });
            progressStore.createIndex("userId", "userId", { unique: false });
            progressStore.createIndex("type", "type", { unique: false });
            progressStore.createIndex("updatedAt", "updatedAt", { unique: false });
          }

          // 7. General SWR API Response Cache Store
          if (!db.objectStoreNames.contains(STORES.API_CACHE)) {
            const cacheStore = db.createObjectStore(STORES.API_CACHE, { keyPath: "cacheKey" });
            cacheStore.createIndex("url", "url", { unique: false });
            cacheStore.createIndex("expiresAt", "expiresAt", { unique: false });
            cacheStore.createIndex("timestamp", "timestamp", { unique: false });
          }
        };

        request.onsuccess = (event) => {
          this.db = event.target.result;
          resolve(this.db);
        };

        request.onerror = (event) => {
          console.warn("IndexedDB open error, using memory fallback:", event.target.error);
          resolve(null);
        };
      } catch (err) {
        console.warn("IndexedDB initialization exception, using memory fallback:", err);
        resolve(null);
      }
    });
  }

  /**
   * Get single item from store
   */
  async get(storeName, key) {
    if (!key) return null;
    const db = await this.getDb();
    if (!db) {
      return this.memoryFallback.get(`${storeName}:${key}`) || null;
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const req = store.get(key);

        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      } catch (err) {
        console.warn(`IndexedDB get error for ${storeName}:${key}:`, err);
        resolve(null);
      }
    });
  }

  /**
   * Set single item in store
   */
  async set(storeName, value) {
    if (!value) return false;
    const db = await this.getDb();
    if (!db) {
      const key = value.slug || value.id || value.cacheKey || value.key;
      if (key) this.memoryFallback.set(`${storeName}:${key}`, value);
      return true;
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        const req = store.put({
          ...value,
          _cachedAt: Date.now(),
        });

        req.onsuccess = () => resolve(true);
        req.onerror = (event) => {
          // Handle QuotaExceededError
          if (event.target.error?.name === "QuotaExceededError") {
            console.warn("IndexedDB quota exceeded. Evicting old cache entries...");
            this.evictOldest(storeName, 50).then(() => {
              // Retry once
              try {
                const retryTx = db.transaction(storeName, "readwrite");
                retryTx.objectStore(storeName).put(value);
              } catch {}
            });
          }
          resolve(false);
        };
      } catch (err) {
        console.warn(`IndexedDB set error for ${storeName}:`, err);
        resolve(false);
      }
    });
  }

  /**
   * Bulk insert/update items in store in a single atomic transaction
   */
  async setMany(storeName, items = []) {
    if (!items || items.length === 0) return true;
    const db = await this.getDb();
    if (!db) {
      items.forEach((item) => {
        const key = item.slug || item.id || item.cacheKey || item.key;
        if (key) this.memoryFallback.set(`${storeName}:${key}`, item);
      });
      return true;
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        const now = Date.now();

        items.forEach((item) => {
          store.put({
            ...item,
            _cachedAt: now,
          });
        });

        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch (err) {
        console.warn(`IndexedDB setMany error for ${storeName}:`, err);
        resolve(false);
      }
    });
  }

  /**
   * Get all items from store
   */
  async getAll(storeName, limit = 500) {
    const db = await this.getDb();
    if (!db) {
      const results = [];
      const prefix = `${storeName}:`;
      for (const [k, v] of this.memoryFallback.entries()) {
        if (k.startsWith(prefix)) results.push(v);
        if (results.length >= limit) break;
      }
      return results;
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const req = store.getAll(null, limit);

        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      } catch (err) {
        console.warn(`IndexedDB getAll error for ${storeName}:`, err);
        resolve([]);
      }
    });
  }

  /**
   * Delete item by key
   */
  async delete(storeName, key) {
    const db = await this.getDb();
    if (!db) {
      this.memoryFallback.delete(`${storeName}:${key}`);
      return true;
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        const req = store.delete(key);

        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
  }

  /**
   * Clear store
   */
  async clear(storeName) {
    const db = await this.getDb();
    if (!db) {
      const prefix = `${storeName}:`;
      for (const k of this.memoryFallback.keys()) {
        if (k.startsWith(prefix)) this.memoryFallback.delete(k);
      }
      return true;
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        const req = store.clear();

        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
  }

  /**
   * Count total items in store
   */
  async count(storeName) {
    const db = await this.getDb();
    if (!db) {
      let c = 0;
      const prefix = `${storeName}:`;
      for (const k of this.memoryFallback.keys()) {
        if (k.startsWith(prefix)) c++;
      }
      return c;
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(storeName, "readonly");
        const req = tx.objectStore(storeName).count();
        req.onsuccess = () => resolve(req.result || 0);
        req.onerror = () => resolve(0);
      } catch {
        resolve(0);
      }
    });
  }

  /**
   * Evict oldest N records when storage limit approached
   */
  async evictOldest(storeName, countToEvict = 25) {
    const db = await this.getDb();
    if (!db) return;

    try {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      let cursorReq;

      if (store.indexNames.contains("timestamp")) {
        cursorReq = store.index("timestamp").openCursor();
      } else {
        cursorReq = store.openCursor();
      }

      let evicted = 0;
      cursorReq.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor && evicted < countToEvict) {
          cursor.delete();
          evicted++;
          cursor.continue();
        }
      };
    } catch (err) {
      console.warn(`Eviction error in ${storeName}:`, err);
    }
  }

  /**
   * Query estimated storage usage
   */
  async getStorageEstimate() {
    if (typeof navigator !== "undefined" && navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          usageBytes: estimate.usage || 0,
          quotaBytes: estimate.quota || 0,
          usageMb: ((estimate.usage || 0) / (1024 * 1024)).toFixed(2),
          quotaMb: ((estimate.quota || 0) / (1024 * 1024)).toFixed(2),
          percentUsed: estimate.quota ? ((estimate.usage / estimate.quota) * 100).toFixed(2) : 0,
        };
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Get store-by-store counts and storage metrics
   */
  async getDatabaseStats() {
    const stats = {
      stores: {},
      totalRecords: 0,
      estimate: await this.getStorageEstimate(),
    };

    for (const storeName of Object.values(STORES)) {
      try {
        const count = await this.count(storeName);
        stats.stores[storeName] = count;
        stats.totalRecords += count;
      } catch {
        stats.stores[storeName] = 0;
      }
    }

    return stats;
  }
}

export const idbStorage = new IndexedDbStorage();
export const indexedDbStorage = idbStorage;
