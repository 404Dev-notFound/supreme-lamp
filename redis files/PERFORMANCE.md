# flowCTRL Redis Performance & Latency Engineering

## 1. Latency & Throughput Targets

The flowCTRL Redis infrastructure is engineered to satisfy strict high-scale performance criteria:

| Operation | Target P95 Latency | Target P99 Latency | Engine Source |
|---|---|---|---|
| Cache Read (`cache.get`) | < 1.0 ms | < 2.5 ms | Redis In-Memory |
| Cache Write (`cache.set`) | < 1.5 ms | < 3.0 ms | Redis In-Memory |
| Stampede-Proof Read (`getOrSet`) | < 1.2 ms (Hit) | < 45.0 ms (Cold Miss) | Single-Flight + Postgres |
| Rate Limit Check (`pipeline`) | < 1.5 ms | < 3.0 ms | Atomic Redis Pipeline |
| Queue Dispatch (`queues.dispatch`) | < 2.0 ms | < 5.0 ms | BullMQ Stream |
| Session Validation (`validateSessionToken`) | < 1.2 ms (Cached) | < 35.0 ms (DB Fallback) | Redis L1 Cache |

---

## 2. Key Performance Optimizations Implemented

### 2.1 Single-Flight Mutex Memoization
In read-heavy endpoints like `/api/roadmaps` (which aggregates 98 curriculum graphs, phases, and modules), cache stampedes are eliminated by promise memoization. Under 100 concurrent requests for an uncached key, database executions drop from 100 queries to **exactly 1 query**, reducing PostgreSQL load by **99%**.

### 2.2 Atomic Pipeline Execution
In `apps/backend/src/middleware/rateLimit.middleware.js`, rate limiting combines `INCR`, `EXPIRE`, and `TTL` within a single Redis pipeline:
- Avoids 3 separate network round-trips.
- Cuts latency from ~4.5ms down to ~1.2ms per HTTP request.

### 2.3 Non-Blocking Cursor Scanning (`SCAN` vs `KEYS *`)
`cache.delPattern(pattern)` uses cursor-based `SCAN` with batch chunks of 100 keys:
- The standard `KEYS *` command blocks the single-threaded Redis event loop, stalling all client connections while scanning millions of keys.
- `SCAN` allows Redis to process background sweeps incrementally without interrupting concurrent read/write traffic.

### 2.4 Dual Memory Allocation & Eviction Architecture
- **Volatile Cache (`redis` on 6379)**: Configured with `maxmemory 256mb` and `maxmemory-policy allkeys-lru`. Automatically frees memory under pressure by evicting stale cache items without dropping connections.
- **Durable Queues (`redis-queue` on 6380)**: Configured with `maxmemory 256mb` and `maxmemory-policy noeviction` with AOF persistence. Prevents background BullMQ jobs, retries, and dead letters from being silently dropped under cache spikes.

### 2.5 Connection Reuse & Pool Architecture
- The application reuses a single persistent TCP connection for general caching and rate limiting.
- Dedicated independent connections are created only where mandatory by design (BullMQ workers, blocking stream commands), preventing head-of-line blocking.
