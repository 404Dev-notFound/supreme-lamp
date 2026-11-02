# flowCTRL Redis Configuration Specification

## 1. Environment Variable Reference

The Redis infrastructure parses the following environment variables. In production, startup immediately fails if authentication secrets are missing or match insecure default values:

| Variable Name | Default Value | Description | Production Requirement |
|---|---|---|---|
| `REDIS_URL` | `null` | Full cache connection URI (e.g. `redis://:secret@redis:6379/0`) | Recommended in Docker / Kubernetes |
| `REDIS_HOST` | `localhost` | Redis cache hostname or container service name | Used if `REDIS_URL` is omitted |
| `REDIS_PORT` | `6379` | Redis cache TCP service port | Standard port 6379 |
| `REDIS_PASSWORD` | `""` | Cache authentication password (`requirepass`) | **Mandatory** in production (rejects defaults) |
| `REDIS_DB` | `0` | Redis logical database index (0-15) | Default 0 |
| `REDIS_QUEUE_URL` | `null` | Dedicated queue connection URI (e.g. `redis://:secret@redis-queue:6380/0`) | Recommended for isolated queue durability |
| `REDIS_QUEUE_HOST` | `localhost` | Dedicated BullMQ Redis server hostname | Used if `REDIS_QUEUE_URL` is omitted |
| `REDIS_QUEUE_PORT` | `6380` | Dedicated BullMQ Redis TCP port | Defaults to 6380 |
| `REDIS_QUEUE_PASSWORD` | Inherits `REDIS_PASSWORD` | Authentication password for dedicated queue instance | **Mandatory** in production |
| `REDIS_TLS` | `false` | Enable TLS/SSL connection wrapper | Set `true` if hosted on managed cloud (AWS ElastiCache, Upstash) |
| `REDIS_KEY_PREFIX` | `fc:` | Global prefix applied to all cache keys | Ensures clean isolation in shared Redis instances |
| `REDIS_CONNECT_TIMEOUT_MS` | `5000` | Max milliseconds to wait for initial TCP socket | Prevents hanging backend boot |
| `REDIS_COMMAND_TIMEOUT_MS` | `3000` | Max milliseconds per individual Redis command | Triggers fast fallback on slow commands |

---

## 2. Docker Service Configuration (`docker-compose.yml`)

The production Docker Compose configuration deploys **two isolated Redis instances** to ensure cache eviction never corrupts or purges BullMQ background jobs:

```yaml
  # 1. Volatile Cache, Rate Limiting & Session Accelerator
  redis:
    image: redis:7-alpine
    restart: always
    security_opt:
      - "no-new-privileges:true"
    command: >
      redis-server
      --requirepass ${REDIS_PASSWORD:?REDIS_PASSWORD must be set in environment}
      --maxmemory 256mb
      --maxmemory-policy allkeys-lru
      --save 900 1
      --save 300 10
      --tcp-backlog 511
      --timeout 0
      --tcp-keepalive 300
    environment:
      REDIS_PASSWORD: ${REDIS_PASSWORD:?REDIS_PASSWORD must be set in environment}
    ports:
      # Strictly bind to loopback - never expose to 0.0.0.0 public interface
      - "127.0.0.1:6379:6379"
    volumes:
      - flowctrl_redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
      start_period: 5s
    networks:
      - flowctrl_internal

  # 2. Durable BullMQ Background Job Queue Instance
  redis-queue:
    image: redis:7-alpine
    restart: always
    security_opt:
      - "no-new-privileges:true"
    command: >
      redis-server
      --port 6380
      --requirepass ${REDIS_PASSWORD:?REDIS_PASSWORD must be set in environment}
      --maxmemory 256mb
      --maxmemory-policy noeviction
      --appendonly yes
      --appendfsync everysec
      --save 900 1
      --save 300 10
      --tcp-backlog 511
      --timeout 0
      --tcp-keepalive 300
    environment:
      REDIS_PASSWORD: ${REDIS_PASSWORD:?REDIS_PASSWORD must be set in environment}
    ports:
      # Strictly bind to loopback - never expose to 0.0.0.0 public interface
      - "127.0.0.1:6380:6380"
    volumes:
      - flowctrl_redis_queue_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "-p", "6380", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
      start_period: 5s
    networks:
      - flowctrl_internal
```

---

## 3. Memory Eviction & Durability Architectures

flowCTRL explicitly separates cache eviction semantics from queue durability semantics:

### A. Volatile Cache Instance (`redis` on Port 6379)
- **Policy**: `maxmemory-policy allkeys-lru`
- **Memory Ceiling**: `256mb`
- **Rationale**: Caches (roadmaps, job listings, platform stats) can safely be recreated from PostgreSQL on demand. Under memory pressure, Redis purges the least recently accessed keys rather than throwing errors.

### B. Durable Queue Instance (`redis-queue` on Port 6380)
- **Policy**: `maxmemory-policy noeviction`
- **Persistence**: `appendonly yes` (`appendfsync everysec`) + RDB snapshots
- **Rationale**: BullMQ queue items represent asynchronous work orders (ATS resume scoring, notifications, RAG indexing). Under no circumstances can queue data be silently evicted. If memory limits are exceeded, Redis returns `OOM command not allowed`, alerting operators to scale capacity rather than losing jobs.

---

## 4. Connection Resilience & Exponential Backoff

Connection retries are governed by `apps/backend/src/lib/redis/client.js`:
- Initial delay: **200ms**
- Maximum backoff delay: **3,000ms**
- Maximum attempts: **5 attempts**
- Jitter: randomized offset **0 - 200ms** to prevent synchronous reconnect stampedes across multiple app containers.
- When maximum attempts are reached, the client gracefully transitions to the bounded in-memory fallback store without raising unhandled rejections.

---

## 5. Production Security Verification

At application boot (`apps/backend/src/config/index.js` and `apps/backend/src/lib/redis/client.js`), the configuration undergoes strict validation:
1. `NODE_ENV === 'production'` requires a non-empty `REDIS_PASSWORD`.
2. Prohibited default secrets (e.g. `redispassword9555`, `default`, `password`, `changeme`) trigger immediate fatal process exit (`process.exit(1)`).
3. Missing or insecure PostgreSQL `DATABASE_URL` credentials trigger the same fatal protection.
