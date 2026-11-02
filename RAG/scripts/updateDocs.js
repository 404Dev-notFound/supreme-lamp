#!/usr/bin/env node

/**
 * flowCTRL RAG Document Update Utility.
 * Allows adding, updating, or validating documents in the knowledge base.
 * Usage: node scripts/updateDocs.js --add <jsonFile>
 */
const fs = require("fs");
const path = require("path");
const config = require("../config");
const { createTopicChunk } = require("../pipeline/chunker");
const { Embedder } = require("../pipeline/embedder");
const { VectorStore } = require("../pipeline/vectorStore");

async function main() {
  const args = process.argv.slice(2);
  const action = args[0];
  const targetFile = args[1];

  if (!action || !targetFile) {
    console.log("Usage: node scripts/updateDocs.js --add <path-to-json>");
    console.log("       node scripts/updateDocs.js --remove <topicId>");
    process.exit(1);
  }

  const store = new VectorStore();
  await store.init();
  const embedder = new Embedder();

  if (action === "--add") {
    if (!fs.existsSync(targetFile)) {
      console.error(`File not found: ${targetFile}`);
      process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(targetFile, "utf-8"));
    const items = Array.isArray(data) ? data : [data];

    for (const item of items) {
      const chunk = createTopicChunk(item);
      const vector = await embedder.embedText(chunk.content);
      store.addDocument({ ...chunk, vector });
      console.log(`Indexed: ${chunk.metadata.topic}`);
    }

    await store.save();
    console.log(`Updated vector store. Total documents: ${store.count()}`);
  } else if (action === "--remove") {
    const topicId = targetFile;
    store.documents = store.documents.filter((d) => d.id !== topicId && d.metadata?.topicId !== topicId);
    await store.save();
    console.log(`Removed document ${topicId}. Remaining documents: ${store.count()}`);
  }
}

main().catch(console.error);
