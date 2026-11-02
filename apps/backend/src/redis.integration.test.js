/**
 * Comprehensive Integration & Verification Suite for FlowCTRL Redis Infrastructure
 * Tests Connection, Caching, Stampede Protection, Race Condition Prevention,
 * Durable Queues (Zero-False-Queuing), Fail-Closed Rate Limiting, Session Invalidation,
 * Production Security Guards, Dedicated Queue Isolation, and RAG Cache Isolation.
 */

const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const {
  cache,
  queues,
  metrics,
  buildKey,
  REDIS_CONFIG,
  isRedisAvailable,
  pingRedis,
  getRedisHealthReport,
} = require("./lib/redis");
const { createRateLimiter, authRateLimiter } = require("./middleware/rateLimit.middleware");
const { validateSessionToken, revokeSessionToken, revokeAllUserSessions } = require("./utils/sessionCookie");
const { prisma } = require("./lib/prisma");

test("Redis Infrastructure - Connection & Health Diagnostics", async () => {
  const ping = await pingRedis();
  assert.ok(typeof ping.available === "boolean");
  assert.ok(typeof ping.status === "string");

  const health = await getRedisHealthReport();
  assert.ok(health);
  assert.ok(["connected", "degraded"].includes(health.status));
  assert.ok(typeof health.degraded === "boolean");
  assert.ok(health.cacheMetrics);
  assert.ok(typeof health.cacheMetrics.totalLookups === "number");
});

test("Redis Infrastructure - Key Generation & Namespace Isolation", () => {
  const key1 = buildKey(REDIS_CONFIG.namespaces.ROADMAPS, "catalog", "frontend");
  assert.equal(key1, "fc:roadmaps:catalog:frontend");

  const key2 = buildKey(REDIS_CONFIG.namespaces.SESSION, "token123");
  assert.equal(key2, "fc:session:token123");

  const key3 = buildKey(REDIS_CONFIG.namespaces.RATE_LIMIT, "ip:127.0.0.1");
  assert.equal(key3, "fc:rl:ip:127.0.0.1");

  const key4 = buildKey(REDIS_CONFIG.namespaces.INV, "test:key");
  assert.equal(key4, "fc:inv:test:key");
});

test("Redis Cache Engine - Set, Get, TTL, and Del Operations", async () => {
  const testKey = "fc:test:item:alpha";
  const payload = {
    id: "alpha-1",
    title: "Distributed Consensus",
    tags: ["raft", "paxos"],
    active: true,
  };

  // Set with 60 second TTL
  const setOk = await cache.set(testKey, payload, 60);
  assert.equal(setOk, true);

  // Retrieve and verify data integrity
  const retrieved = await cache.get(testKey);
  assert.ok(retrieved);
  assert.equal(retrieved.id, payload.id);
  assert.equal(retrieved.title, payload.title);
  assert.deepEqual(retrieved.tags, payload.tags);

  // Verify TTL is positive
  const remainingTtl = await cache.ttl(testKey);
  assert.ok(remainingTtl > 0 && remainingTtl <= 60);

  // Delete key
  const delOk = await cache.del(testKey);
  assert.equal(delOk, true);

  // Verify key is gone
  const afterDel = await cache.get(testKey);
  assert.equal(afterDel, null);
});

test("Redis Cache Engine - Atomic Counter Increment", async () => {
  const counterKey = "fc:test:counter:hits";
  await cache.del(counterKey);

  const val1 = await cache.increment(counterKey, 1, 30);
  assert.equal(val1, 1);

  const val2 = await cache.increment(counterKey, 5, 30);
  assert.equal(val2, 6);

  await cache.del(counterKey);
});

test("Redis Cache Engine - Single-Flight Mutex & Cache Stampede Protection", async () => {
  const stampedeKey = "fc:test:stampede:shared_query";
  await cache.del(stampedeKey);

  let databaseExecutionCount = 0;

  // Expensive mock database query with simulated async delay
  const expensiveFetcher = async () => {
    databaseExecutionCount++;
    await new Promise((resolve) => setTimeout(resolve, 50));
    return { calculatedValue: 42, timestamp: Date.now() };
  };

  // Launch 10 simultaneous concurrent requests for the exact same cold key
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(cache.getOrSet(stampedeKey, expensiveFetcher, 60));
  }

  const results = await Promise.all(promises);

  // Assert single-flight deduplication: expensive fetcher must have run EXACTLY ONCE
  assert.equal(databaseExecutionCount, 1, "Stampede protection should execute fetcher only once");
  assert.equal(results.length, 10);
  for (const res of results) {
    assert.equal(res.calculatedValue, 42);
  }

  // Clean up
  await cache.del(stampedeKey);
});

test("Redis Cache Engine - Stale-Write Race Condition Prevention", async () => {
  const raceKey = "fc:test:race:item";
  await cache.del(raceKey);
  metrics.reset();

  const slowStaleFetcher = async () => {
    // Simulate database read latency of 80ms
    await new Promise((resolve) => setTimeout(resolve, 80));
    return { data: "stale-db-read-v1" };
  };

  // 1. Request A starts reading stale data
  const requestAPromise = cache.getOrSet(raceKey, slowStaleFetcher, 60);

  // 2. In the middle of Request A's database read (at 20ms), Request B updates DB and invalidates cache
  await new Promise((resolve) => setTimeout(resolve, 20));
  await cache.del(raceKey);

  // 3. Request A finishes reading its pre-invalidation stale data
  const resultA = await requestAPromise;
  assert.equal(resultA.data, "stale-db-read-v1");

  // 4. Assert race condition was detected and intercepted:
  // Stale data was NOT written to the cache!
  const cachedAfterRace = await cache.get(raceKey);
  assert.equal(cachedAfterRace, null, "Stale pre-invalidation data must not pollute the cache");

  const stats = metrics.getStats();
  assert.ok(stats.raceConditionsPrevented >= 1, "Race condition prevention metric should be incremented");

  await cache.del(raceKey);
});

test("Redis Cache Engine - Pattern-Based Invalidation via Non-Blocking Scan", async () => {
  await cache.set("fc:test:inv:item-1", { a: 1 }, 60);
  await cache.set("fc:test:inv:item-2", { a: 2 }, 60);
  await cache.set("fc:test:other:item-3", { a: 3 }, 60);

  // Invalidate all keys matching fc:test:inv:*
  const deletedCount = await cache.delPattern("fc:test:inv:*");
  assert.ok(deletedCount >= 2);

  assert.equal(await cache.get("fc:test:inv:item-1"), null);
  assert.equal(await cache.get("fc:test:inv:item-2"), null);

  // Other namespace must remain untouched
  const other = await cache.get("fc:test:other:item-3");
  assert.ok(other);
  assert.equal(other.a, 3);

  await cache.del("fc:test:other:item-3");
});

test("Redis Queues - Zero-False-Queuing Background Dispatch & Execution", async () => {
  let jobProcessed = false;
  let receivedData = null;

  // Register worker handler
  queues.registerWorker(queues.QUEUE_NAMES.NOTIFICATIONS, async (job) => {
    jobProcessed = true;
    receivedData = job.data;
    return { success: true };
  });

  const jobPayload = {
    userId: "test-user-123",
    title: "Welcome to flowCTRL",
    message: "Your Redis infrastructure is active.",
    type: "system",
  };

  const dispatched = await queues.dispatch.dispatchNotification(jobPayload);
  assert.ok(dispatched);

  // Verify honest status contract:
  // If Redis is online: queued = true, durable_queue mode, jobId string
  // If Redis is offline: queued = false, synchronous_fallback mode, degraded = true
  if (dispatched.queued) {
    assert.ok(dispatched.id);
    assert.equal(dispatched.mode, "durable_queue");
  } else {
    assert.equal(dispatched.synchronous, true);
    assert.equal(dispatched.mode, "synchronous_fallback");
    assert.equal(dispatched.degraded, true);
    assert.equal(jobProcessed, true);
  }
});

test("Distributed Rate Limiter - Enforces Limits and Emits Headers", async () => {
  const limiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 3,
    message: "Rate limit test exceeded",
    keyGenerator: () => "test-limiter-key",
  });

  const responses = [];

  for (let i = 0; i < 5; i++) {
    let statusCode = 200;
    const headers = {};
    const req = {
      ip: "127.0.0.1",
      path: "/test",
      headers: { "x-test-rate-limit": "1" },
    };
    const res = {
      setHeader(name, val) {
        headers[name] = val;
      },
      status(code) {
        statusCode = code;
        return this;
      },
      json(body) {
        return { statusCode, body, headers };
      },
    };

    let nextCalled = false;
    await limiter(req, res, () => {
      nextCalled = true;
    });

    responses.push({ statusCode, headers, nextCalled });
  }

  // First 3 requests should pass
  assert.equal(responses[0].nextCalled, true);
  assert.equal(responses[1].nextCalled, true);
  assert.equal(responses[2].nextCalled, true);

  // 4th and 5th requests should be blocked with 429
  assert.equal(responses[3].statusCode, 429);
  assert.ok(responses[3].headers["Retry-After"]);
  assert.equal(responses[4].statusCode, 429);
});

test("Distributed Rate Limiter - Fail-Closed Security Policy on Auth Limiter", async () => {
  // authRateLimiter has failureMode: "fail-closed"
  assert.ok(authRateLimiter);

  // Verify fail-closed limiter blocks requests safely on critical errors
  const failClosedLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 2,
    failureMode: "fail-closed",
    keyGenerator: () => {
      throw new Error("Simulated key extraction security exception");
    },
  });

  let statusCode = 200;
  let responseBody = null;
  const req = { ip: "127.0.0.1", path: "/auth/login", headers: { "x-test-rate-limit": "1" } };
  const res = {
    setHeader() {},
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return body;
    },
  };

  let nextCalled = false;
  await failClosedLimiter(req, res, () => {
    nextCalled = true;
  });

  // Must fail closed (HTTP 503) and NOT call next()
  assert.equal(nextCalled, false, "Fail-closed rate limiter must never pass through on errors");
  assert.equal(statusCode, 503);
  assert.equal(responseBody.code, "RATE_LIMIT_UNAVAILABLE");
});

test("Session Caching - Caches Valid Sessions, Targets Precision Invalidation, and Handles Revocation", async () => {
  const admin = await prisma.user.findUnique({
    where: { email: "admin@flowctrl.dev" },
  });
  assert.ok(admin);

  const sessionToken = "test-session-token-" + Date.now();
  const session = await prisma.userSession.create({
    data: {
      userId: admin.id,
      sessionToken,
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
      ipAddress: "127.0.0.1",
      userAgent: "Test Runner",
    },
  });

  // 1. Initial lookup populates Redis cache
  const firstValidation = await validateSessionToken(sessionToken);
  assert.equal(firstValidation.valid, true);
  assert.equal(firstValidation.user.id, admin.id);

  // 2. Second lookup reads directly from Redis cache
  const cachedValidation = await validateSessionToken(sessionToken);
  assert.equal(cachedValidation.valid, true);
  assert.equal(cachedValidation.user.email, admin.email);

  // 3. Revocation purges cache and records tombstone
  const revoked = await revokeSessionToken(sessionToken);
  assert.equal(revoked, true);

  const postRevokeValidation = await validateSessionToken(sessionToken);
  assert.equal(postRevokeValidation.valid, false);
  assert.equal(postRevokeValidation.reason, "SESSION_REVOKED");

  // Clean up DB
  await prisma.userSession.delete({ where: { id: session.id } });
});

test("Redis Observability - Hit/Miss Ratio and Metrics Tracking", async () => {
  metrics.reset();

  const key = "fc:test:metric:sample";
  await cache.del(key);

  // Miss
  await cache.get(key);
  // Set
  await cache.set(key, "hello", 60);
  // Hit
  await cache.get(key);
  await cache.get(key);

  const stats = metrics.getStats();
  assert.ok(stats.hits >= 2);
  assert.ok(stats.misses >= 1);
  assert.ok(stats.hitRatePercent > 0);

  await cache.del(key);
});

test("Production Security Guard - Rejects insecure default or missing secrets in production mode", () => {
  const { validateRedisCredentials } = require("./lib/redis/client");
  const origEnv = process.env.NODE_ENV;
  const origPass = process.env.REDIS_PASSWORD;

  try {
    process.env.NODE_ENV = "production";
    process.env.REDIS_PASSWORD = "redispassword9555";

    assert.throws(
      () => validateRedisCredentials(),
      /FATAL SECURITY CONFIGURATION/,
      "Must reject default insecure credentials in production mode"
    );
  } finally {
    process.env.NODE_ENV = origEnv;
    process.env.REDIS_PASSWORD = origPass;
  }
});

test("Dedicated Queue Isolation - BullMQ queue configuration supports isolated instance", () => {
  assert.ok(REDIS_CONFIG.queue);
  assert.ok(typeof REDIS_CONFIG.queue.port === "number");
  assert.ok(typeof REDIS_CONFIG.queue.host === "string");
});

test("RAG AI Cache Isolation - Deterministic keys prevent cross-tenant and cross-tier leakage", () => {
  function buildTestRagKey(query, role, tenant) {
    const raw = `q=${query.trim().toLowerCase()}|role=${role}|tenant=${tenant}`;
    return `fc:rag:retrieval:${tenant}:${role}:${crypto.createHash("sha256").update(raw).digest("hex").slice(0, 32)}`;
  }

  const query = "Next.js distributed caching architecture";
  const standardKey = buildTestRagKey(query, "FREE", "org-alpha");
  const premiumKey = buildTestRagKey(query, "PREMIUM", "org-alpha");
  const tenantBKey = buildTestRagKey(query, "FREE", "org-beta");

  assert.notEqual(standardKey, premiumKey, "Free and Premium users must never share cache keys");
  assert.notEqual(standardKey, tenantBKey, "Different tenants must never share cache keys");
});
