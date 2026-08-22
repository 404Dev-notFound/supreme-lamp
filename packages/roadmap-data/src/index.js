const indexData = require("./data/index.json");

function getAllRoadmaps() {
  return indexData || [];
}

function getRoadmapBySlug(slug) {
  try {
    return require(`./data/${slug}.json`);
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
      r.category.toLowerCase().includes(q)
  );
}

module.exports = {
  getAllRoadmaps,
  getRoadmapBySlug,
  getTopicDetail,
  searchRoadmaps,
};
