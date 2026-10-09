const { Embedder } = require("./embedder");
const { VectorStore } = require("./vectorStore");
const config = require("../config");

/**
 * Hybrid Semantic Retriever with Prerequisite Graph Resolution and Metadata Filtering.
 */
class Retriever {
  constructor(vectorStore, embedder) {
    this.vectorStore = vectorStore || new VectorStore();
    this.embedder = embedder || new Embedder();
  }

  async init() {
    await this.vectorStore.init();
  }

  /**
   * Constructs an optimized semantic query from user profile & identified skill gaps.
   */
  constructQuery(userProfile, skillGaps = []) {
    const parts = [];

    if (userProfile.targetRole) {
      parts.push(`Target Role: ${userProfile.targetRole}`);
    }
    if (userProfile.targetCompanyType) {
      parts.push(`Company Type: ${userProfile.targetCompanyType}`);
    }
    if (userProfile.targetDomain) {
      parts.push(`Domain: ${userProfile.targetDomain}`);
    }
    if (Array.isArray(userProfile.careerGoals) && userProfile.careerGoals.length > 0) {
      parts.push(`Goals: ${userProfile.careerGoals.join(" ")}`);
    }

    if (Array.isArray(skillGaps) && skillGaps.length > 0) {
      const gapNames = skillGaps
        .map((g) => (typeof g === "string" ? g : g.name))
        .filter(Boolean);
      parts.push(`Skill Gaps to master: ${gapNames.join(" ")}`);
    }

    return parts.join(" | ");
  }

  /**
   * Retrieves top relevant documents based on user profile, skill gaps, and prerequisites
   */
  async retrieve({ userProfile, skillGaps = [], topK = config.vectorStore.topK }) {
    await this.init();

    const query = this.constructQuery(userProfile, skillGaps);
    const queryVector = await this.embedder.embedText(query);

    // Metadata filter configuration
    const filter = {};
    if (userProfile.targetDomain && userProfile.targetDomain !== "Other") {
      filter.domain = userProfile.targetDomain;
    }

    // 1. Primary semantic search with domain filter
    let results = this.vectorStore.similaritySearch(queryVector, {
      topK,
      filter: Object.keys(filter).length > 0 ? filter : null,
      minSimilarity: config.vectorStore.similarityThreshold,
    });

    // 2. Fallback to unfiltered search if strict filter returned fewer than 3 items
    if (results.length < 3) {
      const broaderResults = this.vectorStore.similaritySearch(queryVector, {
        topK,
        filter: null,
        minSimilarity: 0.15,
      });

      // Merge and deduplicate by document id
      const existingIds = new Set(results.map((r) => r.id));
      for (const item of broaderResults) {
        if (!existingIds.has(item.id)) {
          results.push(item);
          existingIds.add(item.id);
        }
      }
    }

    // 3. Prerequisite Graph Expansion:
    // If a retrieved topic requires prerequisites that the user doesn't know yet,
    // fetch those prerequisites to prevent learning gaps!
    const knownSkills = new Set(
      Array.isArray(userProfile.currentSkills)
        ? userProfile.currentSkills.map((s) => (typeof s === "string" ? s.toLowerCase() : s.name.toLowerCase()))
        : []
    );

    const retrievedTopics = new Set(results.map((r) => r.metadata?.topic?.toLowerCase()).filter(Boolean));
    const missingPrereqs = [];

    for (const doc of results) {
      const prereqs = doc.metadata?.prerequisites || [];
      for (const p of prereqs) {
        const cleanP = String(p).toLowerCase();
        if (!knownSkills.has(cleanP) && !retrievedTopics.has(cleanP)) {
          missingPrereqs.push(p);
          retrievedTopics.add(cleanP);
        }
      }
    }

    if (missingPrereqs.length > 0) {
      for (const prereqName of missingPrereqs.slice(0, 3)) {
        const prereqVector = await this.embedder.embedText(`Prerequisite Skill: ${prereqName}`);
        const prereqResults = this.vectorStore.similaritySearch(prereqVector, {
          topK: 1,
          minSimilarity: 0.15,
        });
        if (prereqResults.length > 0 && !results.some((r) => r.id === prereqResults[0].id)) {
          results.unshift({
            ...prereqResults[0],
            isPrerequisiteExpansion: true,
          });
        }
      }
    }

    return results;
  }
}

module.exports = {
  Retriever,
};
