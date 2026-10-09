/**
 * flowCTRL RAG Module Entrypoint.
 * Exposes core RAG pipeline components, recommendation engine, roadmap generator, and progress trackers.
 */
const config = require("./config");
const { UserProfileMapper } = require("./services/userProfileMapper");
const { SkillGapAnalyzer } = require("./services/skillGapAnalyzer");
const { RoadmapGenerator } = require("./services/roadmapGenerator");
const { RecommendationEngine } = require("./services/recommendationEngine");
const { ProgressTracker } = require("./services/progressTracker");
const { Retriever } = require("./pipeline/retriever");
const { Reranker } = require("./pipeline/reranker");
const { Embedder, LocalSemanticEmbedder } = require("./pipeline/embedder");
const { VectorStore, cosineSimilarity } = require("./pipeline/vectorStore");
const { IngestionEngine } = require("./pipeline/ingestion");
const { LLMClient } = require("./llm/llmClient");
const { SYSTEM_PROMPT, buildRoadmapPrompt, buildRecommendationPrompt, sanitizeInput } = require("./config/promptTemplates");

module.exports = {
  config,
  // Services
  UserProfileMapper,
  SkillGapAnalyzer,
  RoadmapGenerator,
  RecommendationEngine,
  ProgressTracker,
  // Pipeline
  Retriever,
  Reranker,
  Embedder,
  LocalSemanticEmbedder,
  VectorStore,
  IngestionEngine,
  cosineSimilarity,
  // LLM
  LLMClient,
  // Prompt & Safety
  SYSTEM_PROMPT,
  buildRoadmapPrompt,
  buildRecommendationPrompt,
  sanitizeInput,
};
