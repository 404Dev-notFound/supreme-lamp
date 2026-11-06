/**
 * flowCTRL Data Structures & Algorithms (DSA) Knowledge Engine
 * Supports 24 programming languages from reference-repositories/2nd/DSA/
 * with deep architectural explanations, step-by-step intuition, complexity profiles,
 * flowcharts, and genuine code implementations.
 */

const fs = require('fs');
const path = require('path');

let UNIFIED_DSA = null;
try {
  const dataPath = path.resolve(__dirname, '..', '..', '..', 'data', 'unified_dsa.json');
  if (fs.existsSync(dataPath)) {
    UNIFIED_DSA = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  }
} catch (e) {
  console.warn("Could not load unified_dsa.json:", e.message);
}

const DSA_DATA = UNIFIED_DSA?.algorithms || [];
const LANGUAGES = UNIFIED_DSA?.languages || [];

class DsaService {
  listAlgorithms({ category, difficulty, search, language } = {}) {
    let result = DSA_DATA;

    if (language && language !== "all") {
      result = result.filter(a => a.codeSnippets && a.codeSnippets[language]);
    }

    if (category && category !== "all") {
      result = result.filter(a => a.category.toLowerCase().includes(category.toLowerCase()));
    }

    if (difficulty && difficulty !== "all") {
      result = result.filter(a => a.difficulty.toLowerCase() === difficulty.toLowerCase());
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(a => 
        a.title.toLowerCase().includes(q) ||
        (a.description && a.description.toLowerCase().includes(q)) ||
        (a.problemStatement && a.problemStatement.toLowerCase().includes(q)) ||
        a.category.toLowerCase().includes(q)
      );
    }

    return result;
  }

  getAlgorithmBySlug(slug) {
    return DSA_DATA.find(a => a.slug === slug) || null;
  }

  getCategories() {
    const cats = new Set(DSA_DATA.map(a => a.category));
    return Array.from(cats);
  }

  getLanguages() {
    return LANGUAGES;
  }
}

const dsaService = new DsaService();

module.exports = {
  dsaService,
  DSA_DATA,
  LANGUAGES,
};
