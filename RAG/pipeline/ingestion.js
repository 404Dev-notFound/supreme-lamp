const fs = require("fs");
const path = require("path");
const config = require("../config");
const { createTopicChunk } = require("./chunker");
const { Embedder } = require("./embedder");
const { VectorStore } = require("./vectorStore");

/**
 * Ingestion Engine for flowCTRL RAG Pipeline.
 * Ingests structured domain curricula, career paths, skills taxonomy, company expectations,
 * and seamlessly indexes the platform's 90+ roadmap datasets.
 */
class IngestionEngine {
  constructor(options = {}) {
    this.knowledgeBasePath = options.knowledgeBasePath || config.knowledgeBasePath;
    this.systemDataPath = options.systemDataPath || config.systemDataPath;
    this.vectorStore = options.vectorStore || new VectorStore();
    this.embedder = options.embedder || new Embedder();
  }

  /**
   * Runs the full ingestion pipeline
   */
  async ingestAll({ verbose = false } = {}) {
    await this.vectorStore.init();
    let totalChunks = 0;

    if (verbose) console.log("[Ingest] Starting ingestion from knowledge base...");

    // 1. Ingest Domain Files from RAG/knowledge_base/domains/
    const domainsDir = path.join(this.knowledgeBasePath, "domains");
    if (fs.existsSync(domainsDir)) {
      const files = fs.readdirSync(domainsDir).filter((f) => f.endsWith(".json"));
      for (const file of files) {
        const fullPath = path.join(domainsDir, file);
        const data = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
        const count = await this.ingestDomainCurriculum(data);
        totalChunks += count;
        if (verbose) console.log(`[Ingest] Ingested ${count} topics from domain: ${file}`);
      }
    }

    // 2. Ingest Career Paths & Progression
    const careerPathsFile = path.join(this.knowledgeBasePath, "career_paths.json");
    if (fs.existsSync(careerPathsFile)) {
      const paths = JSON.parse(fs.readFileSync(careerPathsFile, "utf-8"));
      const count = await this.ingestCareerPaths(paths);
      totalChunks += count;
      if (verbose) console.log(`[Ingest] Ingested ${count} career path profiles`);
    }

    // 3. Ingest Company Profiles
    const companyFile = path.join(this.knowledgeBasePath, "company_profiles.json");
    if (fs.existsSync(companyFile)) {
      const companies = JSON.parse(fs.readFileSync(companyFile, "utf-8"));
      const count = await this.ingestCompanyProfiles(companies);
      totalChunks += count;
      if (verbose) console.log(`[Ingest] Ingested ${count} company hiring expectation profiles`);
    }

    // 4. Ingest Curated Resources
    const resourcesFile = path.join(this.knowledgeBasePath, "curated_resources.json");
    if (fs.existsSync(resourcesFile)) {
      const resources = JSON.parse(fs.readFileSync(resourcesFile, "utf-8"));
      const count = await this.ingestCuratedResources(resources);
      totalChunks += count;
      if (verbose) console.log(`[Ingest] Ingested ${count} curated resource topics`);
    }

    // 5. Ingest Core Platform Roadmaps from packages/roadmap-data
    if (fs.existsSync(this.systemDataPath)) {
      const coreFiles = fs.readdirSync(this.systemDataPath).filter((f) => f.endsWith(".json") && f !== "index.json");
      // Select primary roadmaps to index into vector store
      const primaryRoadmaps = [
        "backend.json", "frontend.json", "full-stack.json", "ai-engineer.json",
        "cyber-security.json", "devops.json", "data-engineer.json", "machine-learning.json",
        "computer-science.json", "system-design.json", "react.json", "nodejs.json", "python.json"
      ];

      for (const rmFile of primaryRoadmaps) {
        const rmPath = path.join(this.systemDataPath, rmFile);
        if (fs.existsSync(rmPath)) {
          try {
            const rmData = JSON.parse(fs.readFileSync(rmPath, "utf-8"));
            const count = await this.ingestRoadmapData(rmData);
            totalChunks += count;
            if (verbose) console.log(`[Ingest] Ingested ${count} verified topics from platform roadmap: ${rmFile}`);
          } catch (e) {
            // Ignore corrupted individual files
          }
        }
      }
    }

    // Save persisted vector database to disk
    await this.vectorStore.save();
    if (verbose) console.log(`[Ingest] Ingestion complete. Stored ${this.vectorStore.count()} total vectors.`);

    return { totalChunks, vectorCount: this.vectorStore.count() };
  }

  async ingestDomainCurriculum(domainData) {
    let count = 0;
    const { domain, careerPath, stages = [] } = domainData;

    for (const stage of stages) {
      for (const item of stage.items || []) {
        const chunk = createTopicChunk({
          topic: item.topic,
          description: item.whyRecommended,
          domain,
          careerPath,
          stage: stage.stageName,
          difficulty: item.difficulty || "Intermediate",
          prerequisites: item.prerequisites || [],
          skills: item.skills || [],
          resources: item.recommendedResources || [],
          practiceTasks: item.practiceTasks || [],
          projectApplication: item.projectApplication || "",
          completionCriteria: item.completionCriteria || "",
          nextRecommendedStep: item.nextRecommendedStep || "",
          source: `domain_${careerPath.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
        });

        const vector = await this.embedder.embedText(chunk.content);
        this.vectorStore.addDocument({ ...chunk, vector });
        count++;
      }
    }
    return count;
  }

  async ingestCareerPaths(paths) {
    let count = 0;
    for (const cp of paths) {
      const content = `
### Career Path: ${cp.title}
**Domain:** ${cp.domain} | **Roles:** ${(cp.roles || []).join(", ")}
**Overview:** ${cp.description}
**Core Skills:** ${(cp.coreSkills || []).join(", ")}
**Company Types:** ${(cp.companySuitability || []).join(", ")}

**Progression Path:**
- Beginner: ${(cp.progression?.beginner || []).join("; ")}
- Intermediate: ${(cp.progression?.intermediate || []).join("; ")}
- Advanced: ${(cp.progression?.advanced || []).join("; ")}
`.trim();

      const chunk = {
        id: `career_path_${cp.id}`,
        content,
        metadata: {
          topic: cp.title,
          domain: cp.domain,
          careerPath: cp.title,
          role: (cp.roles || [])[0] || cp.title,
          difficulty: "Intermediate",
          companyType: cp.companySuitability || [],
          skills: cp.coreSkills || [],
          source: "career_paths",
        },
      };

      const vector = await this.embedder.embedText(chunk.content);
      this.vectorStore.addDocument({ ...chunk, vector });
      count++;
    }
    return count;
  }

  async ingestCompanyProfiles(companies) {
    let count = 0;
    for (const comp of companies) {
      const content = `
### Company Type Profile: ${comp.companyType}
**Focus:** ${(comp.primaryFocus || []).join(", ")}
**Interview Style:** ${(comp.interviewStyle || []).join(", ")}
**Roadmap Priorities:** ${(comp.roadmapEmphasis?.priorityTopics || []).join(", ")}
**Project Expectations:** ${comp.roadmapEmphasis?.projectExpectations || ""}
**Interview Weight:** ${comp.roadmapEmphasis?.interviewPrepWeight || ""}
`.trim();

      const chunk = {
        id: `company_${comp.companyType.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
        content,
        metadata: {
          topic: `${comp.companyType} Expectations`,
          companyType: [comp.companyType],
          difficulty: "Intermediate",
          skills: comp.roadmapEmphasis?.priorityTopics || [],
          source: "company_profiles",
        },
      };

      const vector = await this.embedder.embedText(chunk.content);
      this.vectorStore.addDocument({ ...chunk, vector });
      count++;
    }
    return count;
  }

  async ingestCuratedResources(resources) {
    let count = 0;
    for (const res of resources) {
      const chunk = createTopicChunk({
        topicId: res.skillId,
        topic: res.topic,
        description: `Verified resources, practice tasks, and project application for ${res.topic}`,
        resources: res.resources || [],
        practiceTasks: res.practiceTasks || [],
        projectApplication: res.projectIdea || "",
        source: "curated_resources",
      });

      const vector = await this.embedder.embedText(chunk.content);
      this.vectorStore.addDocument({ ...chunk, vector });
      count++;
    }
    return count;
  }

  async ingestRoadmapData(roadmap) {
    let count = 0;
    if (!roadmap || !roadmap.topics) return 0;

    const topicsObj = roadmap.topics;
    const category = roadmap.category || "role";
    const title = roadmap.title || roadmap.slug;

    for (const [topicId, topicData] of Object.entries(topicsObj)) {
      if (!topicData || !topicData.title) continue;

      const chunk = createTopicChunk({
        topicId: `rm_${roadmap.slug}_${topicId}`,
        topic: topicData.title,
        description: topicData.description || "",
        domain: "Software Development",
        careerPath: title,
        stage: "Core Skills",
        difficulty: roadmap.level || "Intermediate",
        resources: topicData.resources || [],
        source: `roadmap_${roadmap.slug}`,
      });

      const vector = await this.embedder.embedText(chunk.content);
      this.vectorStore.addDocument({ ...chunk, vector });
      count++;
    }

    return count;
  }
}

module.exports = {
  IngestionEngine,
};
