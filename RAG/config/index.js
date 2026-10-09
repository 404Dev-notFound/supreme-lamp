const path = require("path");

const config = {
  env: process.env.NODE_ENV || "development",
  isTest: process.env.NODE_ENV === "test",

  // LLM Provider: 'openai' | 'gemini' | 'local'
  llmProvider: process.env.RAG_LLM_PROVIDER || "local",

  openai: {
    apiKey: process.env.OPENAI_API_KEY || "",
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
  },

  gemini: {
    apiKey: process.env.GEMINI_API_KEY || "",
    model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
    embeddingModel: process.env.GEMINI_EMBEDDING_MODEL || "text-embedding-004",
  },

  vectorStore: {
    storagePath: process.env.RAG_VECTOR_STORE_PATH
      ? path.resolve(process.env.RAG_VECTOR_STORE_PATH)
      : path.resolve(__dirname, "../data/vector_store.json"),
    chunkSize: parseInt(process.env.RAG_CHUNK_SIZE || "500", 10),
    chunkOverlap: parseInt(process.env.RAG_CHUNK_OVERLAP || "50", 10),
    topK: parseInt(process.env.RAG_TOP_K || "8", 10),
    similarityThreshold: parseFloat(process.env.RAG_SIMILARITY_THRESHOLD || "0.25"),
    maxContextTokens: parseInt(process.env.RAG_MAX_CONTEXT_TOKENS || "3500", 10),
  },

  knowledgeBasePath: path.resolve(__dirname, "../knowledge_base"),
  systemDataPath: path.resolve(__dirname, "../../packages/roadmap-data/src/data"),

  security: {
    allowPromptOverride: process.env.RAG_ALLOW_PROMPT_OVERRIDE === "true",
    maxInputChars: 5000,
  },
};

module.exports = config;
