const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const config = require("./config");
const { app } = require("./app");
const { prisma } = require("./lib/prisma");
const {
  personalizedRoadmapsService,
  normalizeRagRoadmap,
} = require("./services/personalizedRoadmaps.service");

// Helper to generate auth token
function createAuthToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.secret,
    { algorithm: "HS256", expiresIn: "1h" }
  );
}

test("1. RAG Normalization - Generates individual nodes for every topic & maps many-to-many edges", () => {
  // RAG Output containing 4 levels with branching & merging
  const ragCurriculum = {
    roadmapTitle: "Cloud Native Systems Architect",
    userGoal: "Master Distributed Systems & Kubernetes",
    targetRole: "Systems Architect",
    summary: "Comprehensive multi-level roadmap grounded in verified curricula.",
    estimatedTotalWeeks: 24,
    stages: [
      {
        stageIndex: 0,
        stageName: "Level 1: Core Fundamentals",
        stageDescription: "Operating systems, networking, and programming fundamentals.",
      },
      {
        stageIndex: 1,
        stageName: "Level 2: Systems Programming",
        stageDescription: "Go, Rust, and concurrency models.",
      },
      {
        stageIndex: 2,
        stageName: "Level 3: Distributed Engines",
        stageDescription: "Consensus protocols, Raft, and container runtimes.",
      },
      {
        stageIndex: 3,
        stageName: "Level 4: Production Scale",
        stageDescription: "Kubernetes operators and chaos engineering.",
      },
    ],
    steps: [
      // Level 1: 3 individual topics
      {
        id: "l1_os",
        topic: "Operating Systems Internals",
        stageIndex: 0,
        difficulty: "Beginner",
        prerequisites: [],
      },
      {
        id: "l1_net",
        topic: "Computer Networking & Protocols",
        stageIndex: 0,
        difficulty: "Beginner",
        prerequisites: [],
      },
      {
        id: "l1_prog",
        topic: "Programming Fundamentals",
        stageIndex: 0,
        difficulty: "Beginner",
        prerequisites: [],
      },

      // Level 2: 3 individual topics (Branching from Level 1)
      {
        id: "l2_golang",
        topic: "Golang Concurrency",
        stageIndex: 1,
        difficulty: "Intermediate",
        prerequisites: ["Programming Fundamentals", "Operating Systems Internals"],
      },
      {
        id: "l2_rust",
        topic: "Rust Memory Safety",
        stageIndex: 1,
        difficulty: "Intermediate",
        prerequisites: ["Programming Fundamentals"],
      },
      {
        id: "l2_sockets",
        topic: "Socket Programming & Epoll",
        stageIndex: 1,
        difficulty: "Intermediate",
        prerequisites: ["Computer Networking & Protocols"],
      },

      // Level 3: 2 individual topics (Merging multiple Level 2 topics)
      {
        id: "l3_consensus",
        topic: "Distributed Consensus & Raft",
        stageIndex: 2,
        difficulty: "Advanced",
        prerequisites: ["Golang Concurrency", "Socket Programming & Epoll"], // Merging!
      },
      {
        id: "l3_containers",
        topic: "Container Runtimes & Namespaces",
        stageIndex: 2,
        difficulty: "Advanced",
        prerequisites: ["Golang Concurrency", "Rust Memory Safety"], // Merging!
      },

      // Level 4: 1 individual topic
      {
        id: "l4_k8s",
        topic: "Custom Kubernetes Controller Design",
        stageIndex: 3,
        difficulty: "Advanced",
        prerequisites: ["Distributed Consensus & Raft", "Container Runtimes & Namespaces"],
      },
    ],
  };

  const normalized = normalizeRagRoadmap(ragCurriculum);

  // Requirement 2: Every individual learning requirement must have its own node
  assert.equal(normalized.levels.length, 4, "Should have 4 learning levels");
  assert.equal(normalized.nodes.length, 9, "Every topic must have an individual node (3+3+2+1=9)");

  // Verify node contents
  const golangNode = normalized.nodes.find((n) => n.nodeKey === "l2_golang");
  assert.ok(golangNode, "Golang node must exist");
  assert.equal(golangNode.levelIndex, 1);
  assert.equal(golangNode.difficulty, "Intermediate");

  // Verify Many-to-Many directed edges
  assert.ok(normalized.edges.length >= 7, "Edges must connect prerequisites");

  // Check merging: l3_consensus should have incoming edges from l2_golang and l2_sockets
  const consensusIncoming = normalized.edges.filter((e) => e.targetKey === "l3_consensus");
  assert.ok(consensusIncoming.length >= 2, "Consensus topic should merge 2 prerequisites");
  assert.ok(consensusIncoming.some((e) => e.sourceKey === "l2_golang"));
  assert.ok(consensusIncoming.some((e) => e.sourceKey === "l2_sockets"));

  // Check branching: l2_golang should branch to both l3_consensus and l3_containers
  const golangOutgoing = normalized.edges.filter((e) => e.sourceKey === "l2_golang");
  assert.ok(golangOutgoing.length >= 2, "Golang topic should branch to multiple downstream topics");
  assert.ok(golangOutgoing.some((e) => e.targetKey === "l3_consensus"));
  assert.ok(golangOutgoing.some((e) => e.targetKey === "l3_containers"));
});

test("2. PostgreSQL Persistence & Individual User Data Isolation", async () => {
  // Ensure 2 distinct users in DB
  const userA = await prisma.user.upsert({
    where: { email: "alice.isolation@flowctrl.dev" },
    create: {
      email: "alice.isolation@flowctrl.dev",
      name: "Alice Engineer",
      role: "USER",
      status: "ACTIVE",
    },
    update: { status: "ACTIVE" },
  });

  const userB = await prisma.user.upsert({
    where: { email: "bob.isolation@flowctrl.dev" },
    create: {
      email: "bob.isolation@flowctrl.dev",
      name: "Bob Engineer",
      role: "USER",
      status: "ACTIVE",
    },
    update: { status: "ACTIVE" },
  });

  // User A generates roadmap
  const rawRag = {
    roadmapTitle: "Alice's AI Engineering Roadmap",
    userGoal: "Master LLMs & RAG Architectures",
    summary: "Personalized AI curriculum for Alice.",
    targetRole: "AI Engineer",
    stages: [
      { stageIndex: 0, stageName: "Foundations", stageDescription: "Math & Vectors" },
      { stageIndex: 1, stageName: "LLM Pipeline", stageDescription: "Embeddings & RAG" },
    ],
    steps: [
      { id: "step_vectors", topic: "Vector Embeddings", stageIndex: 0, difficulty: "Beginner" },
      { id: "step_rag", topic: "RAG Retrieval & Qdrant", stageIndex: 1, difficulty: "Intermediate", prerequisites: ["Vector Embeddings"] },
    ],
  };

  const savedRoadmap = await personalizedRoadmapsService.saveGeneratedRoadmap(
    userA.id,
    rawRag,
    { query: "Master LLMs & RAG Architectures" }
  );

  assert.ok(savedRoadmap.id, "Saved roadmap must have a database ID");
  assert.equal(savedRoadmap.userId, userA.id, "Must be linked to User A's ID");
  assert.equal(savedRoadmap.steps.length, 2, "Must store 2 individual nodes");
  assert.equal(savedRoadmap.edges.length, 1, "Must store 1 directed edge");

  // User A can access their roadmap
  const aliceView = await personalizedRoadmapsService.getRoadmapById(savedRoadmap.id, userA);
  assert.equal(aliceView.id, savedRoadmap.id);
  assert.equal(aliceView.roadmapTitle, "Alice's AI Engineering Roadmap");

  // User B attempting to view User A's roadmap is BLOCKED with 403 Forbidden
  await assert.rejects(
    async () => {
      await personalizedRoadmapsService.getRoadmapById(savedRoadmap.id, userB);
    },
    (err) => {
      assert.equal(err.statusCode, 403);
      assert.equal(err.code, "FORBIDDEN");
      return true;
    },
    "User B must receive 403 Forbidden when accessing User A's roadmap"
  );

  // User B attempting to update progress on User A's roadmap is BLOCKED
  await assert.rejects(
    async () => {
      await personalizedRoadmapsService.updateTopicProgress(
        savedRoadmap.id,
        "step_vectors",
        "COMPLETED",
        userB
      );
    },
    (err) => {
      assert.equal(err.statusCode, 403);
      assert.equal(err.code, "FORBIDDEN");
      return true;
    },
    "User B must receive 403 Forbidden when modifying User A's roadmap"
  );

  // User B attempting to delete User A's roadmap is BLOCKED
  await assert.rejects(
    async () => {
      await personalizedRoadmapsService.deleteRoadmap(savedRoadmap.id, userB);
    },
    (err) => {
      assert.equal(err.statusCode, 403);
      assert.equal(err.code, "FORBIDDEN");
      return true;
    },
    "User B must receive 403 Forbidden when deleting User A's roadmap"
  );

  // User B's roadmap collection does NOT expose User A's roadmaps
  const bobRoadmaps = await personalizedRoadmapsService.getUserRoadmaps(userB.id);
  const foundAliceRoadmap = bobRoadmaps.roadmaps.some((r) => r.id === savedRoadmap.id);
  assert.equal(foundAliceRoadmap, false, "User B collection must NEVER include User A's roadmaps");

  // Clean up
  await personalizedRoadmapsService.deleteRoadmap(savedRoadmap.id, userA);
});

test("3. Learning Progress Synchronization in PostgreSQL", async () => {
  const user = await prisma.user.upsert({
    where: { email: "progress.sync@flowctrl.dev" },
    create: {
      email: "progress.sync@flowctrl.dev",
      name: "Progress Sync Tester",
      role: "USER",
      status: "ACTIVE",
    },
    update: { status: "ACTIVE" },
  });

  const rawRag = {
    roadmapTitle: "Microservices Architecture",
    userGoal: "Master Service Discovery & gRPC",
    stages: [
      { stageIndex: 0, stageName: "Basics", stageDescription: "" },
      { stageIndex: 1, stageName: "Advanced", stageDescription: "" },
    ],
    steps: [
      { id: "s1", topic: "gRPC Protocols", stageIndex: 0, difficulty: "Beginner" },
      { id: "s2", topic: "Envoy Proxy", stageIndex: 1, difficulty: "Intermediate" },
    ],
  };

  const roadmap = await personalizedRoadmapsService.saveGeneratedRoadmap(user.id, rawRag);

  // 1. Initially progress is 0%
  assert.equal(roadmap.progressPercent, 0);

  // 2. Mark s1 as COMPLETED
  const res1 = await personalizedRoadmapsService.updateTopicProgress(roadmap.id, "s1", "COMPLETED", user);
  assert.equal(res1.status, "completed");
  assert.equal(res1.completedCount, 1);
  assert.equal(res1.progressPercent, 50);

  // Direct DB check for s1 completedAt timestamp
  const node1 = await prisma.personalizedRoadmapNode.findFirst({
    where: { roadmapId: roadmap.id, nodeKey: "s1" },
  });
  assert.equal(node1.status, "COMPLETED");
  assert.ok(node1.completedAt instanceof Date, "completedAt timestamp must be recorded");

  // 3. Mark s2 as COMPLETED -> 100% and overallStatus COMPLETED
  const res2 = await personalizedRoadmapsService.updateTopicProgress(roadmap.id, "s2", "COMPLETED", user);
  assert.equal(res2.completedCount, 2);
  assert.equal(res2.progressPercent, 100);
  assert.equal(res2.overallStatus, "COMPLETED");

  // 4. Persistence verification: fetch roadmap again (simulating logout/login and page refresh)
  const refreshed = await personalizedRoadmapsService.getRoadmapById(roadmap.id, user);
  assert.equal(refreshed.progressPercent, 100);
  assert.equal(refreshed.status, "COMPLETED");
  assert.equal(refreshed.completedNodes, 2);

  // Clean up
  await personalizedRoadmapsService.deleteRoadmap(roadmap.id, user);
});

test("4. HTTP Endpoints - GET, POST, and Progress Synchronization over HTTP API", async () => {
  const user = await prisma.user.upsert({
    where: { email: "api.client@flowctrl.dev" },
    create: {
      email: "api.client@flowctrl.dev",
      name: "API Tester",
      role: "USER",
      status: "ACTIVE",
    },
    update: { status: "ACTIVE" },
  });

  const token = createAuthToken(user);
  const server = app.listen(0);
  const port = server.address().port;

  try {
    // 1. POST /api/personalized-roadmaps
    const createRes = await fetch(`http://localhost:${port}/api/personalized-roadmaps`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: "DevOps & SRE",
        rawRagOutput: {
          roadmapTitle: "SRE Reliability Track",
          userGoal: "Master Site Reliability Engineering",
          stages: [{ stageIndex: 0, stageName: "SLO Engineering", stageDescription: "" }],
          steps: [
            { id: "step_slo", topic: "SLIs, SLOs & Error Budgets", stageIndex: 0, difficulty: "Beginner" },
            { id: "step_chaos", topic: "Chaos Testing", stageIndex: 0, difficulty: "Intermediate", prerequisites: ["SLIs, SLOs & Error Budgets"] },
          ],
        },
      }),
    });

    assert.equal(createRes.status, 201);
    const createJson = await createRes.json();
    assert.equal(createJson.success, true);
    const createdRoadmap = createJson.data;
    assert.ok(createdRoadmap.id);
    assert.equal(createdRoadmap.steps.length, 2);

    // 2. GET /api/personalized-roadmaps (List user roadmaps)
    const listRes = await fetch(`http://localhost:${port}/api/personalized-roadmaps`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(listRes.status, 200);
    const listJson = await listRes.json();
    assert.equal(listJson.success, true);
    assert.ok(Array.isArray(listJson.data));
    assert.ok(listJson.data.some((r) => r.id === createdRoadmap.id));

    // 3. GET /api/personalized-roadmaps/:id (Get full graph)
    const getRes = await fetch(`http://localhost:${port}/api/personalized-roadmaps/${createdRoadmap.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(getRes.status, 200);
    const getJson = await getRes.json();
    assert.equal(getJson.success, true);
    assert.equal(getJson.data.id, createdRoadmap.id);
    assert.equal(getJson.data.edges.length, 1);

    // 4. POST /api/personalized-roadmaps/:id/progress (Toggle node progress)
    const progressRes = await fetch(`http://localhost:${port}/api/personalized-roadmaps/${createdRoadmap.id}/progress`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        stepId: "step_slo",
        status: "COMPLETED",
      }),
    });
    assert.equal(progressRes.status, 200);
    const progressJson = await progressRes.json();
    assert.equal(progressJson.success, true);
    assert.equal(progressJson.data.status, "completed");
    assert.equal(progressJson.data.progressPercent, 50);

    // 5. DELETE /api/personalized-roadmaps/:id
    const deleteRes = await fetch(`http://localhost:${port}/api/personalized-roadmaps/${createdRoadmap.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(deleteRes.status, 200);
  } finally {
    server.close();
  }
});

test.after(async () => {
  await prisma.$disconnect();
  setTimeout(() => process.exit(0), 200);
});
