const SAFE_IDENTIFIER_REGEX = /^[a-zA-Z0-9_-]{1,100}$/;

function validateSlug(slug) {
  if (!slug || typeof slug !== "string" || !SAFE_IDENTIFIER_REGEX.test(slug.trim())) {
    return {
      isValid: false,
      error: "Roadmap identifier must contain only alphanumeric characters, underscores, and hyphens.",
    };
  }
  return { isValid: true, slug: slug.trim() };
}

function validateTopicId(topicId) {
  if (!topicId || typeof topicId !== "string" || !SAFE_IDENTIFIER_REGEX.test(topicId.trim())) {
    return {
      isValid: false,
      error: "Topic identifier contains invalid characters.",
    };
  }
  return { isValid: true, topicId: topicId.trim() };
}

function sanitizeSearchQuery(query) {
  if (typeof query !== "string") return "";
  return query.trim().slice(0, 100);
}

function sanitizeFilterValue(val) {
  if (typeof val !== "string") return "";
  return val.trim().toLowerCase().slice(0, 50);
}

module.exports = {
  SAFE_IDENTIFIER_REGEX,
  validateSlug,
  validateTopicId,
  sanitizeSearchQuery,
  sanitizeFilterValue,
};

