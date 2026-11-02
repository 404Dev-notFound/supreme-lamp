# flowCTRL Redis Configuration Specification

## 1. Environment Variable Reference

The Redis infrastructure parses the following environment variables. If unset, production-safe defaults are applied:

| Variable Name | Default Value | Description | Production Requirement |
|---|---|---|---|
| `REDIS_URL` | `null` | Full connection URI (e.g. `redis://:password@redis:6379/0`) | Recommended in Docker / Kubernetes |
| `REDIS_HOST` | `localhost` | Redis server hostname or container service name | Used if `REDIS_URL` is omitted |
| `REDIS_PORT` | `6379` | Redis TCP service port | Standard port 6379 |
| `REDIS_PASSWORD` | `""` | Authentication password (`requirepass`) | **Mandatory** in production |
| `REDIS_DB` | `0` | Redis logical database index (0-15) | Default 0 |
| `REDIS_TLS` | `false` | Enable TLS/SSL connection wrapper | Set `true` if hosted on managed cloud (AWS ElastiCache, Upstash) |
| `REDIS_KEY_PREFIX` | `fc:` | Global prefix applied to all cache keys | Ensures clean isolation in shared Redis instances |
| `REDIS_CONNECT_TIMEOUT_MS` | `5000` | Max milliseconds to wait for initial TCP socket | Prevents hanging backend boot |
| `REDIS_COMMAND_TIMEOUT_MS` | `3000` | Max milliseconds per individual Redis command | Triggers fast fallback on slow commands |

---

## 2. Docker Service Configuration (`docker-compose.yml`)

The production Docker Compose configuration sets up Redis 7 Alpine with resource boundaries and health monitoring:

```yaml
  redis:
    image: redis:7-alpine
    restart: always
    security_opt:
      - "no-new-privileges:true"
    command: >
      redis-server
      --requirepass ${REDIS_PASSWORD:-redispassword9555}
      --maxmemory 256mb
      --maxmemory-policy allkeys-lru
      --save 900 1
      --save 300 10
      --tcp-backlog 511
      --timeout 0
      --tcp-keepalive 300
    environment:
      REDIS_PASSWORD: ${REDIS_PASSWORD:-redispassword9555}
    ports:
      # Strictly bind to loopback - never expose to 0.0.0.0 public interface
      - "127.0.0.1:6379:6379"
    volumes:
      - flowctrl_redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD:-redispassword9555}", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
      start_period: 5s
    networks:
      - flowctrl_internal
```

---

## 3. Memory Eviction Policy

flowCTRL configures **`maxmemory-policy allkeys-lru`** with **`maxmemory 256mb`** (scalable based on node capacity):
- **Why LRU?**: When memory limits are reached, Redis evicts the least recently used keys first.
- **Why `allkeys-lru`?**: Caches (roadmaps, job listings, platform stats) can safely be recreated from PostgreSQL on demand, guaranteeing that Redis never exhausts host RAM or crashes with `OOM command not allowed`.

---

## 4. Connection Resilience & Exponential Backoff

Connection retries are governed by `apps/backend/src/lib/redis/client.js`:
- Initial delay: **200ms**
- Maximum backoff delay: **3,000ms**
- Maximum attempts: **5 attempts**
- Jitter: randomized offset **0 - 200ms** to prevent synchronous reconnect stampedes across multiple app containers.
- When maximum attempts are reached, the client gracefully transitions to the bounded in-memory fallback store without raising unhandled rejections.

