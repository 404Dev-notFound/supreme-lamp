#!/usr/bin/env node

/**
 * flowCTRL RAG Knowledge Base Ingestion Script.
 * Usage: node scripts/ingest.js [--verbose]
 */
const { IngestionEngine } = require("../pipeline/ingestion");

async function run() {
  const verbose = process.argv.includes("--verbose") || true;
  console.log("====================================================");
  console.log("flowCTRL RAG: Knowledge Base Ingestion & Vector Indexing");
  console.log("====================================================");

  try {
    const engine = new IngestionEngine();
    const result = await engine.ingestAll({ verbose });
    console.log("----------------------------------------------------");
    console.log(`Success: Ingested ${result.totalChunks} items into Vector Store.`);
    console.log(`Total Persistent Vectors: ${result.vectorCount}`);
    console.log("====================================================");
    process.exit(0);
  } catch (err) {
    console.error("Ingestion failed:", err);
    process.exit(1);
  }
}

run();
