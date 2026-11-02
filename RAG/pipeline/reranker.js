const config = require("../config");

/**
 * Context Reranker, Deduplicator, and Token-Budget Manager.
 */
class Reranker {
  /**
   * Reranks retrieved items based on:
   * 1. Direct match with skill gaps (+0.4)
   * 2. Prerequisite precedence (+0.3)
   * 3. Target company alignment (+0.2)
   * 4. User experience level appropriateness (+0.1)
   */
  static rerank(retrievedDocs, { userProfile, skillGaps = [] }) {
    if (!Array.isArray(retrievedDocs)) return [];

    const gapSet = new Set(
      skillGaps.map((g) => (typeof g === "string" ? g.toLowerCase() : g.name?.toLowerCase())).filter(Boolean)
    );

    const companyType = userProfile?.targetCompanyType;
    const userLevel = (userProfile?.experienceLevel || "Beginner").toLowerCase();

    const scored = retrievedDocs.map((doc) => {
      let score = doc.similarity || 0.5;
      const meta = doc.metadata || {};
      const topicName = (meta.topic || "").toLowerCase();

      // 1. Boost if item directly addresses an identified skill gap
      if (gapSet.has(topicName)) {
        score += 0.4;
      }

      // 2. Boost if item is an unresolved prerequisite
      if (doc.isPrerequisiteExpansion) {
        score += 0.35;
      }

      // 3. Boost if item matches target company type expectations
      if (companyType && Array.isArray(meta.companyType) && meta.companyType.includes(companyType)) {
        score += 0.2;
      }

      // 4. Boost foundation items if user is Beginner, or advanced items if Senior
      const difficulty = (meta.difficulty || "Intermediate").toLowerCase();
      if (userLevel === "beginner" && difficulty === "beginner") {
        score += 0.15;
      } else if (userLevel === "senior" && difficulty === "advanced") {
        score += 0.15;
      }

      return {
        ...doc,
        rerankScore: score,
      };
    });

    // Sort descending by rerank score
    scored.sort((a, b) => b.rerankScore - a.rerankScore);

    // Deduplicate by topic title
    const seenTopics = new Set();
    const deduplicated = [];

    for (const item of scored) {
      const topic = (item.metadata?.topic || item.id).toLowerCase();
      if (!seenTopics.has(topic)) {
        seenTopics.add(topic);
        deduplicated.push(item);
      }
    }

    return deduplicated;
  }

  /**
   * Limits total context size according to token budget to prevent LLM overflow
   */
  static clipContext(docs, maxTokens = config.vectorStore.maxContextTokens) {
    if (!Array.isArray(docs)) return "";

    const selectedChunks = [];
    let estimatedTokens = 0;

    for (const doc of docs) {
      // Rough estimation: ~4 chars per token
      const chunkTokens = Math.ceil(doc.content.length / 4);
      if (estimatedTokens + chunkTokens > maxTokens) {
        break;
      }
      selectedChunks.push(doc.content);
      estimatedTokens += chunkTokens;
    }

    return selectedChunks.join("\n\n---\n\n");
  }
}

module.exports = {
  Reranker,
};
