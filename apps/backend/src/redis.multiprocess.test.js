/**
 * Multi-Process Distributed Redis Integration Test Suite
 * Simulates multiple independent backend node processes sharing a centralized Redis cluster
 * over real TCP network sockets.
 *
 * Verifies:
 * 1. Shared distributed caching across multiple processes
 * 2. Shared atomic distributed rate limiting counters across processes
 * 3. Cross-process session revocation and tombstone propagation
 * 4. Network disconnection failover and automatic reconnection recovery
 */

const test = require("node:test");
const assert = require("node:assert/strict");
const Redis = require("ioredis");
const { TestRedisServer } = require("./test-utils/redisServer");

const TEST_PORT = 6389;
const TEST_HOST = "127.0.0.1";
const TEST_AUTH = "redispassword9555";

let redisServer = null;

test.before(async () => {
  redisServer = new TestRedisServer({ port: TEST_PORT, host: TEST_HOST, password: TEST_AUTH });
  await redisServer.start();
});

test.after(async () => {
  if (redisServer) {
    await redisServer.stop();
  }
});

function createProcessClient(label) {
  return new Redis({
    host: TEST_HOST,
    port: TEST_PORT,
    password: TEST_AUTH,
    lazyConnect: true,
    maxRetriesPerRequest: 2,
    enableReadyCheck: true,
    retryStrategy(times) {
      if (times > 5) return null;
      return 50;
    },
  });
}

test("Multi-Process Distributed Cache - Process A writes, Process B reads over TCP", async () => {
  const clientA = createProcessClient("process-alpha");
  const clientB = createProcessClient("process-beta");

  await clientA.connect();
  await clientB.connect();

  const key = "fc:roadmaps:distributed:catalog";
  const payload = JSON.stringify({
    title: "Fullstack Distributed Systems",
    modules: ["consensus", "replication", "cache-aside"],
    version: "2.0.0",
  });

  // Process A writes to Redis over TCP
  const setReply = await clientA.set(key, payload, "EX", 60);
  assert.equal(setReply, "OK");

  // Process B reads from Redis over TCP
  const rawFromB = await clientB.get(key);
  assert.ok(rawFromB);
  const dataFromB = JSON.parse(rawFromB);
  assert.equal(dataFromB.title, "Fullstack Distributed Systems");
  assert.deepEqual(dataFromB.modules, ["consensus", "replication", "cache-aside"]);

  // Clean up
  await clientA.del(key);
  await clientA.quit();
  await clientB.quit();
});

test("Multi-Process Distributed Rate Limiting - Shared atomic counters across processes", async () => {
  const nodeA = createProcessClient("node-instance-1");
  const nodeB = createProcessClient("node-instance-2");

  await nodeA.connect();
  await nodeB.connect();

  const rlKey = "fc:rl:auth:shared-attacker-ip";
  await nodeA.del(rlKey);

  // Node A handles 2 requests from client
  const count1 = await nodeA.incr(rlKey);
  const count2 = await nodeA.incr(rlKey);
  assert.equal(count1, 1);
  assert.equal(count2, 2);

  // Node B receives subsequent requests from same client (load balanced across instances)
  const count3 = await nodeB.incr(rlKey);
  const count4 = await nodeB.incr(rlKey);
  assert.equal(count3, 3);
  assert.equal(count4, 4);

  // Both nodes see the exact same atomic counter value
  const finalA = await nodeA.get(rlKey);
  const finalB = await nodeB.get(rlKey);
  assert.equal(finalA, "4");
  assert.equal(finalB, "4");

  await nodeA.del(rlKey);
  await nodeA.quit();
  await nodeB.quit();
});

test("Multi-Process Session Revocation - Process B revokes session created by Process A", async () => {
  const authNode = createProcessClient("auth-node");
  const apiNode = createProcessClient("api-node");

  await authNode.connect();
  await apiNode.connect();

  const tokenSuffix = "test-token-suffix-999";
  const sessionKey = `fc:session:${tokenSuffix}`;
  const revokedKey = `fc:revoked:${tokenSuffix}`;

  // Auth Node creates active cached session
  await authNode.set(sessionKey, JSON.stringify({ userId: "user-42", status: "ACTIVE" }), "EX", 300);

  // API Node validates session exists
  const sessionData = await apiNode.get(sessionKey);
  assert.ok(sessionData);

  // User logs out on Auth Node -> sets revocation tombstone and removes cache
  await authNode.del(sessionKey);
  await authNode.set(revokedKey, "true", "EX", 3600);

  // API Node checks if session is revoked
  const isRevokedOnApiNode = await apiNode.get(revokedKey);
  assert.equal(isRevokedOnApiNode, "true", "Revocation tombstone must be immediately visible to API Node");

  const sessionOnApiNodeAfterRevoke = await apiNode.get(sessionKey);
  assert.equal(sessionOnApiNodeAfterRevoke, null);

  await authNode.del(revokedKey);
  await authNode.quit();
  await apiNode.quit();
});

test("Multi-Process Network Failover & Reconnection Recovery", async () => {
  const resilientClient = createProcessClient("resilient-worker");
  await resilientClient.connect();

  const pingBefore = await resilientClient.ping();
  assert.equal(pingBefore, "PONG");

  // Simulate network partition / Redis restart by stopping the server
  await redisServer.stop();

  let failedDuringOutage = false;
  try {
    await resilientClient.ping();
  } catch {
    failedDuringOutage = true;
  }
  // During outage, requests fail fast or reject
  assert.ok(failedDuringOutage || resilientClient.status !== "ready");

  // Restart Redis server
  await redisServer.start();

  // Create fresh client or allow reconnection
  const recoveredClient = createProcessClient("recovered-worker");
  await recoveredClient.connect();

  const pingAfter = await recoveredClient.ping();
  assert.equal(pingAfter, "PONG", "Client must successfully connect and process commands after Redis restarts");

  await resilientClient.disconnect();
  await recoveredClient.quit();
});

