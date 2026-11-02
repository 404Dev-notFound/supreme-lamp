# flowCTRL Redis Monitoring & Observability Guide

## 1. Monitoring Endpoints

flowCTRL exposes dedicated health, readiness, and Redis telemetry probes for load balancers, Prometheus scrapers, and operational monitoring:

### 1.1 Dedicated Redis Health Probe: `GET /api/health/redis`
Returns granular telemetry from both the primary Redis connection and the in-memory fallback engine.
**Zero credential leakage guarantee**: Contains only operational counters and memory statistics; no passwords, connection strings, or user PII.

#### Connected Response (Normal Operation):
```json
{
  "success": true,
  "data": {
    "status": "connected",
    "available": true,
    "degraded": false,
    "mode": "distributed_redis",
    "latencyMs": 0.85,
    "clientStatus": "ready",
    "server": {
      "version": "7.2.4",
      "mode": "standalone",
      "usedMemory": "14.28M",
      "usedMemoryPeak": "16.85M",
      "connectedClients": 4,
      "totalCommands": 18452
    },
    "cacheMetrics": {
      "uptimeSeconds": 1420,
      "totalLookups": 894,
      "hits": 812,
      "misses": 82,
      "hitRatePercent": 90.83,
      "sets": 94,
      "deletes": 12,
      "errors": 0,
      "fallbackCount": 0,
      "raceConditionsPrevented": 3,
      "degradedJobsCount": 0,
      "lastLatencyMs": 0.85,
      "commandCount": 1000
    },
    "memoryFallbackEntries": 0
  }
}
```

#### Degraded Response (Redis Offline / Outage):
```json
{
  "success": true,
  "data": {
    "status": "degraded",
    "available": false,
    "degraded": true,
    "mode": "resilient_fallback",
    "latencyMs": null,
    "clientStatus": "disconnected",
    "server": null,
    "cacheMetrics": {
      "uptimeSeconds": 1450,
      "totalLookups": 1120,
      "hits": 950,
      "misses": 170,
      "hitRatePercent": 84.82,
      "sets": 110,
      "deletes": 14,
      "errors": 1,
      "fallbackCount": 42,
      "raceConditionsPrevented": 5,
      "degradedJobsCount": 2,
      "lastLatencyMs": 0,
      "commandCount": 1120
    },
    "memoryFallbackEntries": 86
  }
}
```

### 1.2 General Health Check: `GET /api/health`
Accurately reports `status: "healthy"` or `status: "degraded"`:
```json
{
  "status": "healthy",
  "message": "flowCTRL API is running",
  "uptime": 1420,
  "timestamp": "2026-11-03T02:00:00.000Z",
  "redis": "connected",
  "degraded": false
}
```
During an outage:
```json
{
  "status": "degraded",
  "message": "flowCTRL API is running in resilient degraded mode (Redis offline)",
  "uptime": 1420,
  "timestamp": "2026-11-03T02:00:00.000Z",
  "redis": "degraded_fallback",
  "degraded": true
}
```

### 1.3 Readiness Probe: `GET /api/ready`
Verifies both PostgreSQL database connectivity and Redis status before traffic routing:
```json
{
  "status": "ready",
  "database": "connected",
  "redis": "connected",
  "degraded": false,
  "memoryUsage": "78MB"
}
```

---

## 2. Key Metrics & Alert Thresholds

| Metric | Target Normal | Warning Threshold | Critical Alert | Mitigation |
|---|---|---|---|---|
| Cache Hit Rate | > 80% | < 60% | < 40% | Inspect TTLs, check for excessive invalidations |
| Redis Latency | < 2.0 ms | > 10.0 ms | > 50.0 ms | Inspect slow commands with `SLOWLOG GET` |
| Connection Status | `ready` | `reconnecting` | `disconnected` | Verify Redis container health & network |
| Degraded Flag | `false` | - | `true` | Redis is unreachable; running in fallback mode |
| Race Conditions Prevented | Counter | Increasing rapidly | Saturated | Concurrent updates during reads being intercepted |
| Used Memory | < 180 MB | > 220 MB | > 245 MB (of 256MB) | Check key TTL expirations, verify LRU eviction |
| Fallback Count | 0 | > 5 / min | > 50 / min | Redis is failing over to local memory store |
| BullMQ Failed Jobs | 0 | > 10 / hr | > 50 / hr | Inspect worker error logs and microservices |

---

## 3. Redis CLI Monitoring Commands

When triaging a live Redis container:

```bash
# Check ping and server responsiveness (without exposing password in bash history)
redis-cli -a "<REDIS_PASSWORD>" --no-auth-warning ping

# Inspect real-time memory usage
redis-cli -a "<REDIS_PASSWORD>" --no-auth-warning info memory

# View slow command execution log
redis-cli -a "<REDIS_PASSWORD>" --no-auth-warning slowlog get 10

# Inspect active client connections
redis-cli -a "<REDIS_PASSWORD>" --no-auth-warning client list

# Check total key count per database
redis-cli -a "<REDIS_PASSWORD>" --no-auth-warning dbsize
```
