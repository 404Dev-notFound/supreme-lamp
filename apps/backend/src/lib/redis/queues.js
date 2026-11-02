/**
 * Centralized BullMQ Background Processing & Queue Manager
 * FlowCTRL Production Infrastructure Layer
 *
 * Enforces zero-false-queuing contract:
 * - When Redis is online, jobs are durably queued in BullMQ with exponential backoff & dead-letter retention.
 * - When Redis is offline, jobs are never falsely acknowledged as queued; they either execute
 *   via synchronous durable fallback with explicit status or throw a controlled error.
 */

const { Queue, Worker } = require("bullmq");
const { REDIS_CONFIG } = require("./config");
const { createDedicatedClient, isRedisAvailable } = require("./client");
const { redisMetrics } = require("./metrics");

// Active BullMQ Queues and Workers registry
const activeQueues = new Map();
const activeWorkers = new Map();
const registeredProcessors = new Map();

// Standard default job configuration
const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 2000,
  },
  removeOnComplete: {
    count: 200,
    age: 24 * 3600, // 24 hours
  },
  removeOnFail: {
    count: 1000, // Retain up to 1,000 failed jobs for auditing/retry
    age: 7 * 24 * 3600, // 7 days dead-letter retention
  },
  timeout: 60000, // 60 seconds maximum execution duration
};

// Standard queue names
const QUEUE_NAMES = {
  RESUME_ANALYSIS: "resume-analysis",
  NOTIFICATIONS: "notifications",
  RAG_INDEXING: "rag-indexing",
  CACHE_INVALIDATION: "cache-invalidation",
};

/**
 * Initialize or get a BullMQ Queue
 */
function getQueue(name) {
  if (activeQueues.has(name)) {
    return activeQueues.get(name);
  }

  if (isRedisAvailable()) {
    try {
      const connection = createDedicatedClient(`queue:${name}`);
      if (connection) {
        const queue = new Queue(name, {
          connection,
          prefix: `${REDIS_CONFIG.keyPrefix}${REDIS_CONFIG.namespaces.QUEUE}`,
          defaultJobOptions: DEFAULT_JOB_OPTIONS,
        });

        activeQueues.set(name, queue);
        return queue;
      }
    } catch (err) {
      console.warn(`[BullMQ] Could not create queue '${name}': ${err.message}.`);
    }
  }

  return null;
}

/**
 * Register a Worker for processing background jobs
 */
function registerWorker(name, processor, options = {}) {
  // Always register the processor function for potential synchronous fallback
  registeredProcessors.set(name, processor);

  if (isRedisAvailable()) {
    try {
      const connection = createDedicatedClient(`worker:${name}`);
      if (connection) {
        const worker = new Worker(name, processor, {
          connection,
          prefix: `${REDIS_CONFIG.keyPrefix}${REDIS_CONFIG.namespaces.QUEUE}`,
          concurrency: options.concurrency || 3,
          ...options,
        });

        worker.on("completed", (job) => {
          if (process.env.NODE_ENV !== "test") {
            console.log(`[Worker:${name}] Job ${job.id} (${job.name}) completed.`);
          }
        });

        worker.on("failed", (job, err) => {
          console.error(
            `[Worker:${name}] Job ${job?.id} failed (${err.message}). Attempt ${job?.attemptsMade}/${job?.opts?.attempts || 3}.`
          );
        });

        worker.on("error", (err) => {
          if (process.env.NODE_ENV !== "test") {
            console.warn(`[Worker:${name}] Operational error: ${err.message}`);
          }
        });

        activeWorkers.set(name, worker);
        return worker;
      }
    } catch (err) {
      console.warn(`[BullMQ] Could not start worker '${name}': ${err.message}.`);
    }
  }

  return null;
}

/**
 * Dispatch a job to the queue, or execute synchronously if Redis is offline
 * Strictly obeys the zero-false-queuing guarantee.
 */
async function dispatchJob(queueName, jobName, data = {}, options = {}) {
  // 1. If Redis is available, enqueue durably into BullMQ
  if (isRedisAvailable()) {
    const queue = getQueue(queueName);
    if (queue) {
      try {
        const job = await queue.add(jobName, data, options);
        return {
          id: job.id,
          name: jobName,
          queued: true,
          synchronous: false,
          mode: "durable_queue",
          degraded: false,
          timestamp: Date.now(),
        };
      } catch (queueErr) {
        console.warn(`[BullMQ] Dispatch error on queue '${queueName}': ${queueErr.message}. Falling back.`);
      }
    }
  }

  // 2. Redis is down or unavailable: Never lie about successful queuing
  redisMetrics.recordFallback();
  redisMetrics.recordDegradedJob();

  const processor = registeredProcessors.get(queueName);
  if (processor && options.allowSynchronousFallback !== false) {
    // Execute synchronously with explicit status reporting
    const syntheticJob = {
      id: null,
      name: jobName,
      data,
      attemptsMade: 1,
      timestamp: Date.now(),
      isSynchronousFallback: true,
    };

    try {
      const result = await processor(syntheticJob);
      return {
        id: null,
        name: jobName,
        queued: false,
        synchronous: true,
        mode: "synchronous_fallback",
        degraded: true,
        success: true,
        result,
        timestamp: Date.now(),
      };
    } catch (procErr) {
      return {
        id: null,
        name: jobName,
        queued: false,
        synchronous: true,
        mode: "synchronous_fallback",
        degraded: true,
        success: false,
        error: procErr.message,
        timestamp: Date.now(),
      };
    }
  }

  // 3. No handler available and Redis is offline: report degraded failure explicitly
  const failureErr = new Error(
    `Background queue service for '${queueName}' is degraded and cannot accept asynchronous jobs.`
  );
  failureErr.code = "QUEUE_DEGRADED";
  failureErr.statusCode = 503;
  throw failureErr;
}

/**
 * Gracefully close all BullMQ workers and queues
 */
async function closeQueuesAndWorkers() {
  for (const [name, worker] of activeWorkers.entries()) {
    try {
      await worker.close();
    } catch {
      // Ignore worker close errors during shutdown
    }
  }
  activeWorkers.clear();

  for (const [name, queue] of activeQueues.entries()) {
    try {
      await queue.close();
    } catch {
      // Ignore queue close errors during shutdown
    }
  }
  activeQueues.clear();
}

/**
 * Specific helper dispatches for common operations
 */
const jobDispatchers = {
  async dispatchResumeAnalysis(data) {
    return dispatchJob(QUEUE_NAMES.RESUME_ANALYSIS, "analyze-resume", data, {
      priority: data.isUrgent ? 1 : 5,
    });
  },

  async dispatchNotification(data) {
    return dispatchJob(QUEUE_NAMES.NOTIFICATIONS, "send-notification", data);
  },

  async dispatchRagIndexing(data) {
    return dispatchJob(QUEUE_NAMES.RAG_INDEXING, "index-knowledge", data);
  },

  async dispatchCacheInvalidation(pattern) {
    return dispatchJob(QUEUE_NAMES.CACHE_INVALIDATION, "invalidate-pattern", { pattern });
  },
};

module.exports = {
  QUEUE_NAMES,
  DEFAULT_JOB_OPTIONS,
  getQueue,
  registerWorker,
  dispatchJob,
  closeQueuesAndWorkers,
  jobDispatchers,
  registeredProcessors,
};
