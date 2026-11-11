/**
 * DEPRECATED / RETIRED IN PRODUCTION
 * Primary vector storage has been migrated to Python LangChain + Qdrant (flowctrl_kb_v2).
 * This module is retained strictly as an isolated in-memory test fallback.
 * Do not use as the primary vector store.
 */
const fs = require("fs");
const path = require("path");
const config = require("../config");

/**
 * Calculates cosine similarity between two numeric vectors.
 * Since vectors are L2 normalized, cosine similarity is equivalent to dot product.
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dot = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
  }
  return dot;
}

/**
 * Production-ready Persistent Vector Database.
 * Supports persistent storage, metadata filtering, semantic similarity search, and re-indexing.
 */
class VectorStore {
  constructor(storagePath = config.vectorStore.storagePath) {
    this.storagePath = storagePath;
    this.documents = []; // Array of { id, content, vector, metadata }
    this.loaded = false;
  }

  /**
   * Initializes and loads vector store from disk if present
   */
  async init() {
    if (this.loaded) return;
    try {
      if (fs.existsSync(this.storagePath)) {
        const raw = fs.readFileSync(this.storagePath, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.documents = parsed;
        }
      }
    } catch (err) {
      this.documents = [];
    }
    this.loaded = true;
  }

  /**
   * Adds or updates a document with its vector and metadata
   */
  addDocument({ id, content, vector, metadata = {} }) {
    if (!id || !content || !vector) {
      throw new Error("VectorStore document requires id, content, and vector.");
    }
    const existingIdx = this.documents.findIndex((d) => d.id === id);
    const doc = { id, content, vector, metadata, updatedAt: new Date().toISOString() };

    if (existingIdx >= 0) {
      this.documents[existingIdx] = doc;
    } else {
      this.documents.push(doc);
    }
  }

  /**
   * Adds a batch of documents
   */
  addDocuments(docs) {
    if (!Array.isArray(docs)) return;
    for (const doc of docs) {
      this.addDocument(doc);
    }
  }

  /**
   * Performs semantic similarity search with optional metadata filtering
   */
  similaritySearch(queryVector, options = {}) {
    const {
      topK = config.vectorStore.topK,
      minSimilarity = config.vectorStore.similarityThreshold,
      filter = null,
    } = options;

    if (!Array.isArray(queryVector) || this.documents.length === 0) {
      return [];
    }

    const scored = [];

    for (const doc of this.documents) {
      // 1. Apply metadata filter if supplied
      if (filter && typeof filter === "object") {
        let match = true;
        for (const [key, value] of Object.entries(filter)) {
          if (!doc.metadata) {
            match = false;
            break;
          }
          const docVal = doc.metadata[key];

          if (Array.isArray(value)) {
            // If value is array, docVal must match one or contain it
            if (Array.isArray(docVal)) {
              const hasCommon = value.some((v) => docVal.includes(v));
              if (!hasCommon) { match = false; break; }
            } else if (!value.includes(docVal)) {
              match = false;
              break;
            }
          } else if (Array.isArray(docVal)) {
            if (!docVal.includes(value)) {
              match = false;
              break;
            }
          } else if (docVal !== value) {
            match = false;
            break;
          }
        }
        if (!match) continue;
      }

      // 2. Compute similarity
      const similarity = cosineSimilarity(queryVector, doc.vector);
      if (similarity >= minSimilarity) {
        scored.push({
          id: doc.id,
          content: doc.content,
          metadata: doc.metadata,
          similarity,
        });
      }
    }

    // Sort descending by similarity score
    scored.sort((a, b) => b.similarity - a.similarity);

    return scored.slice(0, topK);
  }

  /**
   * Persists vector store to disk
   */
  async save() {
    const dir = path.dirname(this.storagePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.storagePath, JSON.stringify(this.documents, null, 2), "utf-8");
  }

  /**
   * Removes all records
   */
  clear() {
    this.documents = [];
    if (fs.existsSync(this.storagePath)) {
      try {
        fs.unlinkSync(this.storagePath);
      } catch (e) {}
    }
  }

  /**
   * Total indexed items
   */
  count() {
    return this.documents.length;
  }
}

module.exports = {
  VectorStore,
  cosineSimilarity,
};
