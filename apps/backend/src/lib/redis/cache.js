/**
 * Resilient Cache-Aside Engine with Single-Flight Stampede Protection
 * and Invalidation-Aware Race Condition Prevention
 * FlowCTRL Production Infrastructure Layer
 */

const { getPrimaryClient, isRedisAvailable } = require("./client");
const { redisMetrics } = require("./metrics");
const { REDIS_CONFIG } = require("./config");

// Single-flight in-flight promise registry to eliminate cache stampedes / thundering herds
const inflightPromises = new Map();

/**
 * High-speed in-memory fallback store with TTL expiration and invalidation tracking
 */
class MemoryFallbackStore {
  constructor(maxEntries = 5000) {
    this.store = new Map();
    this.invalidationTimestamps = new Map();
    this.patternInvalidationTimestamps = new Map();
    this.maxEntries = maxEntries;

    // Periodic sweep of expired items and old invalidation markers every 2 minutes
    this.sweepInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, item] of this.store.entries()) {
        if (item.expiresAt && item.expiresAt <= now) {
          this.store.delete(key);
        }
      }
      for (const [key, timestamp] of this.invalidationTimestamps.entries()) {
        if (now - timestamp > 60000) {
          this.invalidationTimestamps.delete(key);
        }
      }
      for (const [pat, timestamp] of this.patternInvalidationTimestamps.entries()) {
        if (now - timestamp > 60000) {
          this.patternInvalidationTimestamps.delete(pat);
        }
      }
    }, 2 * 60 * 1000);

    if (this.sweepInterval.unref) {
      this.sweepInterval.unref();
    }
  }

  get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && item.expiresAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  set(key, value, ttlSeconds) {
    if (this.store.size >= this.maxEntries) {
      // LRU-like eviction: delete oldest entry
      const firstKey = this.store.keys().next().value;
      if (firstKey) this.store.delete(firstKey);
    }
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.store.set(key, { value, expiresAt });
  }

  del(key) {
    return this.store.delete(key);
  }

  delPattern(pattern) {
    // Convert Redis glob pattern to RegExp
    const regexPattern = new RegExp(
      "^" + pattern.replace(/[-[\]{}()+?.,\\^$|#\s]/g, "\\$&").replace(/\*/g, ".*") + "$"
    );
    let count = 0;
    for (const key of this.store.keys()) {
      if (regexPattern.test(key)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  recordInvalidation(key, timestamp = Date.now()) {
    this.invalidationTimestamps.set(key, timestamp);
  }

  recordPatternInvalidation(pattern, timestamp = Date.now()) {
    this.patternInvalidationTimestamps.set(pattern, timestamp);
  }

  isInvalidatedSince(key, timestamp) {
    const keyInv = this.invalidationTimestamps.get(key);
    if (keyInv && keyInv >= timestamp) {
      return true;
    }
    for (const [pattern, patInv] of this.patternInvalidationTimestamps.entries()) {
      if (patInv >= timestamp) {
        const regex = new RegExp(
          "^" + pattern.replace(/[-[\]{}()+?.,\\^$|#\s]/g, "\\$&").replace(/\*/g, ".*") + "$"
        );
        if (regex.test(key)) {
          return true;
        }
      }
    }
    return false;
  }

  clear() {
    this.store.clear();
    this.invalidationTimestamps.clear();
    this.patternInvalidationTimestamps.clear();
  }

  size() {
    return this.store.size;
  }
}

const memoryStore = new MemoryFallbackStore();

/**
 * Standard invalidation marker key generator
 */
function getInvalidationKey(key) {
  return `${REDIS_CONFIG.keyPrefix}${REDIS_CONFIG.namespaces.INV}:${key}`;
}

/**
 * Check if a key was invalidated since a given timestamp
 */
async function isInvalidatedSince(key, timestamp) {
  if (memoryStore.isInvalidatedSince(key, timestamp)) {
    return true;
  }

  if (isRedisAvailable()) {
    try {
      const client = getPrimaryClient();
      const invKey = getInvalidationKey(key);
      const invTime = await client.get(invKey);
      if (invTime && parseInt(invTime, 10) >= timestamp) {
        return true;
      }
    } catch {
      // Degrade to memory check
    }
  }

  return false;
}

/**
 * Serialize a JavaScript value to a JSON string safe for Redis
 */
function serialize(val) {
  if (val === undefined) return null;
  return JSON.stringify(val);
}

/**
 * Deserialize a JSON string from Redis back to JavaScript value
 */
function deserialize(str) {
  if (str === null || str === undefined) return null;
  try {
    return JSON.parse(str);
  } catch {
    return str; // Return raw string if not JSON
  }
}

/**
 * Retrieve a cached item by key
 */
async function get(key) {
  if (!key) return null;

  if (isRedisAvailable()) {
    try {
      const client = getPrimaryClient();
      const raw = await client.get(key);
      if (raw !== null) {
        redisMetrics.recordHit();
        return deserialize(raw);
      }
      redisMetrics.recordMiss();
      return null;
    } catch (err) {
      redisMetrics.recordError();
      redisMetrics.recordFallback();
    }
  }

  // Fallback to in-memory store
  const val = memoryStore.get(key);
  if (val !== null && val !== undefined) {
    redisMetrics.recordHit();
    return val;
  }
  redisMetrics.recordMiss();
  return null;
}

/**
 * Store an item in cache with explicit TTL in seconds
 */
async function set(key, value, ttlSeconds = REDIS_CONFIG.ttl.ROADMAP_CATALOG) {
  if (!key || value === undefined) return false;

  const serialized = serialize(value);
  const ttl = Math.max(1, parseInt(ttlSeconds, 10) || 60);

  // Always update memory store for consistent fast fallback
  memoryStore.set(key, value, ttl);

  if (isRedisAvailable()) {
    try {
      const client = getPrimaryClient();
      await client.set(key, serialized, "EX", ttl);
      redisMetrics.recordSet();
      return true;
    } catch (err) {
      redisMetrics.recordError();
      redisMetrics.recordFallback();
    }
  }

  redisMetrics.recordSet();
  return true;
}

/**
 * Delete a specific key from cache with invalidation tombstone tracking
 */
async function del(key) {
  if (!key) return false;

  const now = Date.now();
  memoryStore.del(key);
  memoryStore.recordInvalidation(key, now);

  if (isRedisAvailable()) {
    try {
      const client = getPrimaryClient();
      const invKey = getInvalidationKey(key);
      const pipeline = client.pipeline();
      pipeline.del(key);
      pipeline.set(invKey, String(now), "EX", 60);
      await pipeline.exec();
      redisMetrics.recordDelete();
      return true;
    } catch (err) {
      redisMetrics.recordError();
    }
  }

  redisMetrics.recordDelete();
  return true;
}

/**
 * Non-blocking pattern-based key deletion using Redis SCAN
 * Prevents dangerous blocking KEYS * in production, records invalidation markers
 */
async function delPattern(pattern) {
  if (!pattern) return 0;

  const now = Date.now();
  memoryStore.recordPatternInvalidation(pattern, now);
  let totalDeleted = memoryStore.delPattern(pattern);

  if (isRedisAvailable()) {
    try {
      const client = getPrimaryClient();
      let cursor = "0";
      let matchedKeys = [];

      do {
        const [nextCursor, keys] = await client.scan(cursor, "MATCH", pattern, "COUNT", 100);
        cursor = nextCursor;
        if (keys && keys.length > 0) {
          matchedKeys.push(...keys);
        }
      } while (cursor !== "0");

      if (matchedKeys.length > 0) {
        // Unlink or del in batches of 100 with invalidation markers
        for (let i = 0; i < matchedKeys.length; i += 100) {
          const chunk = matchedKeys.slice(i, i + 100);
          const pipeline = client.pipeline();
          pipeline.del(...chunk);
          for (const k of chunk) {
            pipeline.set(getInvalidationKey(k), String(now), "EX", 60);
          }
          await pipeline.exec();
        }
        totalDeleted = Math.max(totalDeleted, matchedKeys.length);
        redisMetrics.recordDelete();
      }
    } catch (err) {
      redisMetrics.recordError();
    }
  }

  return totalDeleted;
}

/**
 * Cache-aside with single-flight mutex protection against cache stampedes
 * AND timestamp-based race condition prevention (Request A read stale DB vs Request B update)
 *
 * @param {string} key - Cache key
 * @param {Function} fetcher - Async function returning fresh data from PostgreSQL/API
 * @param {number} ttlSeconds - Cache TTL in seconds
 * @returns {Promise<any>}
 */
async function getOrSet(key, fetcher, ttlSeconds = REDIS_CONFIG.ttl.ROADMAP_CATALOG) {
  if (!key) return fetcher();

  // 1. Try reading from cache first
  const cached = await get(key);
  if (cached !== null && cached !== undefined) {
    return cached;
  }

  // 2. Check if another concurrent request is currently fetching this exact key
  if (inflightPromises.has(key)) {
    return inflightPromises.get(key);
  }

  const fetchStartedAt = Date.now();

  // 3. Execute fetcher under single-flight promise
  const flight = (async () => {
    try {
      const freshData = await fetcher();
      if (freshData !== null && freshData !== undefined) {
        // Prevent stale-write race condition:
        // If an invalidation occurred for this key while the database query was running,
        // do NOT write the stale data to cache.
        const wasInvalidated = await isInvalidatedSince(key, fetchStartedAt);
        if (wasInvalidated) {
          redisMetrics.recordRaceConditionPrevented();
        } else {
          await set(key, freshData, ttlSeconds);
        }
      }
      return freshData;
    } finally {
      // Clean up in-flight promise immediately upon completion
      inflightPromises.delete(key);
    }
  })();

  inflightPromises.set(key, flight);
  return flight;
}

/**
 * Atomic counter increment with TTL
 */
async function increment(key, by = 1, ttlSeconds = 60) {
  if (!key) return 0;

  if (isRedisAvailable()) {
    try {
      const client = getPrimaryClient();
      const val = await client.incrby(key, by);
      if (val === by && ttlSeconds) {
        await client.expire(key, ttlSeconds);
      }
      return val;
    } catch (err) {
      redisMetrics.recordError();
      redisMetrics.recordFallback();
    }
  }

  // Memory fallback
  const current = (memoryStore.get(key) || 0) + by;
  memoryStore.set(key, current, ttlSeconds);
  return current;
}

/**
 * Check TTL remaining on a key in seconds
 */
async function ttl(key) {
  if (!key) return -2;

  if (isRedisAvailable()) {
    try {
      const client = getPrimaryClient();
      return await client.ttl(key);
    } catch {
      // Fall through to memory
    }
  }

  const item = memoryStore.store.get(key);
  if (!item) return -2;
  if (!item.expiresAt) return -1;
  const remMs = item.expiresAt - Date.now();
  return remMs > 0 ? Math.ceil(remMs / 1000) : -2;
}

/**
 * Clear all cache entries (both Redis pattern and memory store)
 */
async function flushCache(prefix = REDIS_CONFIG.keyPrefix) {
  memoryStore.clear();
  return delPattern(`${prefix}*`);
}

module.exports = {
  get,
  set,
  del,
  delPattern,
  getOrSet,
  increment,
  ttl,
  flushCache,
  isInvalidatedSince,
  getInvalidationKey,
  memoryStore,
};
