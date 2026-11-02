# flowCTRL Redis Testing & Verification Guide

## 1. Automated Test Suites

flowCTRL features two specialized, automated integration test suites for verifying Redis infrastructure:

### 1.1 In-Process Integration Test Suite
Location: `apps/backend/src/redis.integration.test.js` (12 comprehensive tests)
- **Connection & Health Diagnostics**: Verifies `pingRedis()` and `getRedisHealthReport()` return valid states (`connected` or `degraded`).
- **Key Generation**: Validates namespace isolation (`fc:roadmaps:`, `fc:session:`, `fc:rl:`, `fc:inv:`).
- **Cache Engine Operations**: Tests `set`, `get`, `ttl`, `del`, and JSON serialization.
- **Atomic Counter Increment**: Tests `increment` with atomic TTL assignment.
- **Single-Flight Stampede Protection**: Simulates 10 concurrent requests for a cold key and asserts the expensive database fetcher executes **exactly once**.
- **Stale-Write Race Condition Prevention**: Simulates concurrent database fetch during key invalidation and proves stale data is **not written** to the cache.
- **Pattern-Based Invalidation**: Verifies `delPattern` purges matching keys without affecting adjacent namespaces.
- **Zero-False-Queuing Background Processing**: Proves that jobs are never falsely acknowledged as queued when Redis is offline, executing synchronously with degraded status.
- **Distributed Rate Limiting**: Simulates bursts of traffic, verifying that requests exceeding limits receive HTTP 429 with `Retry-After` header.
- **Fail-Closed Security Policy**: Verifies that auth rate limiters reject requests (503/429) rather than failing open if rate limiting evaluation encounters critical errors.
- **Session Caching & Precision Invalidation**: Verifies L1 session caching, precision targeting of user sessions on logout-all, and immediate invalidation on `revokeSessionToken`.
- **Observability & Hit/Miss Telemetry**: Verifies `redisMetrics.getStats()` tracks hits, misses, race conditions prevented, and hit rate percentage.

### 1.2 Multi-Process Distributed Test Suite
Location: `apps/backend/src/redis.multiprocess.test.js` (4 distributed tests over real TCP)
Simulates multiple independent backend node instances communicating over real TCP network sockets (`127.0.0.1:6389`):
1. **Multi-Process Distributed Cache**: Process A writes data to Redis over TCP -> Process B reads and validates exact data received over TCP.
2. **Multi-Process Distributed Rate Limiting**: Node instance 1 and Node instance 2 increment the same client IP rate limit key; both verify the shared atomic counter over the network.
3. **Multi-Process Session Revocation**: Auth Node establishes session; API Node validates; User logs out on Auth Node setting revocation tombstone; API Node immediately sees the revocation and refuses access.
4. **Network Failover & Reconnection Recovery**: TCP server is stopped during active load (simulating crash/partition); clients detect socket error; TCP server restarts; clients automatically reconnect and resume normal operations.

---

## 2. Running Automated Tests

Run the full backend test suite covering all 94 backend tests including both Redis test suites:
```bash
npm test --workspace=backend
```

Run only Redis tests:
```bash
node --test apps/backend/src/redis.integration.test.js apps/backend/src/redis.multiprocess.test.js
```

---

## 3. Fault Injection & Outage Testing Protocol

To empirically prove that flowCTRL handles Redis outages gracefully in production environments:

### Test Protocol:
1. Start the application stack with Redis online (`docker compose up -d redis backend`).
2. Make HTTP requests to `/api/roadmaps` and verify sub-millisecond cached responses.
3. Intentionally kill the Redis container:
   ```bash
   docker compose stop redis
   ```
4. Query `/api/health` and `/api/health/redis`. Verify `status: "degraded"`, `redis: "degraded_fallback"`, `degraded: true`.
5. Make HTTP requests to `/api/roadmaps`, `/api/jobs`, and `/api/auth/signin`.
6. Assert that **all endpoints continue returning 200 OK** using PostgreSQL and the internal `MemoryFallbackStore`.
7. Assert that authentication endpoints enforce local sliding-window limits or fail closed securely.
8. Restart Redis:
   ```bash
   docker compose start redis
   ```
9. Verify the client automatically reconnects and `/api/health` transitions back to `status: "healthy"`, `redis: "connected"`, `degraded: false`.
