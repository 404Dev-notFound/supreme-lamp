/**
 * High-Performance In-Memory Caching and Algorithmic Structures
 * 
 * 1. LRUCache: Doubly-Linked List + Hash Map providing O(1) get, put, and eviction.
 * 2. InFlightRequestPool: Request deduplication pool sharing active promises.
 * 3. SearchTrie: Prefix tree for O(L) client-side search indexing.
 */

// ==========================================
// 1. LRU CACHE (Doubly-Linked List + Hash Map)
// ==========================================

class LRUNode {
  constructor(key, value, expiresAt = null) {
    this.key = key;
    this.value = value;
    this.expiresAt = expiresAt;
    this.prev = null;
    this.next = null;
  }
}

export class LRUCache {
  /**
   * @param {number} capacity Maximum number of entries
   * @param {number} defaultTtlMs Default Time-To-Live in milliseconds (default: 5 mins)
   */
  constructor(optionsOrCapacity = 150, defaultTtlMs = 5 * 60 * 1000) {
    if (typeof optionsOrCapacity === "object" && optionsOrCapacity !== null) {
      this.capacity = optionsOrCapacity.capacity || 150;
      this.defaultTtlMs = optionsOrCapacity.defaultTtlMs || 5 * 60 * 1000;
    } else {
      this.capacity = optionsOrCapacity;
      this.defaultTtlMs = defaultTtlMs;
    }
    this.map = new Map();
    this.head = new LRUNode(null, null);
    this.tail = new LRUNode(null, null);
    this.head.next = this.tail;
    this.tail.prev = this.head;

    // Metrics tracking
    this.hits = 0;
    this.misses = 0;
  }

  _remove(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }

  _addToHead(node) {
    node.next = this.head.next;
    node.next.prev = node;
    node.prev = this.head;
    this.head.next = node;
  }

  _moveToHead(node) {
    this._remove(node);
    this._addToHead(node);
  }

  _isExpired(node) {
    return node.expiresAt !== null && Date.now() > node.expiresAt;
  }

  /**
   * Get value from cache in O(1)
   */
  get(key) {
    const node = this.map.get(key);
    if (!node) {
      this.misses++;
      return null;
    }

    if (this._isExpired(node)) {
      this.delete(key);
      this.misses++;
      return null;
    }

    this._moveToHead(node);
    this.hits++;
    return node.value;
  }

  /**
   * Put value in cache in O(1)
   */
  set(key, value, ttlMs = this.defaultTtlMs) {
    const expiresAt = ttlMs ? Date.now() + ttlMs : null;

    if (this.map.has(key)) {
      const node = this.map.get(key);
      node.value = value;
      node.expiresAt = expiresAt;
      this._moveToHead(node);
      return;
    }

    if (this.map.size >= this.capacity) {
      // Evict least recently used (tail.prev)
      const lru = this.tail.prev;
      if (lru !== this.head) {
        this.delete(lru.key);
      }
    }

    const newNode = new LRUNode(key, value, expiresAt);
    this.map.set(key, newNode);
    this._addToHead(newNode);
  }

  has(key) {
    const node = this.map.get(key);
    if (!node) return false;
    if (this._isExpired(node)) {
      this.delete(key);
      return false;
    }
    return true;
  }

  delete(key) {
    const node = this.map.get(key);
    if (!node) return false;
    this._remove(node);
    this.map.delete(key);
    return true;
  }

  clear() {
    this.map.clear();
    this.head.next = this.tail;
    this.tail.prev = this.head;
    this.hits = 0;
    this.misses = 0;
  }

  getMetrics() {
    const total = this.hits + this.misses;
    return {
      size: this.map.size,
      capacity: this.capacity,
      hits: this.hits,
      misses: this.misses,
      hitRatio: total > 0 ? (this.hits / total).toFixed(4) : "0.0000",
    };
  }
}

// ==========================================
// 2. IN-FLIGHT REQUEST DEDUPLICATION POOL
// ==========================================

export class InFlightRequestPool {
  constructor() {
    this.flightMap = new Map();
  }

  /**
   * Execute an async action or attach to an existing in-flight promise for the same key.
   * Prevents concurrent duplicate network requests.
   * 
   * @param {string} key Unique request key
   * @param {() => Promise<any>} fetcher Async function producing the result
   */
  async dedupe(key, fetcher) {
    if (this.flightMap.has(key)) {
      return this.flightMap.get(key);
    }

    const promise = fetcher().finally(() => {
      this.flightMap.delete(key);
    });

    this.flightMap.set(key, promise);
    return promise;
  }

  hasActive(key) {
    return this.flightMap.has(key);
  }
}

// ==========================================
// 3. SEARCH TRIE (Prefix Indexing)
// ==========================================

class TrieNode {
  constructor() {
    this.children = new Map();
    this.isEndOfWord = false;
    this.itemRefs = new Set(); // Stores references/IDs to matching items
  }
}

export class SearchTrie {
  constructor() {
    this.root = new TrieNode();
    this.itemStore = new Map(); // id -> item
  }

  /**
   * Insert item with text tokens into Trie
   * Time Complexity: O(W * L) where W is words count, L is average word length
   */
  insertItem(id, item, textFields = []) {
    this.itemStore.set(id, item);

    const tokens = new Set();
    textFields.forEach((field) => {
      if (!field || typeof field !== "string") return;
      const words = field
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, " ")
        .split(/\s+/);
      words.forEach((w) => {
        if (w.length >= 2) tokens.add(w);
      });
    });

    tokens.forEach((token) => {
      let current = this.root;
      for (let i = 0; i < token.length; i++) {
        const char = token[i];
        if (!current.children.has(char)) {
          current.children.set(char, new TrieNode());
        }
        current = current.children.get(char);
        current.itemRefs.add(id);
      }
      current.isEndOfWord = true;
    });
  }

  /**
   * Search matching items by prefix
   * Time Complexity: O(P + R) where P is prefix length, R is number of matches
   */
  searchPrefix(prefix, limit = 20) {
    if (!prefix || typeof prefix !== "string") return [];
    const cleanPrefix = prefix.toLowerCase().trim();
    if (cleanPrefix.length < 2) return [];

    let current = this.root;
    for (let i = 0; i < cleanPrefix.length; i++) {
      const char = cleanPrefix[i];
      if (!current.children.has(char)) {
        return [];
      }
      current = current.children.get(char);
    }

    const results = [];
    for (const id of current.itemRefs) {
      if (results.length >= limit) break;
      const item = this.itemStore.get(id);
      if (item) results.push(item);
    }
    return results;
  }

  clear() {
    this.root = new TrieNode();
    this.itemStore.clear();
  }
}

// Global Singleton instances for memory layer
export const memoryCache = new LRUCache(250, 5 * 60 * 1000); // 250 items, 5 min TTL
export const inFlightPool = new InFlightRequestPool();
