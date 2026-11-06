const indexData = require("./data/index.json");

function getAllRoadmaps() {
  return indexData || [];
}

function getRoadmapBySlug(slug) {
  try {
    const raw = require(`./data/${slug}.json`);
    if (!raw) return null;

    // Enforce unique node and edge identity preservation
    let cleanNodes = raw.nodes;
    if (Array.isArray(raw.nodes)) {
      const seenNodeIds = new Set();
      cleanNodes = [];
      for (const node of raw.nodes) {
        if (node?.id && !seenNodeIds.has(node.id)) {
          seenNodeIds.add(node.id);
          cleanNodes.push(node);
        }
      }
    }

    let cleanEdges = raw.edges;
    if (Array.isArray(raw.edges)) {
      const seenEdgeIds = new Set();
      cleanEdges = [];
      for (const edge of raw.edges) {
        if (edge?.id && edge.source !== edge.target && !seenEdgeIds.has(edge.id)) {
          seenEdgeIds.add(edge.id);
          cleanEdges.push(edge);
        }
      }
    }

    return {
      ...raw,
      nodes: cleanNodes,
      edges: cleanEdges,
    };
  } catch (err) {
    return null;
  }
}

function getTopicDetail(slug, topicId) {
  const roadmap = getRoadmapBySlug(slug);
  if (!roadmap || !roadmap.topics) return null;
  return roadmap.topics[topicId] || null;
}

function searchRoadmaps(query) {
  const all = getAllRoadmaps();
  if (!query || !query.trim()) return all;
  const q = query.toLowerCase().trim();
  return all.filter(
    (r) =>
      r.title.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.slug.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q),
  );
}

module.exports = {
  getAllRoadmaps,
  getRoadmapBySlug,
  getTopicDetail,
  searchRoadmaps,
};
