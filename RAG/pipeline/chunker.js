/**
 * Semantic Chunker for flowCTRL RAG Pipeline.
 * Breaks knowledge base documents and roadmaps into semantically coherent chunks
 * while strictly preserving hierarchical metadata, prerequisites, and resource links.
 */

function cleanText(text) {
  if (typeof text !== "string") return "";
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n/g, "\n\n")
    .trim();
}

/**
 * Splits text into chunks with sliding overlap window
 */
function splitIntoChunks(text, chunkSize = 500, chunkOverlap = 50) {
  const clean = cleanText(text);
  if (!clean) return [];
  if (clean.length <= chunkSize) return [clean];

  const words = clean.split(" ");
  const chunks = [];
  let currentWords = [];
  let currentLength = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    currentWords.push(word);
    currentLength += word.length + 1;

    if (currentLength >= chunkSize) {
      chunks.push(currentWords.join(" "));
      // Slide back for overlap
      const overlapWordCount = Math.floor(chunkOverlap / 6);
      currentWords = currentWords.slice(-overlapWordCount);
      currentLength = currentWords.join(" ").length;
    }
  }

  if (currentWords.length > 0) {
    const remaining = currentWords.join(" ");
    if (chunks.length === 0 || remaining !== chunks[chunks.length - 1]) {
      chunks.push(remaining);
    }
  }

  return chunks;
}

/**
 * Transforms a structured roadmap topic or knowledge item into semantic chunks with metadata
 */
function createTopicChunk({
  topicId,
  topic,
  description = "",
  domain = "General",
  careerPath = "General",
  role = "",
  stage = "Core Skills",
  difficulty = "Intermediate",
  prerequisites = [],
  skills = [],
  companyType = [],
  resources = [],
  practiceTasks = [],
  projectApplication = "",
  completionCriteria = "",
  nextRecommendedStep = "",
  source = "knowledge_base",
}) {
  const cleanTopic = cleanText(topic);
  const cleanDesc = cleanText(description);

  let formattedResources = "No resources specified";
  if (Array.isArray(resources) && resources.length > 0) {
    formattedResources = resources
      .map((r) => `- [${r.type || "resource"}] ${r.title}: ${r.url || "Resource not available in the current knowledge base"}`)
      .join("\n");
  }

  const tasksText = Array.isArray(practiceTasks) && practiceTasks.length > 0
    ? practiceTasks.map((t) => `* Task: ${t}`).join("\n")
    : "";

  const content = `
### Topic: ${cleanTopic}
**Domain:** ${domain} | **Career Path:** ${careerPath} | **Stage:** ${stage}
**Difficulty:** ${difficulty}
**Prerequisites:** ${prerequisites.join(", ") || "None"}
**Key Skills:** ${skills.join(", ") || cleanTopic}

**Description & Concepts:**
${cleanDesc}

**Practice Tasks & Application:**
${tasksText}
${projectApplication ? `* Real-World Project: ${projectApplication}` : ""}
${completionCriteria ? `* Completion Proof: ${completionCriteria}` : ""}
${nextRecommendedStep ? `* Next Step: ${nextRecommendedStep}` : ""}

**Verified Learning Resources:**
${formattedResources}
`.trim();

  return {
    id: `chunk_${topicId || cleanTopic.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
    content,
    metadata: {
      topicId: topicId || null,
      topic: cleanTopic,
      domain,
      careerPath,
      role,
      stage,
      difficulty,
      prerequisites: Array.isArray(prerequisites) ? prerequisites : [],
      skills: Array.isArray(skills) && skills.length > 0 ? skills : [cleanTopic],
      companyType: Array.isArray(companyType) ? companyType : [companyType].filter(Boolean),
      resources: Array.isArray(resources) ? resources : [],
      practiceTasks: Array.isArray(practiceTasks) ? practiceTasks : [],
      projectApplication,
      completionCriteria,
      nextRecommendedStep,
      source,
    },
  };
}

module.exports = {
  cleanText,
  splitIntoChunks,
  createTopicChunk,
};
