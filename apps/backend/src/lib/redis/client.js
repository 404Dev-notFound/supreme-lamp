/**
 * Centralized Redis Client & Connection Lifecycle Manager
 * FlowCTRL Production Infrastructure Layer
 */

const Redis = require("ioredis");
const { REDIS_CONFIG } = require("./config");
const { redisMetrics } = require("./metrics");

let primaryClient = null;
let isConnected = false;
let hasLoggedConnectionWarning = false;

const INSECURE_REDIS_PASSWORDS = [
  "redispassword9555",
  "password",
  "default",
  "123456",
  "admin",
  "root",
];

/**
 * Validate that production environments never execute with missing or default Redis credentials
 */
function validateRedisCredentials() {
  if (process.env.NODE_ENV === "production") {
    let pass = REDIS_CONFIG.password;
    if (!pass && REDIS_CONFIG.url) {
      try {
        pass = new URL(REDIS_CONFIG.url).password;
      } catch {
        // Fall through to pass check
      }
    }

    if (!pass) {
      throw new Error(
        "FATAL SECURITY CONFIGURATION: In production, REDIS_PASSWORD (or password in REDIS_URL) must be set. Running unauthenticated Redis in production is strictly prohibited."
      );
    }
    if (INSECURE_REDIS_PASSWORDS.includes(pass)) {
      throw new Error(
        "FATAL SECURITY CONFIGURATION: In production, REDIS_PASSWORD cannot use an insecure default credential (e.g. 'redispassword9555'). Set a strong cryptographically random secret."
      );
    }
  }
}

/**
 * Build exponential backoff with jitter retry strategy
 */
function createRetryStrategy() {
  return function retryStrategy(times) {
    if (times > REDIS_CONFIG.retry.maxAttempts) {
      if (!hasLoggedConnectionWarning && process.env.NODE_ENV !== "test") {
        console.warn(
          `[Redis] Maximum reconnection attempts (${REDIS_CONFIG.retry.maxAttempts}) reached. Operating in memory-fallback mode.`
        );
        hasLoggedConnectionWarning = true;
      }
      return null; // Stop retrying automatically
    }

    // Exponential backoff with jitter
    const delay = Math.min(
      REDIS_CONFIG.retry.initialDelayMs * Math.pow(2, times - 1) + Math.random() * 200,
      REDIS_CONFIG.retry.maxDelayMs
    );
    return Math.round(delay);
  };
}

/**
 * Instantiate and configure an ioredis client
 */
function buildRedisOptions(customOptions = {}) {
  const baseOptions = {
    lazyConnect: REDIS_CONFIG.lazyConnect,
    maxRetriesPerRequest: REDIS_CONFIG.maxRetriesPerRequest,
    enableReadyCheck: REDIS_CONFIG.enableReadyCheck,
    connectTimeout: REDIS_CONFIG.connectTimeout,
    commandTimeout: REDIS_CONFIG.commandTimeout,
    retryStrategy: createRetryStrategy(),
    reconnectOnError(err) {
      const targetErrors = ["READONLY", "ETIMEDOUT", "ECONNRESET"];
      return targetErrors.some((t) => err.message.includes(t));
    },
    ...customOptions,
  };

  if (REDIS_CONFIG.password) {
    baseOptions.password = REDIS_CONFIG.password;
  }
  if (REDIS_CONFIG.tls) {
    baseOptions.tls = REDIS_CONFIG.tls;
  }
  if (REDIS_CONFIG.db) {
    baseOptions.db = REDIS_CONFIG.db;
  }

  return baseOptions;
}

/**
 * Initialize the primary singleton Redis client
 */
function initRedisClient() {
  if (primaryClient) {
    return primaryClient;
  }

  // Validate credentials in production
  validateRedisCredentials();

  // If no Redis URL or Host is provided and explicitly running in local dev without Redis, return null
  const hasConfig = Boolean(process.env.REDIS_URL || process.env.REDIS_HOST);
  if (!hasConfig && process.env.NODE_ENV === "test") {
    // In test environment without explicit config, avoid connection attempts
    return null;
  }

  try {
    const options = buildRedisOptions();
    const client = REDIS_CONFIG.url
      ? new Redis(REDIS_CONFIG.url, options)
      : new Redis({
          host: REDIS_CONFIG.host,
          port: REDIS_CONFIG.port,
          ...options,
        });

    client.on("connect", () => {
      isConnected = false; // Waiting for "ready"
    });

    client.on("ready", () => {
      isConnected = true;
      hasLoggedConnectionWarning = false;
      console.log(`[Redis] Connected and ready on ${REDIS_CONFIG.host}:${REDIS_CONFIG.port} (db: ${REDIS_CONFIG.db}).`);
    });

    client.on("error", (err) => {
      isConnected = false;
      redisMetrics.recordError();
      if (!hasLoggedConnectionWarning && process.env.NODE_ENV !== "test") {
        console.warn(`[Redis] Connection warning (${err.message}). Safe in-memory fallback is active.`);
        hasLoggedConnectionWarning = true;
      }
    });

    client.on("close", () => {
      isConnected = false;
    });

    client.on("end", () => {
      isConnected = false;
    });

    // Initiate connection asynchronously
    client.connect().catch((err) => {
      isConnected = false;
      if (!hasLoggedConnectionWarning && process.env.NODE_ENV !== "test") {
        console.warn(`[Redis] Initial connection attempt deferred (${err.message}). Operating in fallback mode.`);
        hasLoggedConnectionWarning = true;
      }
    });

    primaryClient = client;
    return client;
  } catch (err) {
    console.warn(`[Redis] Client factory error (${err.message}). Local memory store active.`);
    return null;
  }
}

/**
 * Create a dedicated independent Redis connection (for BullMQ queues, Pub/Sub, or locks)
 * When targeting queues/workers, supports dedicated isolated Redis instances
 */
function createDedicatedClient(label = "worker") {
  const isQueue = label.startsWith("queue:") || label.startsWith("worker:");
  const targetConfig = isQueue && REDIS_CONFIG.queue ? REDIS_CONFIG.queue : REDIS_CONFIG;

  try {
    const options = buildRedisOptions({
      maxRetriesPerRequest: null, // Required by BullMQ
      enableReadyCheck: false,
    });

    if (targetConfig.password) {
      options.password = targetConfig.password;
    }
    if (targetConfig.db !== undefined) {
      options.db = targetConfig.db;
    }

    const client = targetConfig.url
      ? new Redis(targetConfig.url, options)
      : new Redis({
          host: targetConfig.host,
          port: targetConfig.port,
          ...options,
        });

    client.on("error", (err) => {
      if (process.env.NODE_ENV !== "test") {
        console.warn(`[Redis:${label}] Connection error: ${err.message}`);
      }
    });

    return client;
  } catch (err) {
    console.warn(`[Redis:${label}] Could not create dedicated client: ${err.message}`);
    return null;
  }
}

/**
 * Check if Redis is currently connected and ready to process commands
 */
function isRedisAvailable() {
  return Boolean(isConnected && primaryClient && primaryClient.status === "ready");
}

/**
 * Ping Redis and record round-trip latency
 */
async function pingRedis() {
  if (!isRedisAvailable()) {
    return { available: false, latencyMs: null, status: primaryClient?.status || "disconnected" };
  }

  const start = performance.now();
  try {
    const reply = await primaryClient.ping();
    const latencyMs = Math.round((performance.now() - start) * 100) / 100;
    redisMetrics.recordLatency(latencyMs);
    return { available: reply === "PONG", latencyMs, status: primaryClient.status };
  } catch (err) {
    redisMetrics.recordError();
    return { available: false, latencyMs: null, error: err.message, status: primaryClient.status };
  }
}

/**
 * Query basic Redis INFO memory and clients if connected
 */
async function getRedisInfo() {
  if (!isRedisAvailable()) {
    return null;
  }

  try {
    const raw = await primaryClient.info();
    const info = {};
    for (const line of raw.split("\r\n")) {
      if (line && !line.startsWith("#")) {
        const [k, v] = line.split(":");
        if (k && v) info[k.trim()] = v.trim();
      }
    }
    return {
      version: info.redis_version || "unknown",
      mode: info.redis_mode || "standalone",
      usedMemoryHuman: info.used_memory_human || "0B",
      usedMemoryPeakHuman: info.used_memory_peak_human || "0B",
      connectedClients: parseInt(info.connected_clients || "0", 10),
      totalConnectionsReceived: parseInt(info.total_connections_received || "0", 10),
      totalCommandsProcessed: parseInt(info.total_commands_processed || "0", 10),
    };
  } catch {
    return null;
  }
}

/**
 * Graceful shutdown of Redis connections
 */
async function closeRedisConnections() {
  if (primaryClient) {
    try {
      if (primaryClient.status === "ready" || primaryClient.status === "connect") {
        await primaryClient.quit();
      } else {
        primaryClient.disconnect();
      }
    } catch {
      primaryClient.disconnect();
    } finally {
      isConnected = false;
      primaryClient = null;
    }
  }
}

// Hook process termination events for graceful shutdown
if (typeof process !== "undefined" && process.on) {
  process.on("SIGTERM", closeRedisConnections);
  process.on("SIGINT", closeRedisConnections);
}

// Initialize singleton
const client = initRedisClient();

module.exports = {
  redisClient: client,
  getPrimaryClient: () => primaryClient,
  initRedisClient,
  createDedicatedClient,
  isRedisAvailable,
  pingRedis,
  getRedisInfo,
  closeRedisConnections,
  validateRedisCredentials,
};
