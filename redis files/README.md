# flowCTRL Redis Centralized Infrastructure Layer

## 1. Executive Summary

This directory contains the authoritative architecture, configuration, operational procedures, security controls, and testing specifications for the centralized **Redis infrastructure layer** in `flowCTRL`.

The Redis infrastructure is engineered to Google, Microsoft, and Apple production standards to provide:
1. **High-Throughput Cache-Aside Layer**: Sub-millisecond reads for roadmaps, premium curriculums, job postings, public catalogs, and admin platform metrics.
2. **Stampede-Proof Mutex Protection**: Single-flight promise memoization that prevents database dogpiling and cache stampedes under high concurrency.
3. **Asynchronous Background Processing**: Production-grade BullMQ queues with exponential backoff retries, timeouts, and worker lifecycles for resume ATS evaluation, notifications, RAG document indexing, and cache invalidation.
4. **Distributed Atomic Rate Limiting**: Centralized sliding-window counters protecting authentication endpoints, public APIs, and AI microservice routes.
5. **Session Validation & Revocation Acceleration**: Ultra-low-latency session caching with instant tombstone revocation while maintaining PostgreSQL as the authoritative identity store.
6. **Zero-Downtime Resilience**: Transparent in-memory fallback store and inline queue executor that ensures 100% platform availability if Redis is offline or undergoing maintenance.

---

## 2. Directory Structure

```text
flowCTRL/redis files/
│
├── README.md                   # Infrastructure index, overview, and navigation guide
├── REDIS_ARCHITECTURE.md       # Distributed system architecture, connection pooling, and lifecycle
├── REDIS_CONFIGURATION.md      # Environment parameters, retry policies, timeouts, and options
├── REDIS_DATA_STRUCTURE.md     # Key naming taxonomy, types (Strings, Hashes, Sets, Sorted Sets)
├── CACHE_STRATEGY.md           # Cache-aside patterns, TTL presets, and invalidation triggers
├── QUEUE_ARCHITECTURE.md       # BullMQ queues, workers, concurrency, retries, and dead-letters
├── SECURITY.md                 # Network isolation, AUTH, TLS, non-root Docker, and sanitization
├── PERFORMANCE.md              # Latency benchmarks, single-flight mutex, and memory optimization
├── MONITORING.md               # Telemetry, cache hit/miss tracking, and /api/health/redis diagnostics
├── TROUBLESHOOTING.md          # Failure modes, disaster recovery, memory exhaustion, and latency triage
├── DEVELOPMENT.md              # Local setup, running with or without Redis, and workflows
├── PRODUCTION_DEPLOYMENT.md    # Docker Compose, clustering, persistence (AOF/RDB), and replication
└── TESTING.md                  # Verification suite, unit tests, and fault injection protocols
```

---

## 3. Core Principles

- **PostgreSQL is Authoritative**: Redis never serves as the primary data store for permanent business records. Successful PostgreSQL transaction commits always precede cache updates or background jobs.
- **Single Connection Manager**: All backend components share the centralized `apps/backend/src/lib/redis/` package. No ad-hoc `ioredis` instances are permitted.
- **Fail-Open with Bound Fallback**: Operational failures in Redis degrade gracefully to an in-memory LRU/Map store without dropping user requests or leaking credentials.
- **Zero Secrets in Repository**: No credentials, passwords, or production keys are stored in source code or documentation. All secrets are injected at runtime via environment variables.

