/**
 * Centralized Redis Configuration & Key Naming Conventions
 * FlowCTRL Production Infrastructure Layer
 */

const REDIS_CONFIG = {
  // Primary connection parameters (Cache, Sessions, Rate Limiting)
  url: process.env.REDIS_URL || null,
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || "0", 10),
  tls: process.env.REDIS_TLS === "true" ? {} : undefined,
  keyPrefix: process.env.REDIS_KEY_PREFIX || "fc:",

  // Dedicated Queue Redis instance parameters (for BullMQ background processing isolation)
  // When running separated instances, queue connects to redis-queue:6379 with noeviction policy
  queue: {
    url: process.env.REDIS_QUEUE_URL || process.env.REDIS_URL || null,
    host: process.env.REDIS_QUEUE_HOST || process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_QUEUE_PORT || (process.env.REDIS_QUEUE_URL ? "6379" : process.env.REDIS_PORT || "6379"), 10),
    password: process.env.REDIS_QUEUE_PASSWORD || process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_QUEUE_DB || "0", 10),
  },

  // Connection timeouts & retries
  connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT_MS || "5000", 10),
  commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT_MS || "3000", 10),
  maxRetriesPerRequest: 2,
  enableReadyCheck: true,
  lazyConnect: true,

  // Retry strategy parameters
  retry: {
    initialDelayMs: 200,
    maxDelayMs: 3000,
    maxAttempts: 5,
  },

  // Standard TTL Presets (in seconds)
  ttl: {
    STATIC_METADATA: 86400, // 24 hours - static schemas, taxonomies
    ROADMAP_CATALOG: 3600,  // 1 hour - public roadmap catalog
    ROADMAP_DETAIL: 3600,   // 1 hour - roadmap graph structure & topics
    PREMIUM_CATALOG: 3600,  // 1 hour - premium curriculum catalog
    PREMIUM_DETAIL: 1800,   // 30 minutes - premium resource detail & modules
    DASHBOARD_STATS: 60,    // 1 minute - mission control aggregated metrics
    JOBS_LIST: 300,         // 5 minutes - job search listings & filters
    JOB_DETAIL: 600,        // 10 minutes - single job posting detail
    CATALOG_SKILLS: 3600,   // 1 hour - skill taxonomy & categories
    SESSION_CACHE: 300,     // 5 minutes - hot session validation cache
    RAG_QUERY: 1800,        // 30 minutes - AI RAG answers & recommendations
    RAG_USER_DATA: 600,     // 10 minutes - user personalized RAG profile
    RATE_LIMIT_DEFAULT: 900 // 15 minutes - standard rate limiting window
  },

  // Namespaces for clean key isolation
  namespaces: {
    ROADMAPS: "roadmaps",
    PREMIUM: "premium",
    JOBS: "jobs",
    STATS: "stats",
    SESSION: "session",
    REVOKED: "revoked",
    RATE_LIMIT: "rl",
    RAG: "rag",
    CATALOG: "catalog",
    QUEUE: "queue",
    LOCK: "lock",
    INV: "inv",
    GEN: "gen",
  },
};

/**
 * Generate a standardized, namespaced Redis key
 * Format: fc:<namespace>:<entity>:<identifier>
 */
function buildKey(namespace, entity, identifier = "") {
  const parts = [REDIS_CONFIG.keyPrefix.replace(/:$/, ""), namespace, entity];
  if (identifier) {
    parts.push(String(identifier));
  }
  return parts.filter(Boolean).join(":");
}

module.exports = {
  REDIS_CONFIG,
  buildKey,
};
