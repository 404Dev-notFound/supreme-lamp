const { Retriever } = require("../pipeline/retriever");
const { Reranker } = require("../pipeline/reranker");
const { LLMClient } = require("../llm/llmClient");
const { buildRecommendationPrompt } = require("../config/promptTemplates");
const { SkillGapAnalyzer } = require("./skillGapAnalyzer");

/**
 * Dynamic Adaptive Recommendation Engine.
 * Recommends learning paths with human-readable explainability and adapts dynamically
 * when users complete topics or achieve milestones.
 */
class RecommendationEngine {
  constructor(options = {}) {
    this.retriever = options.retriever || new Retriever();
    this.llmClient = options.llmClient || new LLMClient();
    this.skillGapAnalyzer = options.skillGapAnalyzer || new SkillGapAnalyzer();
  }

  /**
   * Recommends optimal learning paths from user profile and detected gaps
   */
  async getRecommendations({ userProfile, completedTopics = [] }) {
    if (!userProfile) {
      throw new Error("User profile is required for recommendations.");
    }

    // 1. Incorporate completed topics into known skills
    const updatedSkills = [
      ...(userProfile.currentSkills || []),
      ...completedTopics.map((t) => ({ name: t, proficiency: 4 })),
    ];

    // 2. Re-evaluate remaining skill gaps
    const gapAnalysis = this.skillGapAnalyzer.analyzeGaps({
      currentSkills: updatedSkills,
      targetRole: userProfile.targetRole,
      targetDomain: userProfile.targetDomain,
    });

    const remainingGaps = gapAnalysis.skillGaps.map((g) => g.name);

    // 3. New Retrieval based on remaining skill gaps
    const retrievedDocs = await this.retriever.retrieve({
      userProfile,
      skillGaps: gapAnalysis.skillGaps,
      topK: 6,
    });

    const rerankedDocs = Reranker.rerank(retrievedDocs, {
      userProfile,
      skillGaps: gapAnalysis.skillGaps,
    });

    const clippedContext = Reranker.clipContext(rerankedDocs);

    // 4. Generate explainable recommendations
    const prompt = buildRecommendationPrompt({
      userProfile,
      completedTopics,
      remainingGaps,
      retrievedContext: clippedContext,
    });

    const completion = await this.llmClient.generateCompletion({
      prompt,
      schemaType: "recommendations",
    });

    // 5. Structure recommendations with clear explainability
    const recommendations = (completion.recommendations || []).map((rec, idx) => {
      let explainReason = rec.reason;
      if (!explainReason || explainReason.length < 10) {
        const knownStr = (userProfile.currentSkills || []).map((s) => (typeof s === "string" ? s : s.name)).slice(0, 3).join(", ");
        explainReason = `Recommended because you want to become a ${userProfile.targetRole} and currently know ${knownStr || "foundations"} but lack ${rec.topic} skills.`;
      }

      return {
        id: `rec_${idx + 1}_${(rec.topic || "skill").toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
        topic: rec.topic,
        reason: explainReason,
        priority: rec.priority || (idx === 0 ? "HIGH" : "MEDIUM"),
        estimatedEffort: rec.estimatedEffort || "15 hours",
        practiceMilestone: rec.practiceMilestone || `Demonstrate verified competency in ${rec.topic}`,
        adaptedAt: new Date().toISOString(),
      };
    });

    return {
      userId: userProfile.userId || null,
      targetRole: userProfile.targetRole,
      recentlyCompletedCount: completedTopics.length,
      remainingGapsCount: remainingGaps.length,
      recommendations,
    };
  }
}

module.exports = {
  RecommendationEngine,
};
