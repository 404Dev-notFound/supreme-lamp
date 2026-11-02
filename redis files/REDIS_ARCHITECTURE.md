# flowCTRL Redis Distributed Architecture

## 1. Architectural Overview

flowCTRL utilizes Redis 7 as an enterprise-tier centralized in-memory caching, distributed rate-limiting, and asynchronous message broker layer positioned between the Next.js frontend, Express backend, and PostgreSQL 18 database engine.

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
    
    subgraph CacheTier ["In-Memory Data Tier"]
        RedisServer[("Redis 7 (Alpine Linux)")]
    end
    
    subgraph DataTier ["Authoritative Persistence Tier"]
        PostgresDB[("PostgreSQL 18 Database")]
    end

    Client -->|HTTP / HTTPS| Router
    Router --> RateLimiter
    RateLimiter -->|Atomic INCR / Pipeline| RedisServer
    RateLimiter -.->|Fallback| MemFallback
    Router --> SessionGuard
    SessionGuard -->|L1 Session Cache (5m)| RedisServer
    SessionGuard -->|L2 Authoritative Check| PostgresDB
    Router --> Services
    Services -->|Cache-Aside getOrSet| CacheEngine
    CacheEngine -->|Read Hit| RedisServer
    CacheEngine -->|Read Miss| PostgresDB
    CacheEngine -.->|Outage Fallback| MemFallback
    Services -->|Enqueue Asynchronous Task| QueueMgr
    QueueMgr -->|Dispatch Job| RedisServer
    QueueMgr -.->|Inline Fallback| Services
```

---

## 2. Component Breakdown

### 2.1 Connection & Lifecycle Manager (`client.js`)
- Singleton `ioredis` client instance initialized once during process boot.
- Connection parameters extracted dynamically from environment (`REDIS_URL`, `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_TLS`).
- Non-blocking asynchronous connect (`lazyConnect: true`) ensures backend starts instantly even if Redis is unreachable.
- Automatic exponential backoff retry with jitter (`initialDelay: 200ms`, `maxDelay: 3000ms`, `maxAttempts: 5`).
- Circuit-breaking logging: warns once on connection degradation and prevents terminal log flooding.
- Process signal listeners (`SIGTERM`, `SIGINT`) execute `quit()` for clean connection draining during container restarts.

### 2.2 Resilient Cache-Aside Engine (`cache.js`)
- Encapsulates JSON serialization/deserialization transparently.
- Implements single-flight promise memoization (`inflightPromises`) to prevent cache stampedes under high concurrency.
- Provides non-blocking batch invalidation (`delPattern`) using Redis `SCAN` (100 keys per cursor step) to prevent latency spikes caused by `KEYS *`.
- Built-in `MemoryFallbackStore` with automatic TTL sweep every 120 seconds guarantees zero service interruption if Redis goes offline.

### 2.3 BullMQ Background Processing (`queues.js`)
- Dedicated worker connection factory preventing command interference with general cache traffic.
- Four distinct queues:
  - `resume-analysis`: Asynchronous resume parsing and ATS heuristic/AI evaluation.
  - `notifications`: Asynchronous dispatch of email and in-app alerts.
  - `rag-indexing`: Background document chunking and vector cache warmup.
  - `cache-invalidation`: Wide-pattern distributed cache purges.
- Fallback queue simulator (`MemoryQueueFallback`) executes jobs inline on `setImmediate` when Redis is disconnected.

### 2.4 Metrics & Observability (`metrics.js`)
- In-memory telemetry tracker measuring lookups, hits, misses, sets, deletes, errors, fallback activations, and command latency.
- Accessible via `/api/health/redis` endpoint and Prometheus exporter.

