# flowCTRL Redis Troubleshooting & Operational Runbook

## 1. Fast Incident Triage Guide

### Scenario A: Backend Logs `[Redis] Connection warning, falling back to local memory store`
- **Root Cause**: The Redis service (Cache or Queue) is offline, unreachable, or undergoing container reboot.
- **Immediate Impact**: Backend continues operating seamlessly via `MemoryFallbackStore`. Zero user requests fail. Caching and rate limiting run locally inside Node.js heap memory; background jobs run inline.
- **Triage Steps**:
  1. Check if Redis containers are running:
     ```bash
     docker compose ps redis redis-queue
     ```
  2. View container logs:
     ```bash
     docker compose logs --tail=50 redis
     docker compose logs --tail=50 redis-queue
     ```
  3. Verify TCP port binding:
     ```bash
     Test-NetConnection -ComputerName localhost -Port 6379
     Test-NetConnection -ComputerName localhost -Port 6380
     ```
  4. Restart the service if crashed:
     ```bash
     docker compose restart redis redis-queue
     ```
  5. The backend client will automatically reconnect and log:
     `[Redis] Connected and ready on localhost:6379 (db: 0).`

---

### Scenario B: `NOAUTH Authentication required`
- **Root Cause**: Redis was started with `--requirepass`, but backend `REDIS_PASSWORD` was empty or incorrect.
- **Resolution**:
  1. Verify `.env` contains the exact password configured in `docker-compose.yml`:
     ```env
     REDIS_PASSWORD=your-secure-password
     ```
  2. Test authentication directly:
     ```bash
     redis-cli -h 127.0.0.1 -p 6379 -a "your-secure-password" ping
     redis-cli -h 127.0.0.1 -p 6380 -a "your-secure-password" ping
     ```
  3. Restart the backend process.

---

### Scenario C: High Latency or Command Timeouts
- **Root Cause**: Blocking command executed (e.g. `KEYS *`), CPU starvation on host, or high memory fragmentation.
- **Resolution**:
  1. Check Redis slow log:
     ```bash
     redis-cli -a "$REDIS_PASSWORD" slowlog get 10
     ```
  2. Verify no code calls `KEYS *`. Ensure only `cache.delPattern()` (which executes cursor-based `SCAN`) is used.
  3. Inspect Redis CPU and memory usage:
     ```bash
     redis-cli -a "$REDIS_PASSWORD" info stats
     ```

---

### Scenario D: `OOM command not allowed when used memory > 'maxmemory'`

The resolution depends on whether the alert originates from the **Cache** or **Queue** instance:

#### Case 1: Cache Instance (`redis` on Port 6379)
- **Root Cause**: Cache instance reached `maxmemory` (256MB) and is unable to free memory.
- **Verification**:
  ```bash
  redis-cli -a "$REDIS_PASSWORD" config get maxmemory-policy
  ```
  Ensure policy is `allkeys-lru`. If not, update it dynamically:
  ```bash
  redis-cli -a "$REDIS_PASSWORD" config set maxmemory-policy allkeys-lru
  ```

#### Case 2: Queue Instance (`redis-queue` on Port 6380)
- **Root Cause**: BullMQ queue instance intentionally runs with `maxmemory-policy noeviction` so jobs are never dropped. Memory exhaustion indicates a massive backlog of unconsumed jobs or uncleaned failed jobs.
- **DO NOT** change `maxmemory-policy` to `allkeys-lru` on `redis-queue`! Doing so would silently drop in-flight user work.
- **Resolution Steps**:
  1. Check queue depth:
     ```bash
     redis-cli -p 6380 -a "$REDIS_PASSWORD" keys "bull:*:wait"
     ```
  2. Scale background BullMQ workers to process the backlog:
     ```bash
     docker compose up -d --scale backend=3
     ```
  3. Clean completed or failed jobs if retaining too many logs:
     Trigger queue cleanup via `queues.cleanOldJobs()` or restart with increased RAM quota (`--maxmemory 512mb`).

---

### Scenario E: BullMQ Worker Stalled or Jobs Accumulating
- **Root Cause**: Background worker process crashed, microservice endpoint (Resume Screener) is timing out, or connection to port 6380 was disrupted.
- **Resolution**:
  1. Inspect failed jobs count via `/api/health/redis`.
  2. Verify microservice connectivity (`RESUME_SCREENER_URL` at `http://127.0.0.1:5001`).
  3. BullMQ automatically retries 3 times with exponential backoff before sending to failed job log.
  4. Verify the worker client is successfully connected to the queue instance:
     `[Redis:Queue] Dedicated client for bullmq initialized.`

---

### Scenario F: Backend Fails Boot with "Insecure or default credentials detected"
- **Root Cause**: Backend was started in `NODE_ENV=production` with an unset `REDIS_PASSWORD` or an insecure known placeholder (e.g. `redispassword9555`, `default`, `password`).
- **Resolution**:
  1. Generate a production-grade cryptographic password:
     ```bash
     openssl rand -hex 32
     ```
  2. Populate `REDIS_PASSWORD` in your production environment / `.env`.
  3. Restart the backend container or process.
