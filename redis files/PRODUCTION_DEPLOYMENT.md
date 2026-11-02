# flowCTRL Redis Production Deployment & Operations

## 1. Production Topologies

Depending on cluster size and deployment environment, flowCTRL supports three operational Redis architectures:

### 1. Dual-Instance Container Topology (Recommended Docker Compose)
- **Deployment**: Two isolated containers running `redis:7-alpine`.
  - **`redis` (Cache)**: Volatile cache, session acceleration, rate limiting.
    - Port: 6379
    - Eviction: `maxmemory-policy allkeys-lru`
    - Persistence: RDB snapshots (`save 900 1`, `save 300 10`) backed by volume `flowctrl_redis_data`
  - **`redis-queue` (Queue)**: BullMQ background queues and workers.
    - Port: 6380
    - Eviction: `maxmemory-policy noeviction` (jobs must never be evicted silently)
    - Persistence: AOF (`appendonly yes`, `appendfsync everysec`) + RDB snapshots backed by volume `flowctrl_redis_queue_data`
- **Use Case**: Production deployments on single-host or Docker Swarm/Kubernetes nodes.

### 2. Managed Redis (AWS ElastiCache / Google Cloud Memorystore / Upstash)
- **Deployment**: Dual dedicated clusters or primary/replica instances.
  - Instance 1: Configured for Cache with `allkeys-lru` eviction.
  - Instance 2: Configured for Queue with `noeviction` and continuous AOF replication.
- **TLS**: `REDIS_TLS=true` enables encrypted transport in transit.
- **Connection**:
  - `REDIS_URL=rediss://default:token@cache-cluster.cache.amazonaws.com:6379`
  - `REDIS_QUEUE_URL=rediss://default:token@queue-cluster.cache.amazonaws.com:6380`

### 3. Redis Sentinel / Primary-Replica
- **Deployment**: 1 primary node + 2 read replicas + 3 Sentinel nodes per instance.
- **Failover**: Automated primary election within < 3 seconds.
- **ioredis Support**: Native support via `sentinels` array configuration.

---

## 2. Production Docker Deployment Checklist

Before launching in production:

1. **Enforce Strong Secrets**:
   Generate a cryptographic 64-character password:
   ```bash
   openssl rand -hex 32
   ```
   Set this value in production `.env` as `REDIS_PASSWORD`.
   > [!IMPORTANT]
   > The application startup validator unconditionally aborts if `REDIS_PASSWORD` is omitted, blank, or matches insecure defaults (e.g. `redispassword9555`, `default`, `password`).

2. **Verify Dual Eviction Policies**:
   - `redis`: Confirm `--maxmemory 256mb` and `--maxmemory-policy allkeys-lru`.
   - `redis-queue`: Confirm `--maxmemory 256mb`, `--maxmemory-policy noeviction`, and `--appendonly yes`.

3. **Verify Internal Network Isolation**:
   Confirm both `redis` and `redis-queue` containers are connected strictly to `flowctrl_internal`. Do not bind ports to `0.0.0.0`. In development/testing, ports bind to `127.0.0.1`.

4. **Verify Backend Healthcheck Dependency**:
   Ensure `backend` in `docker-compose.yml` specifies:
   ```yaml
   depends_on:
     postgres:
       condition: service_healthy
     redis:
       condition: service_healthy
     redis-queue:
       condition: service_healthy
   ```

---

## 3. Backup & Disaster Recovery Procedures

flowCTRL relies on distinct backup strategies for the Cache and Queue layers:

### A. Volatile Cache Instance (`redis`)
Because cached data (roadmaps, job listings, platform stats) can be regenerated on demand from PostgreSQL, RDB snapshotting is sufficient.
1. **Trigger Manual Snapshot**:
   ```bash
   docker compose exec redis redis-cli -a "$REDIS_PASSWORD" BGSAVE
   ```
2. **Verify Snapshot Completion**:
   ```bash
   docker compose exec redis redis-cli -a "$REDIS_PASSWORD" LASTSAVE
   ```
3. **Backup File**: Copy `/data/dump.rdb` from Docker volume `flowctrl_redis_data` to secure cold storage.

### B. Durable BullMQ Queue Instance (`redis-queue`)
BullMQ queues hold pending ATS resume evaluations, async notifications, and document processing jobs. Durability is maintained by continuous Append-Only File (AOF) logging combined with RDB snapshots.
1. **Trigger AOF Rewrite & Snapshot**:
   ```bash
   docker compose exec redis-queue redis-cli -p 6380 -a "$REDIS_PASSWORD" BGREWRITEAOF
   docker compose exec redis-queue redis-cli -p 6380 -a "$REDIS_PASSWORD" BGSAVE
   ```
2. **Backup Storage Volume**:
   Archive the contents of Docker volume `flowctrl_redis_queue_data`:
   - `appendonlydir/` (AOF manifest and incremental segments)
   - `dump.rdb`
3. **Disaster Recovery Steps**:
   - Stop `redis-queue` container: `docker compose stop redis-queue`
   - Mount target volume and restore `appendonlydir/` and `dump.rdb`.
   - Start container: `docker compose up -d redis-queue`
   - Redis automatically replays the AOF log, reconstructing exact BullMQ queue positions and waiting job states.
   - Backend BullMQ workers automatically resume processing pending jobs without duplicates.

---

## 4. Resource Boundaries & Sizing Guidelines

| Component | Default Quota | Recommended Production Quota | Monitoring Metric |
|---|---|---|---|
| `redis` (Cache) RAM | `256mb` | `512mb - 2gb` | `used_memory_rss`, `evicted_keys` |
| `redis-queue` RAM | `256mb` | `512mb - 1gb` | `used_memory`, queue depth (`LLEN`) |
| Redis CPU | 0.5 cores | 1.0 - 2.0 cores | `used_cpu_user_children` |
| TCP Backlog | 511 | 511 | `rejected_connections` |
| Keepalive | 300s | 300s | Socket connection drops |
