#!/usr/bin/env node

/**
 * flowCTRL RAG Reindexing Script.
 * Clears and regenerates the entire persistent vector store from knowledge base.
 * Usage: node scripts/reindex.js
 */
const { VectorStore } = require("../pipeline/vectorStore");
const { IngestionEngine } = require("../pipeline/ingestion");

async function run() {
  console.log("====================================================");
  console.log("flowCTRL RAG: Reindexing Vector Store");
  console.log("====================================================");

  try {
    const store = new VectorStore();
    await store.init();
    console.log(`Clearing ${store.count()} existing vectors...`);
    store.clear();

    const engine = new IngestionEngine({ vectorStore: store });
    const result = await engine.ingestAll({ verbose: true });

    console.log("----------------------------------------------------");
    console.log(`Reindex completed successfully.`);
    console.log(`Total Indexed Documents: ${result.vectorCount}`);
    console.log("====================================================");
    process.exit(0);
  } catch (err) {
    console.error("Reindexing failed:", err);
    process.exit(1);
  }
}

run();
