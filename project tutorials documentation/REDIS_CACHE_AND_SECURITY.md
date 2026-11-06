# Redis Caching & Security Architecture

## 1. Overview
The **Project-Building Tutorials** subsystem employs a multi-tiered caching and security design engineered to maximize throughput, prevent Cache Stampede (thundering herd), eliminate cross-user cache contamination, and enforce strict Authorization & Input Validation boundaries.

---

## 2. Redis Caching Architecture

### 2.1 Namespace & Key Schema
All cache keys follow the flowCTRL standard Redis namespace prefix convention configured in `apps/backend/src/lib/redis/config.js`:
`REDIS_CONFIG.namespaces.PROJECT_TUTORIALS = 'fc:project_tutorials'`

| Data Target | Redis Key Pattern | TTL | Invalidation Trigger |
| :--- | :--- | :--- | :--- |
| **Category List** | `fc:project_tutorials:categories` | 86,400s (24h) | Schema/content seeding or admin modification |
| **Language List** | `fc:project_tutorials:languages` | 86,400s (24h) | Schema/content seeding or admin modification |
| **Filtered Catalog** | `fc:project_tutorials:list:<md5_query_hash>` | 1,800s (30m) | Content mutation, new tutorial publication |
| **Project Detail** | `fc:project_tutorials:detail:<slug>` | 1,800s (30m) | Tutorial blueprint/step updates |

### 2.2 Stampede-Proof Cache-Aside Implementation
Tutorial catalog and detail queries utilize flowCTRL's centralized `cache.getOrSet` wrapper:
```javascript
const cacheKey = `list:${hashQuery(params)}`;
const cached = await cache.getOrSet(
  REDIS_CONFIG.namespaces.PROJECT_TUTORIALS,
  cacheKey,
  async () => {
    return await fetchFromPostgreSQL(params);
  },
  REDIS_CONFIG.ttl.PROJECT_TUTORIALS_CATALOG
);
```
- **Thundering Herd Mitigation:** If a key expires or is missing under high concurrent load, single-flight resolution prevents multiple simultaneous database round-trips.
- **Fail-Safe Graceful Degradation:** When Redis is unreachable or undergoing maintenance, `MemoryFallbackStore` safely services or bypasses caching without throwing uncaught exceptions or terminating the Express process.

### 2.3 Zero Cross-User Cache Leakage Architecture
**Critical Architectural Invariant:** User progress, step completion state, and bookmark statuses **MUST NEVER** be embedded into public Redis cache keys.
1. The public project blueprint (metadata, steps, code snippets, resources) is read directly from the Redis cache (`fc:project_tutorials:detail:<slug>`).
2. If `req.user` is present in the request context, the service queries PostgreSQL specifically for the requesting user's `UserProjectProgress` and `UserProjectStepProgress` records.
3. The cached public tutorial data and the user's progress records are combined **in-memory within the service layer** before serializing the JSON response.
4. Unauthenticated users receive the cached public blueprint with `userProgress: null` and `isBookmarked: false`.
5. This guarantees that User A's progress can never be leaked to User B through Redis caching.

---

## 3. Security Architecture & Threat Mitigation

### 3.1 Authentication & Authorization Matrix

| Endpoint | Method | Middleware | Auth Requirement | Authorization Rule |
| :--- | :--- | :--- | :--- | :--- |
| `/api/project-tutorials` | GET | `optionalAuth` | Optional | Public access; if authenticated, merges user progress |
| `/api/project-tutorials/categories` | GET | `optionalAuth` | Optional | Public access |
| `/api/project-tutorials/languages` | GET | `optionalAuth` | Optional | Public access |
| `/api/project-tutorials/:slug` | GET | `optionalAuth` | Optional | Public access; merges user progress & bookmarks if authenticated |
| `/api/project-tutorials/user/my-progress` | GET | `requireAuth` | Mandatory (401 if missing) | Returns records filtered strictly by `userId === req.user.id` |
| `/api/project-tutorials/user/bookmarks` | GET | `requireAuth` | Mandatory (401 if missing) | Returns records filtered strictly by `userId === req.user.id` |
| `/api/project-tutorials/:id/start` | POST | `requireAuth` | Mandatory (401 if missing) | Upserts progress record strictly for `req.user.id` |
| `/api/project-tutorials/:id/steps/:stepNumber` | PUT | `requireAuth` | Mandatory (401 if missing) | Validates step number, updates step completion for `req.user.id` |
| `/api/project-tutorials/:id/complete` | POST | `requireAuth` | Mandatory (401 if missing) | Sets project completion status for `req.user.id` |
| `/api/project-tutorials/:id/bookmark` | POST | `requireAuth` | Mandatory (401 if missing) | Toggles bookmark record strictly for `req.user.id` |

### 3.2 Insecure Direct Object Reference (IDOR) Prevention
- In all mutation endpoints (`:id/start`, `:id/steps/:stepNumber`, `:id/complete`, `:id/bookmark`), the backend does not accept a `userId` in the request body or query parameter.
- The user identifier is derived exclusively from the cryptographically verified JWT session in `req.user.id`.
- Users cannot read or manipulate another user's progress records.

### 3.3 Strict Input Validation (Zod)
All client inputs undergo schema validation before reaching the database:
- **`listTutorialsQuerySchema`**:
  - `page`: Coerced positive integer, minimum 1.
  - `limit`: Coerced positive integer, maximum 50 (prevents unbounded memory consumption).
  - `search`: Trimmed string, sanitized.
  - `category`: Sanitized slug string.
  - `language`: Sanitized string.
  - `difficulty`: Whitelisted enum (`BEGINNER`, `INTERMEDIATE`, `ADVANCED`).
  - `sortBy`: Whitelisted enum (`popular`, `newest`, `rating`, `difficulty`).
- **`stepProgressUpdateSchema`**:
  - `completed`: Strict boolean.
  - `notes`: String up to 2000 characters.
  - `timeSpentMinutes`: Non-negative integer.

### 3.4 Rate Limiting & Denial of Service Protection
- Public catalog endpoints are protected by flowCTRL's distributed rate-limiting middleware backed by Redis.
- Pagination limits (`limit <= 50`) prevent memory exhaustion attacks.
- Search queries are sanitized and parameterized in Prisma to eliminate SQL injection vulnerabilities.

### 3.5 Content Sanitization & XSS Defense
- All code snippets, objectives, instructions, and descriptions are rendered as structured React components with explicit escaping.
- No raw `dangerouslySetInnerHTML` is used in tutorial rendering.
- Markdown links in external resources are restricted to valid HTTP/HTTPS schemes with `target="_blank"` and `rel="noopener noreferrer"`.

