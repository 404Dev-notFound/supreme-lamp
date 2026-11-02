const Redis = require("ioredis");

let redisClient = null;
let isConnected = false;

function initRedis() {
  const redisUrl = process.env.REDIS_URL;
  const redisHost = process.env.REDIS_HOST;

  if (!redisUrl && !redisHost) {
    // Redis is not configured, operate in memory-fallback mode
    return null;
  }

  try {
    const client = redisUrl
      ? new Redis(redisUrl, {
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          enableReadyCheck: false,
          reconnectOnError: () => false,
        })
      : new Redis({
          host: redisHost,
          port: parseInt(process.env.REDIS_PORT || "6379", 10),
          password: process.env.REDIS_PASSWORD || undefined,
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          enableReadyCheck: false,
          reconnectOnError: () => false,
        });

    client.on("connect", () => {
      isConnected = true;
      console.log("[Redis] Connected successfully.");
    });

    client.on("error", (err) => {
      isConnected = false;
      // Log once at debug/warn level, do not crash process
      if (process.env.NODE_ENV !== "test") {
        console.warn("[Redis] Connection warning, falling back to local memory store:", err.message);
      }
    });

    client.on("close", () => {
      isConnected = false;
    });

    // Attempt initial connect asynchronously
    client.connect().catch(() => {
      isConnected = false;
    });

    redisClient = client;
    return client;
  } catch (err) {
    console.warn("[Redis] Initialization failed, using local memory store:", err.message);
    return null;
  }
}

const client = initRedis();

module.exports = {
  redisClient: client,
  isRedisAvailable: () => isConnected && redisClient?.status === "ready",
};
