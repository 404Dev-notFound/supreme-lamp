# flowCTRL Redis Distributed Architecture

## 1. Architectural Overview

flowCTRL utilizes Redis 7 as an enterprise-tier centralized in-memory caching, distributed rate-limiting, and asynchronous message broker layer positioned between the Next.js frontend, Express backend, and PostgreSQL 18 database engine.

To guarantee that queue data cannot be silently evicted as disposable cache data under memory pressure, flowCTRL employs a **Dual-Instance Separation Architecture**:
1. **`redis` (Cache Instance)**: Dedicated to volatile cache-aside, session acceleration, and rate limiting with `allkeys-lru` eviction policy.
2. **`redis-queue` (Queue Instance)**: Dedicated to BullMQ durable background processing with `noeviction` policy and Append-Only File (AOF) persistence.

```mermaid
flowchart TD
    Client["Client (Web Browser / Next.js)"]
    
    subgraph AppServer ["Express Application Tier (Node.js)"]
        Router["Express API Router"]
        RateLimiter["Distributed Rate Limiter Middleware"]
        SessionGuard["Session Cookie & Auth Validator"]
        
        subgraph RedisInfra ["Centralized Redis Infrastructure Layer"]
            ClientMgr["Connection & Lifecycle Manager (ioredis)"]
            CacheEngine["Resilient Cache-Aside Engine (Single-Flight)"]
            QueueMgr["BullMQ Background Processing Framework"]
            MetricsTracker["Observability & Hit/Miss Telemetry"]
            MemFallback["Bounded In-Memory Fallback Store (LRU)"]
        end
        
        Services["Domain Services (Roadmaps, Jobs, Admin, RAG)"]
    end
    
    subgraph CacheTier ["Cache & Session Tier (Instance 1: Port 6379)"]
        RedisCache[("Redis 7 Cache (allkeys-lru / RDB)")]
    end

    subgraph QueueTier ["Durable Background Queue Tier (Instance 2: Port 6380)"]
        RedisQueue[("Redis 7 BullMQ (noeviction / AOF + RDB)")]
    end
    
    subgraph DataTier ["Authoritative Persistence Tier"]
        PostgresDB[("PostgreSQL 18 Database")]
    end

    Client -->|HTTP / HTTPS| Router
    Router --> RateLimiter
    RateLimiter -->|Atomic INCR / Pipeline| RedisCache
    RateLimiter -.->|Fallback| MemFallback
    Router --> SessionGuard
    SessionGuard -->|L1 Session Cache (5m)| RedisCache
    SessionGuard -->|L2 Authoritative Check| PostgresDB
    Router --> Services
    Services -->|Cache-Aside getOrSet| CacheEngine
    CacheEngine -->|Read Hit| RedisCache
    CacheEngine -->|Read Miss| PostgresDB
    CacheEngine -.->|Outage Fallback| MemFallback
    Services -->|Enqueue Asynchronous Task| QueueMgr
    QueueMgr -->|Durable Persistence| RedisQueue
    QueueMgr -.->|Synchronous Fallback| Services
```

---

## 2. Component Breakdown

### 2.1 Connection & Lifecycle Manager (`client.js`)
- Singleton `ioredis` client instance initialized once during process boot for general caching and rate limiting.
- Dedicated client factory for BullMQ queues targeting the isolated `redis-queue` instance (`REDIS_QUEUE_URL` / `REDIS_QUEUE_PORT: 6380`).
- Non-blocking asynchronous connect (`lazyConnect: true`) ensures backend starts instantly even if Redis is unreachable.
- Automatic exponential backoff retry with jitter (`initialDelay: 200ms`, `maxDelay: 3000ms`, `maxAttempts: 5`).
- **Production Startup Security Guard**: Startup immediately aborts with a fatal error if credentials are empty or equal to default insecure passwords (`redispassword9555`).

### 2.2 Cache Engine & Race Condition Interceptor (`cache.js`)
- **Single-Flight Stampede Protection**: In-flight promise registry guarantees exactly one database execution during concurrent cold key queries.
- **Invalidation-Aware CAS Timestamp Guard**: Records invalidation tombstones (`fc:inv:<key>`); aborts stale cache writes if an update occurred while a database query was in flight.

### 2.3 Durable Background Queue Manager (`queues.js`)
- **Zero-False-Queuing**: When Redis is online, jobs persist to BullMQ queues with AOF persistence. When offline, executes synchronously with explicit `{ queued: false, synchronous: true, mode: "synchronous_fallback", degraded: true }`.
- **`noeviction` Guarantee**: BullMQ keys are isolated from the cache; Redis will throw an OOM error rather than silently evicting waiting jobs.
- **Dead-Letter Retention**: Up to 1,000 failed jobs retained for 7 days.

---

## 3. High-Availability & Disaster Recovery

- **Dual Volume Mounts**:
  - `flowctrl_redis_data`: Cache snapshots (`dump.rdb`).
  - `flowctrl_redis_queue_data`: Append-Only File (`appendonlydir/`) and RDB snapshots.
- **Transparent Degraded Fallback**: If both Redis instances are unavailable, public read routes serve directly from PostgreSQL and the local in-memory store without throwing 500 errors.
