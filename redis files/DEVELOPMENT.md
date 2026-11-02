# flowCTRL Redis Developer Guide & Local Workflow

## 1. Local Development Modes

flowCTRL supports two seamless development modes:

### Mode 1: Hybrid Development with Local Redis (Recommended)
You run a local Redis instance (via Docker or standalone binary) on port 6379:
1. Start Redis in Docker:
   ```bash
   docker compose up -d redis
   ```
2. Configure `.env`:
   ```env
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=redispassword9555
   REDIS_KEY_PREFIX=fc:
   ```
3. Start the Express backend:
   ```bash
   npm start --workspace=backend
   ```
4. Check console for confirmation:
   `[Redis] Connected and ready on localhost:6379 (db: 0).`

---

### Mode 2: Zero-Dependency Development (Without Redis)
If you do not have Docker or Redis installed on your local workstation:
1. Leave `REDIS_URL` or `REDIS_PASSWORD` blank or stop Redis.
2. Start the Express backend:
   ```bash
   npm start --workspace=backend
   ```
3. The backend logs:
   `[Redis] Connection warning (). Safe in-memory fallback is active.`
4. All features—Roadmaps catalog, Premium tracks, Job search, ATS analysis, Rate limiting, and Auth sessions—run **100% locally** using the high-speed in-memory store and inline queue emulator.
5. Zero crashes, zero blocked workflows!

---

## 2. Using the Cache in New Services

Always import `cache` and `buildKey` from `../lib/redis`:

```javascript
const { cache, buildKey, REDIS_CONFIG } = require("../lib/redis");

async function getProjectById(projectId) {
  // 1. Build namespaced key: fc:projects:detail:<id>
  const cacheKey = buildKey("projects", "detail", projectId);

  // 2. Use stampede-proof getOrSet with 10-minute TTL
  return cache.getOrSet(
    cacheKey,
    async () => {
      // 3. Authoritative PostgreSQL query
      return prisma.project.findUnique({
        where: { id: projectId },
        include: { members: true, issues: true },
      });
    },
    600 // TTL in seconds
  );
}

async function updateProject(projectId, data) {
  // 1. Commit mutation to PostgreSQL first!
  const updated = await prisma.project.update({
    where: { id: projectId },
    data,
  });

  // 2. Invalidate cache after successful commit
  await cache.del(buildKey("projects", "detail", projectId));
  await cache.delPattern(buildKey("projects", "list", "*"));

  return updated;
}
```

---

## 3. Adding a Background BullMQ Job

```javascript
const { queues } = require("../lib/redis");

// 1. Register a worker in your service file
queues.registerWorker(queues.QUEUE_NAMES.RESUME_ANALYSIS, async (job) => {
  const { resumeId } = job.data;
  // Execute heavy task
  return performHeavyCalculation(resumeId);
});

// 2. Dispatch a job from a controller
await queues.dispatch.dispatchResumeAnalysis({
  resumeId: "res-123",
  userId: "user-456",
  isUrgent: true,
});
```

