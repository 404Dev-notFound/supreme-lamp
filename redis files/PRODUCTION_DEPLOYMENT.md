# flowCTRL Redis Production Deployment & Operations

## 1. Production Topologies

Depending on cluster size and deployment environment, flowCTRL supports three operational Redis architectures:

### 1. Single Node with Persistent Storage (Standard Docker Compose)
- **Deployment**: Single container running `redis:7-alpine`.
- **Persistence**: Hybrid RDB snapshots (`save 900 1`, `save 300 10`) backed by Docker volume `flowctrl_redis_data`.
- **Use Case**: Small to medium single-host deployments.

### 2. Managed Redis (AWS ElastiCache / Google Cloud Memorystore / Upstash)
- **Deployment**: Serverless or multi-AZ cluster.
- **TLS**: `REDIS_TLS=true` enables encrypted transport in transit.
- **High Availability**: Automated multi-AZ failover and replication.
- **Connection**: `REDIS_URL=rediss://default:token@cluster.cache.amazonaws.com:6379`.

### 3. Redis Sentinel / Primary-Replica
- **Deployment**: 1 primary node + 2 read replicas + 3 Sentinel nodes.
- **Failover**: Automated primary election within < 3 seconds.
- **ioredis Support**: Native support via `sentinels` array configuration.

---

## 2. Production Docker Deployment Checklist

Before launching in production:

1. **Change Default Credentials**:
   Generate a cryptographic 64-character password:
   ```bash
   openssl rand -hex 32
   ```
   Set this value in production `.env` as `REDIS_PASSWORD`. Never deploy with default passwords.

2. **Verify Memory Eviction**:
   Confirm `--maxmemory 256mb` (or node-calibrated quota) and `--maxmemory-policy allkeys-lru` are active in container command flags.

3. **Verify Internal Network Isolation**:
   Confirm the `redis` container is connected only to `flowctrl_internal`. Do not bind port 6379 to `0.0.0.0`.

4. **Verify Backend Healthcheck Dependency**:
   Ensure `backend` in `docker-compose.yml` specifies:
   ```yaml
   depends_on:
     postgres:
       condition: service_healthy
     redis:
       condition: service_healthy
   ```

5. **Backup & Disaster Recovery**:
   RDB snapshot file `/data/dump.rdb` should be backed up periodically to secure cloud object storage (S3 / GCS) alongside PostgreSQL daily `pg_dump` backups.

