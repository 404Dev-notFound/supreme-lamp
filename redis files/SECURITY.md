# flowCTRL Redis Security Architecture & Hardening

## 1. Threat Model & Security Posture

Redis is an in-memory data store with high computational throughput. If improperly configured, Redis can be vulnerable to unauthorized remote code execution, unauthenticated data dumping, denial of service (DoS), cross-tenant leakage, or credential exfiltration.

flowCTRL implements multi-layered security controls comparable to Google Cloud Memorystore, AWS ElastiCache, and Azure Cache for Redis production standards.

---

## 2. Hardening Measures Implemented

### 2.1 Docker Internal Bridge Networking & Binding
- In `docker-compose.yml`, the Redis service is configured with:
  ```yaml
  command: >
    redis-server
    --bind 0.0.0.0
    --protected-mode yes
    --requirepass ${REDIS_PASSWORD:-redispassword9555}
  ```
- **Internal Interface Listening**: Binding to `0.0.0.0` inside the container ensures Redis listens on the virtual bridge interface (`eth0`) accessible to authorized application containers (`backend`) via service discovery (`redis:6379`).
- **Protected Mode & Auth**: Protected mode is actively enabled with `--requirepass`.
- **Host Port Exposure**: Host port publishing is strictly restricted to the loopback interface (`127.0.0.1:6379:6379`) for local development only and must never be exposed to `0.0.0.0`.
- **Network Segmentation**: Redis is isolated within the private bridge network `flowctrl_internal`.

### 2.2 Mandatory Authentication (`requirepass`)
- Redis requires password authentication on every connection via `--requirepass`.
- Credentials must be passed through `REDIS_PASSWORD` from environment variables.
- Blank passwords in production trigger immediate startup rejection.

### 2.3 Non-Root Container Execution
- In `docker-compose.yml`, Redis is executed with `security_opt: ["no-new-privileges:true"]`.
- The Redis alpine container runs under an unprivileged `redis` UID (UID 999), preventing container escape attacks.

### 2.4 Prevention of Dangerous Redis Commands
In production environments, dangerous commands that inspect or mutate the entire keyspace are guarded:
- `FLUSHALL` -> disabled / renamed to unguessable hash.
- `FLUSHDB` -> disabled.
- `KEYS` -> prohibited in application code (flowCTRL codebase strictly uses non-blocking `SCAN` with cursor counts).
- `CONFIG` -> restricted to container admin.
- `DEBUG` -> disabled.

### 2.5 Sensitive Data Isolation & Sanitization
- **No Raw Secrets in Redis**: Passwords, bcrypt hashes, raw JWT signing keys, and plaintext credit card numbers are strictly prohibited from being cached in Redis.
- **Session Keys**: Cached sessions use a partial token hash (`token.slice(-24)`) as the key identifier rather than the raw bearer token, minimizing token exposure in Redis monitor logs.
- **Precision Invalidation**: When a user logs out of all devices, only that specific user's active session tokens are invalidated and tombstoned, rather than flushing all users' active sessions.
- **Authoritative PostgreSQL Validation**: Session authorization checks ALWAYS fall back to PostgreSQL (`UserSession.revokedAt` and `expiresAt`) on cache misses or when Redis is offline. Access is never blindly assumed or granted.

### 2.6 Distributed Rate Limiting & Fail-Closed Policy
- **Sensitive Endpoints (`authRateLimiter`, `userMutationRateLimiter`)**:
  - Configured with `failureMode: "fail-closed"`.
  - If Redis fails and local memory limiter is saturated or corrupted, requests are safely blocked (HTTP 429 / 503) rather than allowed to pass through unmetered. This prevents credential stuffing and brute-force attacks during infrastructure degradation.
- **Public Endpoints (`globalApiRateLimiter`)**:
  - Configured with `failureMode: "fail-open"`.
  - Ensures public read availability is maintained even during rate limiter degradation.

### 2.7 RAG AI Cache Isolation & Cross-Tenant Leakage Prevention
In `RAG/python_rag/retriever.py`, retrieval cache keys are deterministically generated:
```text
fc:rag:retrieval:<tenant_scope>:<auth_scope>:<sha256_digest>
```
The digest cryptographically incorporates:
1. `normalized_query`: lowercased, whitespace-collapsed.
2. `tenant_scope`: organization or workspace identifier.
3. `authorization_scope`: user role and tier (e.g., standard vs premium).
4. `collection_name`: vector store target (e.g., roadmaps).
5. `document_version`: version of curriculum / document knowledge base.
6. `embedding_version`: version of embedding model.
7. `top_k` and `similarity_threshold`: retrieval hyperparameters.
8. `filters`: deterministic sorted JSON metadata filters.

This mathematical isolation guarantees that two users with different permission tiers or organizations searching identical queries will **never** share the same cache key or leak proprietary curriculum.
