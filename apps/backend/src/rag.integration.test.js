const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const ragController = require("./controllers/rag.controller");
const { requireAuth } = require("./middleware/auth.middleware");

function createMockReqRes({ user = null, body = {}, params = {}, query = {}, headers = {} } = {}) {
  const req = {
    user,
    body,
    params,
    query,
    headers,
  };

  let statusCode = 200;
  let responseData = null;
  let ended = false;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    setHeader() {
      return this;
    },
    getHeader() {
      return null;
    },
    json(data) {
      responseData = data;
      ended = true;
      return this;
    },
    send(data) {
      responseData = data;
      ended = true;
      return this;
    },
  };

  return {
    req,
    res,
    getStatus: () => statusCode,
    getData: () => responseData,
  };
}

describe("RAG Backend Controller & API Integration Suite", () => {
  const mockUser = {
    id: "user_rag_test_101",
    email: "test.rag@flowctrl.dev",
    role: "USER",
    name: "RAG Test User",
  };

  test("requireAuth rejects unauthenticated requests with 401", async () => {
    const { req, res, getStatus, getData } = createMockReqRes({ user: null });
    let nextCalled = false;
    await requireAuth(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, false);
    assert.equal(getStatus(), 401);
    assert.equal(getData().code, "UNAUTHORIZED");
  });

  test("saveProfile & getProfile validates and saves user career preferences", async () => {
    const { req: saveReq, res: saveRes, getStatus: saveStatus, getData: saveData } = createMockReqRes({
      user: mockUser,
      body: {
        targetRole: "Backend Engineer",
        targetCompanyType: "Product-based company",
        targetDomain: "Software Development",
        careerGoals: ["Product-based company"],
        experienceLevel: "Beginner",
        currentSkills: [
          { name: "JavaScript", proficiency: 3 },
        ],
      },
    });

    await ragController.saveProfile(saveReq, saveRes, () => {});
    assert.equal(saveStatus(), 200);
    assert.ok(saveData().data.targetRole.includes("Backend"));

    // Fetch profile
    const { req: getReq, res: getRes, getStatus: getStatus, getData: getData } = createMockReqRes({
      user: mockUser,
    });
    await ragController.getProfile(getReq, getRes, () => {});
    assert.equal(getStatus(), 200);
    assert.equal(getData().data.targetRole, "Backend Engineer");
  });

  test("assessSkills performs Current Skills -> Required Skills -> Skill Gaps calculation", async () => {
    const { req, res, getStatus, getData } = createMockReqRes({
      user: mockUser,
      body: {
        targetRole: "Backend Developer",
        targetDomain: "Software Development",
        currentSkills: [{ name: "JavaScript", proficiency: 4 }],
      },
    });

    await ragController.assessSkills(req, res, () => {});
    assert.equal(getStatus(), 200);
    assert.ok(getData().data.skillGaps.length > 0);
    assert.ok(getData().data.masteredSkills.some((s) => s.name.toLowerCase() === "javascript"));
  });

  test("generateRoadmap produces personalized RAG roadmap with stages and metadata", async () => {
    const { req, res, getStatus, getData } = createMockReqRes({
      user: mockUser,
      body: {
        targetRole: "Backend Developer",
        targetCompanyType: "Product-based company",
        targetDomain: "Software Development",
        currentSkills: [{ name: "JavaScript", proficiency: 3 }],
      },
    });

    await ragController.generateRoadmap(req, res, () => {});
    assert.equal(getStatus(), 201);
    const roadmap = getData().data;
    assert.ok(roadmap.id);
    assert.ok(roadmap.stages.length >= 3);
    assert.ok(roadmap.totalTopicsCount > 0);
  });

  test("getDashboard and toggleTopicProgress track topic completion and dashboard stats", async () => {
    // 1. Get dashboard initially
    const { req: dashReq, res: dashRes, getStatus: dashStatus, getData: dashData } = createMockReqRes({
      user: mockUser,
    });
    await ragController.getDashboard(dashReq, dashRes, () => {});
    assert.equal(dashStatus(), 200);
    assert.equal(dashData().data.hasActiveRoadmap, true);

    // 2. Fetch the active roadmap to get first topic ID
    const { req: rmReq, res: rmRes, getData: rmData } = createMockReqRes({ user: mockUser });
    await ragController.getRoadmap(rmReq, rmRes, () => {});
    const firstTopicId = rmData().data.stages[0].items[0].id;

    // 3. Toggle progress on first topic
    const { req: toggleReq, res: toggleRes, getStatus: toggleStatus, getData: toggleData } = createMockReqRes({
      user: mockUser,
      body: { topicId: firstTopicId },
    });
    await ragController.toggleTopicProgress(toggleReq, toggleRes, () => {});
    assert.equal(toggleStatus(), 200);
    assert.ok(toggleData().data.completedTopicIds.includes(firstTopicId));
    assert.ok(toggleData().data.dashboardMetrics.overallProgress > 0);
  });

  test("getRecommendations adapts and provides explainable next steps", async () => {
    const { req, res, getStatus, getData } = createMockReqRes({
      user: mockUser,
    });
    await ragController.getRecommendations(req, res, () => {});
    assert.equal(getStatus(), 200);
    assert.ok(getData().data.recommendations.length > 0);
    assert.ok(getData().data.recommendations[0].reason.length > 0);
  });
});
