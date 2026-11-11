const { prisma } = require("../lib/prisma");

class PersonalizedRoadmapError extends Error {
  constructor(message, statusCode = 400, code = "PERSONALIZED_ROADMAP_ERROR") {
    super(message);
    this.name = "PersonalizedRoadmapError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Normalizes any RAG model output (Python RAG microservice, JS fallback, or LLM)
 * into a consistent, validated graph structure with individual nodes, levels, and edges.
 */
function normalizeRagRoadmap(rawInput, context = {}) {
  let raw = rawInput;
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(rawInput);
    } catch {
      raw = { summary: rawInput };
    }
  }

  raw = raw || {};

  const userGoal =
    raw.userGoal ||
    context.query ||
    context.goal ||
    "Personalized Career Advancement";
  const title =
    raw.roadmapTitle ||
    raw.title ||
    `${userGoal.charAt(0).toUpperCase() + userGoal.slice(1)} Mastery Path`;
  const description =
    raw.summary ||
    raw.description ||
    `Adaptive career roadmap grounded in verified curricula, tailored for ${userGoal}.`;
  const targetRole =
    raw.targetRole || context.targetRole || context.query || "Software Engineer";
  const estimatedTotalWeeks =
    parseInt(raw.estimatedTotalWeeks, 10) || 12;

  // 1. Extract or synthesize learning levels / stages
  let rawStages = [];
  if (Array.isArray(raw.stages) && raw.stages.length > 0) {
    rawStages = raw.stages;
  } else {
    // Generate default 4 structured engineering phases
    rawStages = [
      {
        stageIndex: 0,
        stageName: "Phase 1: Foundations & Prerequisites",
        stageDescription: "Core computer science fundamentals, syntax, and foundational tools.",
      },
      {
        stageIndex: 1,
        stageName: "Phase 2: Core Engineering & Systems",
        stageDescription: "Deep dive into core framework patterns, algorithms, and application architectures.",
      },
      {
        stageIndex: 2,
        stageName: "Phase 3: Advanced Architecture & Scaling",
        stageDescription: "Production scaling, databases, concurrency, and distributed system design.",
      },
      {
        stageIndex: 3,
        stageName: "Phase 4: Tooling, Security & Capstone Deployment",
        stageDescription: "Hardening, observability, automated testing, and portfolio deliverables.",
      },
    ];
  }

  const levels = rawStages.map((stg, idx) => ({
    levelIndex: typeof stg.stageIndex === "number" ? stg.stageIndex : idx,
    title: stg.stageName || stg.title || `Phase ${idx + 1}`,
    description: stg.stageDescription || stg.description || "",
    order: idx,
  }));

  // Map to easily look up level info
  const levelByStageIndex = new Map();
  levels.forEach((lvl) => {
    levelByStageIndex.set(lvl.levelIndex, lvl);
  });

  // 2. Extract every individual topic as a distinct node
  const nodes = [];
  const rawSteps = Array.isArray(raw.steps) ? raw.steps : [];

  if (rawSteps.length > 0) {
    // python_rag PersonalizedRoadmapResponse format
    rawSteps.forEach((step, idx) => {
      const stageIdx = typeof step.stageIndex === "number" ? step.stageIndex : 0;
      const stageObj = levelByStageIndex.get(stageIdx) || levels[0];
      const nodeKey =
        step.id || `node_${stageIdx + 1}_${idx + 1}_${slugify(step.topic || "topic")}`;

      nodes.push({
        nodeKey,
        topic: step.topic || `Topic ${idx + 1}`,
        levelIndex: stageIdx,
        stageName: step.stageName || stageObj.title,
        orderIndex: typeof step.stepIndex === "number" ? step.stepIndex : idx,
        difficulty: step.difficulty || "Beginner",
        estimatedEffort: step.estimatedEffort || "15 hours (1-2 weeks)",
        whyItMatters: step.whyItMatters || step.whyRecommended || "",
        whatYouWillLearn: step.whatYouWillLearn || "",
        practicalApplication:
          step.practicalApplication || step.projectApplication || "",
        completionCriteria:
          step.completionCriteria || "Demonstrate verified implementation",
        nextStep: step.nextStep || step.nextRecommendedStep || "",
        status: normalizeStatus(step.status),
        prerequisites: Array.isArray(step.prerequisites) ? step.prerequisites : [],
        recommendedCourses: Array.isArray(step.recommendedCourses)
          ? step.recommendedCourses
          : Array.isArray(step.recommendedResources)
          ? step.recommendedResources
          : [],
        referenceLinks: Array.isArray(step.referenceLinks) ? step.referenceLinks : [],
        practiceTasks: Array.isArray(step.practiceTasks) ? step.practiceTasks : [],
      });
    });
  } else {
    // JavaScript fallback format (stages -> items)
    let globalIndex = 0;
    rawStages.forEach((stage, stageIdx) => {
      const items = Array.isArray(stage.items) ? stage.items : [];
      items.forEach((item, itemIdx) => {
        globalIndex++;
        const nodeKey =
          item.id ||
          `node_${stageIdx + 1}_${itemIdx + 1}_${slugify(item.topic || "topic")}`;

        nodes.push({
          nodeKey,
          topic: item.topic || `Topic ${globalIndex}`,
          levelIndex: stageIdx,
          stageName: stage.stageName || `Phase ${stageIdx + 1}`,
          orderIndex: itemIdx,
          difficulty: item.difficulty || "Beginner",
          estimatedEffort: item.estimatedEffort || "15 hours (1-2 weeks)",
          whyItMatters: item.whyRecommended || item.whyItMatters || "",
          whatYouWillLearn: item.whatYouWillLearn || "",
          practicalApplication:
            item.projectApplication || item.practicalApplication || "",
          completionCriteria:
            item.completionCriteria || "Demonstrate verified implementation",
          nextStep: item.nextRecommendedStep || item.nextStep || "",
          status: normalizeStatus(item.status),
          prerequisites: Array.isArray(item.prerequisites) ? item.prerequisites : [],
          recommendedCourses: Array.isArray(item.recommendedResources)
            ? item.recommendedResources
            : Array.isArray(item.recommendedCourses)
            ? item.recommendedCourses
            : [],
          referenceLinks: Array.isArray(item.referenceLinks)
            ? item.referenceLinks
            : [],
          practiceTasks: Array.isArray(item.practiceTasks) ? item.practiceTasks : [],
        });
      });
    });
  }

  // 3. Dynamic Edge Generation: Prerequisite mapping, branching, and merging
  const edges = [];
  const edgeSet = new Set(); // to prevent duplicate edges

  function addEdge(sourceKey, targetKey, label = "Prerequisite for", edgeType = "PREREQUISITE") {
    if (!sourceKey || !targetKey || sourceKey === targetKey) return;
    const key = `${sourceKey}->${targetKey}`;
    if (edgeSet.has(key)) return;
    edgeSet.add(key);
    edges.push({
      sourceKey,
      targetKey,
      label,
      edgeType,
    });
  }

  // A. Honor any explicit edges returned by RAG
  if (Array.isArray(raw.edges)) {
    raw.edges.forEach((e) => {
      if (e.source && e.target) {
        addEdge(e.source, e.target, e.label || "Dependency", "PREREQUISITE");
      }
    });
  }

  // B. Build map from topic name/key to nodeKey
  const topicNameToNodeKey = new Map();
  nodes.forEach((n) => {
    topicNameToNodeKey.set(n.nodeKey.toLowerCase(), n.nodeKey);
    topicNameToNodeKey.set(n.topic.toLowerCase().trim(), n.nodeKey);
  });

  // C. Map prerequisite strings to directed edges
  nodes.forEach((node) => {
    if (Array.isArray(node.prerequisites)) {
      node.prerequisites.forEach((prereqStr) => {
        if (!prereqStr || typeof prereqStr !== "string") return;
        const cleanPrereq = prereqStr.toLowerCase().trim();

        // 1. Direct match
        let matchedKey = topicNameToNodeKey.get(cleanPrereq);

        // 2. Substring match if no direct match
        if (!matchedKey) {
          for (const otherNode of nodes) {
            if (otherNode.nodeKey === node.nodeKey) continue;
            const otherTopic = otherNode.topic.toLowerCase();
            if (
              otherTopic === cleanPrereq ||
              otherTopic.includes(cleanPrereq) ||
              cleanPrereq.includes(otherTopic)
            ) {
              matchedKey = otherNode.nodeKey;
              break;
            }
          }
        }

        if (matchedKey && matchedKey !== node.nodeKey) {
          addEdge(matchedKey, node.nodeKey, "Prerequisite for", "PREREQUISITE");
        }
      });
    }
  });

  // D. Ensure graph continuity across stages (connect adjacent stages if unconnected)
  // Group nodes by level
  const nodesByLevel = new Map();
  levels.forEach((lvl) => nodesByLevel.set(lvl.levelIndex, []));
  nodes.forEach((node) => {
    const list = nodesByLevel.get(node.levelIndex) || [];
    list.push(node);
    nodesByLevel.set(node.levelIndex, list);
  });

  // If a node in level > 0 has 0 incoming edges, connect it from the most relevant or last node in the previous level
  const sortedLevelIndices = Array.from(nodesByLevel.keys()).sort((a, b) => a - b);
  for (let i = 1; i < sortedLevelIndices.length; i++) {
    const prevLvl = sortedLevelIndices[i - 1];
    const currLvl = sortedLevelIndices[i];
    const prevNodes = nodesByLevel.get(prevLvl) || [];
    const currNodes = nodesByLevel.get(currLvl) || [];

    if (prevNodes.length === 0 || currNodes.length === 0) continue;

    currNodes.forEach((currNode, cIdx) => {
      const hasIncoming = edges.some((e) => e.targetKey === currNode.nodeKey);
      if (!hasIncoming) {
        // Connect from corresponding index or last node of previous level
        const sourceNode = prevNodes[cIdx % prevNodes.length];
        addEdge(
          sourceNode.nodeKey,
          currNode.nodeKey,
          "Prepares for",
          "PREREQUISITE"
        );
      }
    });
  }

  // Model & Provenance metadata
  const modelMetadata = {
    pipeline: raw.provenance?.source || context.pipeline || "python_langchain_qdrant",
    matchedTrack: raw.provenance?.matchedTrack || context.matchedTrack || null,
    totalVerifiedResources:
      raw.provenance?.totalVerifiedResources ||
      nodes.reduce((sum, n) => sum + (n.recommendedCourses?.length || 0), 0),
    generatedAt: new Date().toISOString(),
  };

  return {
    userGoal,
    title,
    description,
    targetRole,
    estimatedTotalWeeks,
    levels,
    nodes,
    edges,
    modelMetadata,
    originalRagOutput: raw,
  };
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function normalizeStatus(status) {
  if (!status) return "NOT_STARTED";
  const s = String(status).toUpperCase();
  if (s === "COMPLETED" || s === "DONE") return "COMPLETED";
  if (s === "IN_PROGRESS" || s === "DOING") return "IN_PROGRESS";
  if (s === "LOCKED") return "LOCKED";
  if (s === "UPCOMING") return "UPCOMING";
  return "NOT_STARTED";
}

class PersonalizedRoadmapsService {
  /**
   * Saves a newly generated RAG roadmap to PostgreSQL inside an atomic transaction.
   */
  async saveGeneratedRoadmap(userId, rawRagOutput, context = {}) {
    if (!userId) {
      throw new PersonalizedRoadmapError("Authenticated user ID is required.", 401, "UNAUTHORIZED");
    }

    const normalized = normalizeRagRoadmap(rawRagOutput, context);

    // Save completely inside a Prisma transaction
    return await prisma.$transaction(async (tx) => {
      // 1. Create Roadmap Header
      const roadmap = await tx.personalizedRoadmap.create({
        data: {
          userId,
          userGoal: normalized.userGoal,
          title: normalized.title,
          description: normalized.description,
          targetRole: normalized.targetRole,
          estimatedTotalWeeks: normalized.estimatedTotalWeeks,
          status: "IN_PROGRESS",
          progressPercent: 0,
          modelMetadata: normalized.modelMetadata,
          originalRagOutput: normalized.originalRagOutput,
        },
      });

      // 2. Create Learning Levels
      const levelIdMap = new Map(); // levelIndex -> DB level id
      for (const lvl of normalized.levels) {
        const createdLevel = await tx.personalizedRoadmapLevel.create({
          data: {
            roadmapId: roadmap.id,
            levelIndex: lvl.levelIndex,
            title: lvl.title,
            description: lvl.description,
            order: lvl.order,
          },
        });
        levelIdMap.set(lvl.levelIndex, createdLevel.id);
      }

      // 3. Create Individual Topic Nodes
      const nodeKeyToDbId = new Map(); // nodeKey -> DB node id
      for (const node of normalized.nodes) {
        const levelId = levelIdMap.get(node.levelIndex) || null;
        const createdNode = await tx.personalizedRoadmapNode.create({
          data: {
            roadmapId: roadmap.id,
            levelId,
            nodeKey: node.nodeKey,
            topic: node.topic,
            nodeType: "TOPIC",
            levelIndex: node.levelIndex,
            orderIndex: node.orderIndex,
            difficulty: node.difficulty,
            estimatedEffort: node.estimatedEffort,
            whyItMatters: node.whyItMatters,
            whatYouWillLearn: node.whatYouWillLearn,
            practicalApplication: node.practicalApplication,
            completionCriteria: node.completionCriteria,
            nextStep: node.nextStep,
            status: node.status,
            metadata: {
              prerequisites: node.prerequisites,
              recommendedCourses: node.recommendedCourses,
              referenceLinks: node.referenceLinks,
              practiceTasks: node.practiceTasks,
            },
          },
        });
        nodeKeyToDbId.set(node.nodeKey, createdNode.id);
      }

      // 4. Create Directed Graph Edges
      for (const edge of normalized.edges) {
        const sourceNodeId = nodeKeyToDbId.get(edge.sourceKey);
        const targetNodeId = nodeKeyToDbId.get(edge.targetKey);

        if (sourceNodeId && targetNodeId && sourceNodeId !== targetNodeId) {
          await tx.personalizedRoadmapEdge.create({
            data: {
              roadmapId: roadmap.id,
              sourceNodeId,
              targetNodeId,
              label: edge.label || "Prerequisite for",
              edgeType: edge.edgeType || "PREREQUISITE",
            },
          });
        }
      }

      // 5. Return complete persisted graph
      return await this._getRoadmapWithGraph(roadmap.id, tx);
    });
  }

  /**
   * Helper to retrieve roadmap with its full relational graph
   */
  async _getRoadmapWithGraph(roadmapId, client = prisma) {
    const roadmap = await client.personalizedRoadmap.findUnique({
      where: { id: roadmapId },
      include: {
        levels: {
          orderBy: { levelIndex: "asc" },
        },
        nodes: {
          orderBy: [{ levelIndex: "asc" }, { orderIndex: "asc" }],
        },
        edges: {
          include: {
            sourceNode: {
              select: { id: true, nodeKey: true, topic: true, levelIndex: true, status: true },
            },
            targetNode: {
              select: { id: true, nodeKey: true, topic: true, levelIndex: true, status: true },
            },
          },
        },
      },
    });

    if (!roadmap) return null;

    // Format for frontend graph visualization
    return this.formatRoadmapForVisualization(roadmap);
  }

  /**
   * Formats a database PersonalizedRoadmap into the dynamic graph model required by
   * both the State Tree and Many-to-Many Graph visualization canvases.
   */
  formatRoadmapForVisualization(roadmap) {
    if (!roadmap) return null;

    const totalNodes = roadmap.nodes?.length || 0;
    const completedNodes = (roadmap.nodes || []).filter(
      (n) => n.status === "COMPLETED"
    ).length;
    const calculatedProgress =
      totalNodes > 0 ? Math.round((completedNodes / totalNodes) * 100) : 0;

    // Map stages/levels
    const stages = (roadmap.levels || []).map((lvl) => ({
      stageIndex: lvl.levelIndex,
      stageName: lvl.title,
      stageDescription: lvl.description || "",
      order: lvl.order,
      nodes: (roadmap.nodes || []).filter((n) => n.levelIndex === lvl.levelIndex),
    }));

    // Map nodes/steps
    const steps = (roadmap.nodes || []).map((node) => {
      const meta = node.metadata || {};
      return {
        id: node.nodeKey,
        dbId: node.id,
        topic: node.topic,
        stageName:
          roadmap.levels?.find((l) => l.levelIndex === node.levelIndex)?.title ||
          `Phase ${node.levelIndex + 1}`,
        stageIndex: node.levelIndex,
        stepIndex: node.orderIndex,
        difficulty: node.difficulty,
        estimatedEffort: node.estimatedEffort,
        whyItMatters: node.whyItMatters,
        whatYouWillLearn: node.whatYouWillLearn,
        practicalApplication: node.practicalApplication,
        completionCriteria: node.completionCriteria,
        nextStep: node.nextStep,
        status: node.status.toLowerCase(),
        completedAt: node.completedAt,
        prerequisites: meta.prerequisites || [],
        recommendedCourses: meta.recommendedCourses || [],
        referenceLinks: meta.referenceLinks || [],
        practiceTasks: meta.practiceTasks || [],
      };
    });

    // Map edges
    const edges = (roadmap.edges || []).map((edge) => ({
      id: edge.id,
      source: edge.sourceNode?.nodeKey,
      target: edge.targetNode?.nodeKey,
      sourceDbId: edge.sourceNodeId,
      targetDbId: edge.targetNodeId,
      label: edge.label,
      edgeType: edge.edgeType,
    }));

    return {
      id: roadmap.id,
      roadmapId: roadmap.id,
      userId: roadmap.userId,
      roadmapTitle: roadmap.title,
      userGoal: roadmap.userGoal,
      targetRole: roadmap.targetRole,
      summary: roadmap.description,
      description: roadmap.description,
      estimatedTotalWeeks: roadmap.estimatedTotalWeeks,
      status: roadmap.status,
      progressPercent: calculatedProgress,
      totalNodes,
      completedNodes,
      createdAt: roadmap.createdAt,
      updatedAt: roadmap.updatedAt,
      stages,
      steps,
      nodes: steps, // Alias for compatibility with DevRoadmapGraph
      edges,
      provenance: roadmap.modelMetadata || {},
    };
  }

  /**
   * Fetches all personalized roadmaps for an authenticated user with pagination and counts.
   */
  async getUserRoadmaps(userId, { page = 1, limit = 10 } = {}) {
    if (!userId) {
      throw new PersonalizedRoadmapError("Authenticated user ID is required.", 401, "UNAUTHORIZED");
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(parseInt(limit, 10) || 10, 50));
    const skip = (pageNum - 1) * limitNum;

    const [total, items] = await Promise.all([
      prisma.personalizedRoadmap.count({
        where: { userId },
      }),
      prisma.personalizedRoadmap.findMany({
        where: { userId },
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              levels: true,
              nodes: true,
              edges: true,
            },
          },
          nodes: {
            select: {
              status: true,
            },
          },
        },
      }),
    ]);

    const roadmaps = items.map((r) => {
      const totalNodes = r._count.nodes;
      const completedCount = r.nodes.filter((n) => n.status === "COMPLETED").length;
      const progressPercent =
        totalNodes > 0 ? Math.round((completedCount / totalNodes) * 100) : 0;

      return {
        id: r.id,
        title: r.title,
        careerGoal: r.userGoal,
        userGoal: r.userGoal,
        targetRole: r.targetRole,
        description: r.description,
        status: r.status,
        progressPercent,
        totalLevels: r._count.levels,
        totalNodes,
        completedNodes: completedCount,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
    });

    return {
      roadmaps,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  /**
   * Fetches a specific personalized roadmap by ID with strict ownership verification.
   */
  async getRoadmapById(roadmapId, authUser) {
    if (!authUser || !authUser.id) {
      throw new PersonalizedRoadmapError("Authentication required.", 401, "UNAUTHORIZED");
    }
    if (!roadmapId) {
      throw new PersonalizedRoadmapError("Roadmap ID is required.", 400, "BAD_REQUEST");
    }

    const roadmap = await prisma.personalizedRoadmap.findUnique({
      where: { id: roadmapId },
      select: { userId: true },
    });

    if (!roadmap) {
      throw new PersonalizedRoadmapError("Personalized roadmap not found.", 404, "NOT_FOUND");
    }

    // Strict User Isolation Guard: only owner or ADMIN may view
    if (roadmap.userId !== authUser.id && authUser.role !== "ADMIN") {
      throw new PersonalizedRoadmapError(
        "Access denied. You do not have permission to view this roadmap.",
        403,
        "FORBIDDEN"
      );
    }

    return await this._getRoadmapWithGraph(roadmapId);
  }

  /**
   * Updates completion status of a topic node in PostgreSQL and synchronizes roadmap progress.
   */
  async updateTopicProgress(roadmapId, nodeKeyOrId, newStatus, authUser) {
    if (!authUser || !authUser.id) {
      throw new PersonalizedRoadmapError("Authentication required.", 401, "UNAUTHORIZED");
    }

    const roadmap = await prisma.personalizedRoadmap.findUnique({
      where: { id: roadmapId },
      select: { id: true, userId: true },
    });

    if (!roadmap) {
      throw new PersonalizedRoadmapError("Roadmap not found.", 404, "NOT_FOUND");
    }

    // Strict User Isolation Guard
    if (roadmap.userId !== authUser.id && authUser.role !== "ADMIN") {
      throw new PersonalizedRoadmapError(
        "Access denied. You do not have permission to modify this roadmap.",
        403,
        "FORBIDDEN"
      );
    }

    const normalizedStatus = normalizeStatus(newStatus);

    return await prisma.$transaction(async (tx) => {
      // Find node by nodeKey or id
      const node = await tx.personalizedRoadmapNode.findFirst({
        where: {
          roadmapId,
          OR: [{ nodeKey: nodeKeyOrId }, { id: nodeKeyOrId }],
        },
      });

      if (!node) {
        throw new PersonalizedRoadmapError("Topic node not found in this roadmap.", 404, "NOT_FOUND");
      }

      // Update node status
      const updatedNode = await tx.personalizedRoadmapNode.update({
        where: { id: node.id },
        data: {
          status: normalizedStatus,
          completedAt: normalizedStatus === "COMPLETED" ? new Date() : null,
        },
      });

      // Recalculate overall roadmap completion
      const allNodes = await tx.personalizedRoadmapNode.findMany({
        where: { roadmapId },
        select: { status: true },
      });

      const totalNodes = allNodes.length;
      const completedCount = allNodes.filter((n) => n.status === "COMPLETED").length;
      const progressPercent =
        totalNodes > 0 ? Math.round((completedCount / totalNodes) * 100) : 0;
      const overallStatus =
        progressPercent === 100
          ? "COMPLETED"
          : progressPercent > 0
          ? "IN_PROGRESS"
          : "NOT_STARTED";

      await tx.personalizedRoadmap.update({
        where: { id: roadmapId },
        data: {
          progressPercent,
          status: overallStatus,
        },
      });

      return {
        stepId: node.nodeKey,
        nodeId: node.id,
        status: normalizedStatus.toLowerCase(),
        completedCount,
        totalNodes,
        progressPercent,
        overallStatus,
      };
    });
  }

  /**
   * Deletes a personalized roadmap with cascade deletion of levels, nodes, and edges.
   */
  async deleteRoadmap(roadmapId, authUser) {
    if (!authUser || !authUser.id) {
      throw new PersonalizedRoadmapError("Authentication required.", 401, "UNAUTHORIZED");
    }

    const roadmap = await prisma.personalizedRoadmap.findUnique({
      where: { id: roadmapId },
      select: { userId: true },
    });

    if (!roadmap) {
      throw new PersonalizedRoadmapError("Roadmap not found.", 404, "NOT_FOUND");
    }

    if (roadmap.userId !== authUser.id && authUser.role !== "ADMIN") {
      throw new PersonalizedRoadmapError("Access denied.", 403, "FORBIDDEN");
    }

    await prisma.personalizedRoadmap.delete({
      where: { id: roadmapId },
    });

    return { deleted: true, id: roadmapId };
  }
}

const personalizedRoadmapsService = new PersonalizedRoadmapsService();

module.exports = {
  personalizedRoadmapsService,
  PersonalizedRoadmapError,
  normalizeRagRoadmap,
};

