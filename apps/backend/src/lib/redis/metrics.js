/**
 * Redis Observability & Cache Performance Metrics
 * FlowCTRL Production Infrastructure Layer
 */

class RedisMetricsTracker {
  constructor() {
    this.hits = 0;
    this.misses = 0;
    this.sets = 0;
    this.deletes = 0;
    this.errors = 0;
    this.fallbackCount = 0;
    this.raceConditionsPrevented = 0;
    this.degradedJobsCount = 0;
    this.lastLatencyMs = 0;
    this.commandCount = 0;
    this.startTime = Date.now();
  }

  recordHit() {
    this.hits++;
    this.commandCount++;
  }

  recordMiss() {
    this.misses++;
    this.commandCount++;
  }

  recordSet() {
    this.sets++;
    this.commandCount++;
  }

  recordDelete() {
    this.deletes++;
    this.commandCount++;
  }

  recordError() {
    this.errors++;
  }

  recordFallback() {
    this.fallbackCount++;
  }

  recordRaceConditionPrevented() {
    this.raceConditionsPrevented++;
  }

  recordDegradedJob() {
    this.degradedJobsCount++;
  }

  recordLatency(ms) {
    this.lastLatencyMs = Math.round(ms * 100) / 100;
  }

  getStats() {
    const totalLookups = this.hits + this.misses;
    const hitRate = totalLookups > 0 ? (this.hits / totalLookups) * 100 : 0;
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);

    return {
      uptimeSeconds,
      totalLookups,
      hits: this.hits,
      misses: this.misses,
      hitRatePercent: Math.round(hitRate * 100) / 100,
      sets: this.sets,
      deletes: this.deletes,
      errors: this.errors,
      fallbackCount: this.fallbackCount,
      raceConditionsPrevented: this.raceConditionsPrevented,
      degradedJobsCount: this.degradedJobsCount,
      lastLatencyMs: this.lastLatencyMs,
      commandCount: this.commandCount,
    };
  }

  reset() {
    this.hits = 0;
    this.misses = 0;
    this.sets = 0;
    this.deletes = 0;
    this.errors = 0;
    this.fallbackCount = 0;
    this.raceConditionsPrevented = 0;
    this.degradedJobsCount = 0;
    this.lastLatencyMs = 0;
    this.commandCount = 0;
    this.startTime = Date.now();
  }
}

const redisMetrics = new RedisMetricsTracker();

module.exports = {
  redisMetrics,
  RedisMetricsTracker,
};

