/**
 * Centralized FlowCTRL Redis Production Infrastructure Package
 * Unifies Connection, Cache-Aside, BullMQ Queues, Rate Limiting, and Telemetry
 */

const {
  redisClient,
  getPrimaryClient,
  initRedisClient,
  createDedicatedClient,
  isRedisAvailable,
  pingRedis,
  getRedisInfo,
  closeRedisConnections,
} = require("./client");

const {
  REDIS_CONFIG,
  buildKey,
} = require("./config");

const {
  get,
  set,
  del,
  delPattern,
  getOrSet,
  increment,
  ttl,
  flushCache,
  memoryStore,
} = require("./cache");

const {
  QUEUE_NAMES,
  DEFAULT_JOB_OPTIONS,
  getQueue,
  registerWorker,
  dispatchJob,
  closeQueuesAndWorkers,
  jobDispatchers,
  registeredProcessors,
} = require("./queues");

const {
  redisMetrics,
  RedisMetricsTracker,
} = require("./metrics");

/**
 * High-level diagnostic report for /api/health and monitoring dashboards
 */
async function getRedisHealthReport() {
  const ping = await pingRedis();
  const info = await getRedisInfo();
  const metrics = redisMetrics.getStats();

  return {
    status: ping.available ? "connected" : "degraded",
    available: ping.available,
    degraded: !ping.available,
    mode: ping.available ? "distributed_redis" : "resilient_fallback",
    latencyMs: ping.latencyMs,
    clientStatus: ping.status,
    server: info
      ? {
          version: info.version,
          mode: info.mode,
          usedMemory: info.usedMemoryHuman,
          usedMemoryPeak: info.usedMemoryPeakHuman,
          connectedClients: info.connectedClients,
          totalCommands: info.totalCommandsProcessed,
        }
      : null,
    cacheMetrics: metrics,
    memoryFallbackEntries: memoryStore.size(),
  };
}

module.exports = {
  // Connection & Lifecycle
  redisClient,
  getPrimaryClient,
  initRedisClient,
  createDedicatedClient,
  isRedisAvailable,
  pingRedis,
  getRedisInfo,
  closeRedisConnections,
  getRedisHealthReport,

  // Configuration & Keys
  REDIS_CONFIG,
  buildKey,

  // Cache Engine
  cache: {
    get,
    set,
    del,
    delPattern,
    getOrSet,
    increment,
    ttl,
    flush: flushCache,
    memoryStore,
  },

  // Background Queues
  queues: {
    QUEUE_NAMES,
    DEFAULT_JOB_OPTIONS,
    getQueue,
    registerWorker,
    dispatchJob,
    closeQueuesAndWorkers,
    dispatch: jobDispatchers,
    registeredProcessors,
  },

  // Observability
  metrics: redisMetrics,
  RedisMetricsTracker,
};

