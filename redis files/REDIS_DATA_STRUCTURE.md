# flowCTRL Redis Data Structures & Key Taxonomy

## 1. Key Naming Convention

All Redis keys in flowCTRL adhere strictly to a standardized, colon-delimited hierarchical format:

```text
fc:<namespace>:<entity>:<identifier_or_query_hash>
```

- `fc:` - Global system prefix (configurable via `REDIS_KEY_PREFIX`).
- `<namespace>` - High-level domain boundary (`roadmaps`, `premium`, `jobs`, `stats`, `session`, `rl`, `rag`, `catalog`, `queue`).
- `<entity>` - Sub-resource or query type (`catalog`, `detail`, `list`, `user`, `aggregate`).
- `<identifier_or_query_hash>` - Unique ID, slug, or hashed parameter string.

---

## 2. Key Taxonomy & Data Type Map

| Key Pattern | Redis Type | Description | Sample TTL | Authoritative Source |
|---|---|---|---|---|
| `fc:roadmaps:catalog:<filter_hash>` | String (JSON) | Filtered or full roadmaps catalog | 3,600s (1 hour) | PostgreSQL `Roadmap` / `@flowctrl/roadmap-data` |
| `fc:roadmaps:detail:<slug>:<isPremium>` | String (JSON) | Complete roadmap nodes and topic graph | 3,600s (1 hour) | PostgreSQL `PremiumResource` / JSON |
| `fc:roadmaps:topic:<slug>:<topicId>` | String (JSON) | Granular topic details, resources, and markdown | 3,600s (1 hour) | `@flowctrl/roadmap-data` |
| `fc:premium:list:<filter_hash>` | String (JSON) | Curated premium curriculums catalog | 3,600s (1 hour) | PostgreSQL `PremiumResource` |
| `fc:premium:detail:<slug>:<isPremium>` | String (JSON) | Premium masterclass with modules/prerequisites | 1,800s (30 min) | PostgreSQL `PremiumResource` |
| `fc:premium:categories:all` | String (JSON) | Full list of resource categories | 86,400s (24 hr) | PostgreSQL `ResourceCategory` |
| `fc:stats:platform:aggregate` | String (JSON) | Mission Control aggregated metrics | 60s (1 min) | PostgreSQL `User`, `Job`, `Project` counts |
| `fc:jobs:list:<filter_hash>` | String (JSON) | Filtered and paginated job postings | 300s (5 min) | PostgreSQL `Job`, `Company`, `JobSkill` |
| `fc:jobs:detail:<jobId>` | String (JSON) | Single job posting detail | 600s (10 min) | PostgreSQL `Job` |
| `fc:catalog:categories:all` | String (JSON) | Skill categories and taxonomy | 3,600s (1 hour) | PostgreSQL `Category` |
| `fc:catalog:skills:<filter_hash>` | String (JSON) | Paginated and filtered skills | 3,600s (1 hour) | PostgreSQL `Skill` |
| `fc:session:<token_suffix>` | String (JSON) | L1 hot session validation cache | 300s (5 min) | PostgreSQL `UserSession`, `User` |
| `fc:revoked:<token_suffix>` | String ("true") | Revoked session tombstone marker | 3,600s (1 hour) | PostgreSQL `UserSession.revokedAt` |
| `fc:rl:<rate_limit_key>` | String (Integer) | Sliding-window request counter | 60 - 900s | Redis atomic INCR counter |
| `fc:rag:user:<userId>` | String (JSON) | User's active personalized RAG profile | 600s (10 min) | PostgreSQL `UserPreference.customSettings` |
| `fc:rag:retrieval:<hash>:<top_k>` | String (JSON) | Python LangChain vector search results | 1,800s (30 min) | RAG `JSONVectorStore` |
| `fc:queue:<queue_name>:*` | Hash / Stream / ZSet | BullMQ internal job states (waiting, active, failed) | Managed by BullMQ | Ephemeral queue store |

---

## 3. Serialization Standards

- **JSON Strings**: Complex nested structures (roadmaps, jobs, user sessions) are serialized with `JSON.stringify()` and parsed with `JSON.parse()`.
- **Atomic Counters**: Rate limiters and command counters use native 64-bit signed Redis integers via `INCR`, `INCRBY`, and `TTL`.
- **Tombstones**: Revocation markers use lightweight boolean strings (`"true"`) with aggressive TTLs to minimize memory overhead.
- **Hash / Parameter Normalization**: Filter combinations for catalogs and jobs are sorted and concatenated before key formation to prevent cache fragmentation (e.g. `1:20:react:remote::all:true:newest`).

