# flowCTRL Redis Troubleshooting & Operational Runbook

## 1. Fast Incident Triage Guide

### Scenario A: Backend Logs `[Redis] Connection warning, falling back to local memory store`
- **Root Cause**: The Redis service is offline, unreachable, or undergoing container reboot.
- **Immediate Impact**: Backend continues operating seamlessly via `MemoryFallbackStore`. Zero user requests fail. Caching and rate limiting run locally inside Node.js heap memory.
- **Triage Steps**:
  1. Check if Redis container is running:
     ```bash
     docker compose ps redis
     ```
  2. View container logs:
     ```bash
     docker compose logs --tail=50 redis
     ```
  3. Verify TCP port binding:
     ```bash
     Test-NetConnection -ComputerName localhost -Port 6379
     ```
  4. Restart the service if crashed:
     ```bash
     docker compose restart redis
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
     ```
  3. Restart the backend process.

---

### Scenario C: High Latency or Command Timeouts
- **Root Cause**: Blocking command executed (e.g. `KEYS *`), CPU starvation on host, or high memory fragmentation.
- **Resolution**:
  1. Check Redis slow log:
     ```bash
     redis-cli -a "<REDIS_PASSWORD>" slowlog get 10
     ```
  2. Verify no code calls `KEYS *`. Ensure only `cache.delPattern()` (which executes `SCAN`) is used.
  3. Inspect Redis CPU and memory usage:
     ```bash
     redis-cli -a "<REDIS_PASSWORD>" info stats
     ```

---

### Scenario D: `OOM command not allowed when used memory > 'maxmemory'`
- **Root Cause**: Redis reached `maxmemory` and the eviction policy is either `noeviction` or all keys are locked without TTL.
- **Resolution**:
  1. Verify eviction policy is set to `allkeys-lru` in `docker-compose.yml`:
     ```bash
     redis-cli -a "<REDIS_PASSWORD>" config get maxmemory-policy
     ```
  2. If not set, update dynamically:
     ```bash
     redis-cli -a "<REDIS_PASSWORD>" config set maxmemory-policy allkeys-lru
     ```
  3. Review keys without TTL:
     Every caching method (`cache.set`, `cache.getOrSet`) in flowCTRL mandates an explicit TTL.

---

### Scenario E: BullMQ Worker Stalled or Jobs Accumulating
- **Root Cause**: Background worker process crashed or microservice endpoint (Resume Screener) is timing out.
- **Resolution**:
  1. Inspect failed jobs count via `/api/health/redis`.
  2. Verify microservice connectivity (`RESUME_SCREENER_URL` at `http://127.0.0.1:5001`).
  3. BullMQ automatically retries 3 times with exponential backoff before sending to failed job log.

