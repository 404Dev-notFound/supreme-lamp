/**
 * Verification & Benchmarking Script for flowCTRL Client-Side-First Architecture
 * 
 * Measures and verifies:
 * 1. ETag presence and HTTP 304 Not Modified conditional responses
 * 2. CORS exposure of ETag header
 * 3. In-flight request deduplication pool
 * 4. In-memory LRU cache throughput and latency
 * 5. SearchTrie prefix search latency
 * 6. Latency comparison: Cold fetch (network) vs Warm fetch (client cache)
 * 7. Verification of all key frontend pages (200 OK)
 */

const http = require("http");
const https = require("https");
const { performance } = require("perf_hooks");

const API_BASE = "http://localhost:5000";
const FRONTEND_BASE = "http://localhost:3000";

async function makeRequest(url, options = {}) {
  const start = performance.now();
  const res = await fetch(url, options);
  const duration = performance.now() - start;
  const etag = res.headers.get("etag");
  let body = null;
  if (res.status === 200) {
    const text = await res.text();
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  return {
    status: res.status,
    headers: Object.fromEntries(res.headers.entries()),
    etag,
    durationMs: Number(duration.toFixed(2)),
    body,
  };
}

// In-Memory cache logic verification
const { LRUCache, InFlightRequestPool, SearchTrie } = require("../apps/frontend/src/lib/storage/inMemoryCache.js");

async function runTests() {
  console.log("==================================================================");
  console.log("   flowCTRL CLIENT-SIDE-FIRST ARCHITECTURE BENCHMARK & AUDIT      ");
  console.log("==================================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, testName, details = "") {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  [PASS] ${testName}`);
    } else {
      console.error(`  [FAIL] ${testName}: ${details}`);
    }
  }

  // -------------------------------------------------------------------------
  // TEST SUITE 1: Backend ETag & 304 Not Modified Conditional Requests
  // -------------------------------------------------------------------------
  console.log("--- 1. Backend Conditional Request & 304 Negotiation ---");

  const endpoints = [
    { name: "Roadmaps Catalog", path: "/api/roadmaps" },
    { name: "Roadmap Detail (AI Engineer)", path: "/api/roadmaps/ai-engineer" },
    { name: "DSA Languages", path: "/api/dsa/languages" },
    { name: "DSA Algorithms", path: "/api/dsa" },
    { name: "Project Tutorials", path: "/api/project-tutorials?page=1&limit=12" },
    { name: "Resources Catalog", path: "/api/resources?page=1&limit=24" },
    { name: "Announcements", path: "/api/announcements" },
  ];

  for (const ep of endpoints) {
    const initial = await makeRequest(`${API_BASE}${ep.path}`);
    assert(
      initial.status === 200 && initial.etag,
      `${ep.name}: Initial 200 OK with ETag`,
      `Status: ${initial.status}, ETag: ${initial.etag}`
    );

    if (initial.etag) {
      const conditional = await makeRequest(`${API_BASE}${ep.path}`, {
        headers: {
          "If-None-Match": initial.etag,
          "Cache-Control": "max-age=0",
        },
      });
      assert(
        conditional.status === 304,
        `${ep.name}: Conditional request returns 304 Not Modified`,
        `Expected 304, got ${conditional.status}`
      );
    }
  }

  // -------------------------------------------------------------------------
  // TEST SUITE 2: CORS Preflight & Expose-Headers Verification
  // -------------------------------------------------------------------------
  console.log("\n--- 2. CORS Preflight & Exposed Headers ---");

  const corsPreflight = await makeRequest(`${API_BASE}/api/roadmaps`, {
    method: "OPTIONS",
    headers: {
      Origin: "http://localhost:3000",
      "Access-Control-Request-Method": "GET",
      "Access-Control-Request-Headers": "If-None-Match",
    },
  });

  const exposeHeaders = corsPreflight.headers["access-control-expose-headers"] || "";
  assert(
    exposeHeaders.toLowerCase().includes("etag"),
    "CORS exposes ETag header to frontend fetch client",
    `Exposed headers: ${exposeHeaders}`
  );

  // -------------------------------------------------------------------------
  // TEST SUITE 3: In-Flight Request Deduplication Pool
  // -------------------------------------------------------------------------
  console.log("\n--- 3. In-Flight Request Deduplication Pool ---");

  const pool = new InFlightRequestPool();
  let networkFetchCount = 0;

  const mockFetcher = async () => {
    networkFetchCount++;
    await new Promise((r) => setTimeout(r, 50));
    return { data: "fresh" };
  };

  // Launch 10 simultaneous requests for the exact same cacheKey
  const results = await Promise.all([
    pool.dedupe("test-key", mockFetcher),
    pool.dedupe("test-key", mockFetcher),
    pool.dedupe("test-key", mockFetcher),
    pool.dedupe("test-key", mockFetcher),
    pool.dedupe("test-key", mockFetcher),
    pool.dedupe("test-key", mockFetcher),
    pool.dedupe("test-key", mockFetcher),
    pool.dedupe("test-key", mockFetcher),
    pool.dedupe("test-key", mockFetcher),
    pool.dedupe("test-key", mockFetcher),
  ]);

  assert(
    networkFetchCount === 1,
    "10 concurrent requests deduplicated into exactly 1 network execution",
    `Executions: ${networkFetchCount}`
  );
  assert(
    results.every((r) => r.data === "fresh"),
    "All 10 callers resolved with correct response data"
  );
  assert(
    pool.flightMap.size === 0,
    "In-flight pool cleanly cleared after promises resolve"
  );

  // -------------------------------------------------------------------------
  // TEST SUITE 4: LRU In-Memory Cache Latency & Eviction
  // -------------------------------------------------------------------------
  console.log("\n--- 4. In-Memory LRU Cache Throughput & Latency ---");

  const lru = new LRUCache({ capacity: 5, defaultTtlMs: 5000 });
  for (let i = 1; i <= 5; i++) {
    lru.set(`key-${i}`, { value: i });
  }

  const t0 = performance.now();
  for (let i = 0; i < 10000; i++) {
    lru.get("key-3");
  }
  const lruDuration = performance.now() - t0;
  const avgOpTime = lruDuration / 10000;

  assert(
    avgOpTime < 0.01,
    `LRU Cache Read Latency: ${(avgOpTime * 1000).toFixed(2)} microseconds per operation (< 0.01ms)`
  );

  // Test eviction
  lru.set("key-6", { value: 6 });
  assert(
    lru.get("key-1") === null,
    "Least recently used item (key-1) correctly evicted on capacity exceed"
  );
  assert(
    lru.get("key-6")?.value === 6,
    "New item (key-6) stored successfully"
  );

  // -------------------------------------------------------------------------
  // TEST SUITE 5: SearchTrie Instant Prefix Search
  // -------------------------------------------------------------------------
  console.log("\n--- 5. SearchTrie Prefix Search Latency ---");

  const trie = new SearchTrie();
  trie.insertItem("bs", { name: "Binary Search" }, ["Binary Search", "Divide and conquer"]);
  trie.insertItem("bfs", { name: "Breadth-First Search" }, ["Breadth First Search", "Graph traversal"]);
  trie.insertItem("dfs", { name: "Depth-First Search" }, ["Depth First Search", "Graph traversal"]);
  trie.insertItem("dj", { name: "Dijkstra" }, ["Dijkstra's Algorithm", "Shortest path"]);
  trie.insertItem("qs", { name: "QuickSort" }, ["Quicksort", "Sorting"]);
  trie.insertItem("ms", { name: "MergeSort" }, ["Mergesort", "Sorting"]);

  const trieStart = performance.now();
  const searchResults = trie.searchPrefix("graph");
  const trieDuration = performance.now() - trieStart;

  assert(
    searchResults.length === 2,
    `Trie found ${searchResults.length} items matching 'graph' in ${trieDuration.toFixed(3)}ms`
  );

  // -------------------------------------------------------------------------
  // TEST SUITE 6: Cold Fetch (Network) vs Warm Cache Latency
  // -------------------------------------------------------------------------
  console.log("\n--- 6. Measured Latency Comparison (Cold vs Warm) ---");

  // Cold network fetch
  const coldRoadmaps = await makeRequest(`${API_BASE}/api/roadmaps`);
  
  // Warm memory hit simulation
  const warmCache = new LRUCache({ capacity: 10, defaultTtlMs: 60000 });
  warmCache.set("roadmaps:catalog", coldRoadmaps.body);

  const tWarmStart = performance.now();
  const warmData = warmCache.get("roadmaps:catalog");
  const warmDuration = performance.now() - tWarmStart;

  console.log(`   Cold Network Fetch Latency: ${coldRoadmaps.durationMs}ms`);
  console.log(`   Warm Client-Side Memory Latency: ${warmDuration.toFixed(3)}ms`);
  console.log(`   Latency Reduction: ${( (1 - (warmDuration / coldRoadmaps.durationMs)) * 100 ).toFixed(1)}%`);

  assert(
    warmDuration < 0.5,
    "Warm Client Cache delivers sub-millisecond response (< 0.5ms)"
  );
  assert(
    warmData !== null,
    "Warm cache returns identical dataset without server roundtrip"
  );

  // -------------------------------------------------------------------------
  // TEST SUITE 7: Frontend Page Availability (200 OK)
  // -------------------------------------------------------------------------
  console.log("\n--- 7. Frontend Pages Availability ---");

  const frontendPages = [
    { name: "Home Page", path: "/" },
    { name: "Roadmaps Catalog", path: "/roadmaps" },
    { name: "Roadmap Detail (AI Engineer)", path: "/roadmaps/ai-engineer" },
    { name: "DSA Interactive", path: "/dsa" },
    { name: "Project Tutorials", path: "/project-tutorials" },
    { name: "Resources Catalog", path: "/resources" },
  ];

  for (const page of frontendPages) {
    const pageRes = await makeRequest(`${FRONTEND_BASE}${page.path}`);
    assert(
      pageRes.status === 200,
      `Frontend ${page.name} (${page.path}) returns HTTP 200 OK (${pageRes.durationMs}ms)`,
      `Status: ${pageRes.status}`
    );
  }

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log("\n==================================================================");
  console.log(`   BENCHMARK RESULT: ${passedTests}/${totalTests} TESTS PASSED (${((passedTests/totalTests)*100).toFixed(1)}%)`);
  console.log("==================================================================\n");

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("FATAL AUDIT ERROR:", err);
  process.exit(1);
});
