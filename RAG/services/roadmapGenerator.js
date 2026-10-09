const { Retriever } = require("../pipeline/retriever");
const { Reranker } = require("../pipeline/reranker");
const { LLMClient } = require("../llm/llmClient");
const { buildRoadmapPrompt } = require("../config/promptTemplates");
const { SkillGapAnalyzer } = require("./skillGapAnalyzer");

/**
 * Production Personalized Roadmap Generator Orchestrator.
 */
class RoadmapGenerator {
  constructor(options = {}) {
    this.retriever = options.retriever || new Retriever();
    this.llmClient = options.llmClient || new LLMClient();
    this.skillGapAnalyzer = options.skillGapAnalyzer || new SkillGapAnalyzer();
  }

  /**
   * Generates a fully personalized, prerequisite-aware roadmap
   */
  async generateRoadmap(userProfile) {
    if (!userProfile || !userProfile.targetRole) {
      throw new Error("User profile with targetRole is required.");
    }

    // 1. Analyze skill gaps: Current Skills → Required Skills → Skill Gaps
    const gapAnalysis = this.skillGapAnalyzer.analyzeGaps({
      currentSkills: userProfile.currentSkills || [],
      targetRole: userProfile.targetRole,
      targetDomain: userProfile.targetDomain,
    });

    // 2. Retrieve relevant knowledge base chunks via vector similarity & prerequisite expansion
    const retrievedDocs = await this.retriever.retrieve({
      userProfile,
      skillGaps: gapAnalysis.skillGaps,
      topK: 12,
    });

    // 3. Rerank, deduplicate, and limit context token budget
    const rerankedDocs = Reranker.rerank(retrievedDocs, {
      userProfile,
      skillGaps: gapAnalysis.skillGaps,
    });

    const clippedContext = Reranker.clipContext(rerankedDocs);

    // 4. Construct strictly-bounded prompt preventing hallucinations and prompt injection
    const prompt = buildRoadmapPrompt({
      userProfile,
      skillGaps: gapAnalysis.skillGaps,
      retrievedContext: clippedContext,
    });

    // 5. Generate structured roadmap via Modular LLM Client
    const roadmapJson = await this.llmClient.generateCompletion({
      prompt,
      schemaType: "roadmap",
    });

    // 6. Enrich roadmap with metadata, gap metrics, and tracking IDs
    return this.postProcessRoadmap(roadmapJson, {
      userProfile,
      gapAnalysis,
      retrievedDocsCount: rerankedDocs.length,
    });
  }

  postProcessRoadmap(roadmap, { userProfile, gapAnalysis, retrievedDocsCount }) {
    let globalTopicIndex = 0;

    const stages = (roadmap.stages || []).map((stage, sIdx) => {
      const items = (stage.items || []).map((item, iIdx) => {
        globalTopicIndex++;
        const topicSlug = (item.topic || `topic-${globalTopicIndex}`)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-");

        return {
          id: `topic_${globalTopicIndex}_${topicSlug}`,
          index: globalTopicIndex,
          topic: item.topic,
          whyRecommended: item.whyRecommended,
          difficulty: item.difficulty || "Intermediate",
          prerequisites: Array.isArray(item.prerequisites) ? item.prerequisites : [],
          estimatedEffort: item.estimatedEffort || "15 hours (1-2 weeks)",
          recommendedResources: Array.isArray(item.recommendedResources) ? item.recommendedResources : [],
          practiceTasks: Array.isArray(item.practiceTasks) ? item.practiceTasks : [],
          projectApplication: item.projectApplication || "",
          completionCriteria: item.completionCriteria || "Demonstrate verified implementation",
          nextRecommendedStep: item.nextRecommendedStep || "Next roadmap topic",
          status: "Not Started", // Initial state
        };
      });

      return {
        stageId: `stage_${sIdx + 1}`,
        stageName: stage.stageName,
        stageDescription: stage.stageDescription || "",
        items,
      };
    });

    return {
      id: `rm_${Date.now()}_${(userProfile.targetRole || "dev").toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
      userId: userProfile.userId || null,
      roadmapTitle: roadmap.roadmapTitle || `Personalized ${userProfile.targetRole} Roadmap`,
      summary: roadmap.summary || "",
      targetRole: userProfile.targetRole,
      targetCompanyType: userProfile.targetCompanyType,
      experienceLevel: userProfile.experienceLevel,
      estimatedTotalWeeks: roadmap.estimatedTotalWeeks || 12,
      totalTopicsCount: globalTopicIndex,
      skillGapMetrics: {
        totalGapsIdentified: gapAnalysis.totalGapsCount,
        masteredSkillsCount: gapAnalysis.masteredSkills.length,
        inProgressSkillsCount: gapAnalysis.inProgressSkills.length,
      },
      stages,
      retrievalContextStats: {
        retrievedDocumentsCount: retrievedDocsCount,
        generatedAt: new Date().toISOString(),
      },
    };
  }
}

module.exports = {
  RoadmapGenerator,
};
