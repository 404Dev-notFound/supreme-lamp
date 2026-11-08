/**
 * flowCTRL Data Structures & Algorithms (DSA) Knowledge Engine
 * Supports 24 programming languages from reference-repositories/2nd/DSA/
 * with deep architectural explanations, step-by-step intuition, complexity profiles,
 * flowcharts, and genuine code implementations.
 */

const fs = require('fs');
const path = require('path');

let UNIFIED_DSA = null;

function loadUnifiedDsa() {
  if (UNIFIED_DSA && Array.isArray(UNIFIED_DSA.algorithms) && UNIFIED_DSA.algorithms.length > 0) {
    return UNIFIED_DSA;
  }

  const candidatePaths = [
    // 4 levels up: from apps/backend/src/services to root
    path.resolve(__dirname, '..', '..', '..', '..', 'data', 'unified_dsa.json'),
    // 3 levels up: from apps/backend/src to root / apps
    path.resolve(__dirname, '..', '..', '..', 'data', 'unified_dsa.json'),
    // from current working directory
    path.resolve(process.cwd(), 'data', 'unified_dsa.json'),
    path.resolve(process.cwd(), '..', 'data', 'unified_dsa.json'),
    path.resolve(process.cwd(), '..', '..', 'data', 'unified_dsa.json'),
  ];

  for (const p of candidatePaths) {
    try {
      if (fs.existsSync(p)) {
        const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
        if (raw && Array.isArray(raw.algorithms) && raw.algorithms.length > 0) {
          UNIFIED_DSA = raw;
          return UNIFIED_DSA;
        }
      }
    } catch (e) {
      console.warn(`Could not parse unified_dsa.json at ${p}:`, e.message);
    }
  }

  return { algorithms: [], languages: [] };
}

// Initial load
loadUnifiedDsa();

class DsaService {
  getAlgorithmsData() {
    return loadUnifiedDsa().algorithms || [];
  }

  getLanguagesData() {
    return loadUnifiedDsa().languages || [];
  }

  listAlgorithms({ category, difficulty, search, language } = {}) {
    let result = this.getAlgorithmsData();

    if (language && language !== "all") {
      result = result.filter(a => a.codeSnippets && a.codeSnippets[language]);
    }

    if (category && category !== "all") {
      result = result.filter(a => a.category && a.category.toLowerCase().includes(category.toLowerCase()));
    }

    if (difficulty && difficulty !== "all") {
      result = result.filter(a => a.difficulty && a.difficulty.toLowerCase() === difficulty.toLowerCase());
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(a => 
        (a.title && a.title.toLowerCase().includes(q)) ||
        (a.description && a.description.toLowerCase().includes(q)) ||
        (a.problemStatement && a.problemStatement.toLowerCase().includes(q)) ||
        (a.category && a.category.toLowerCase().includes(q))
      );
    }

    return result;
  }

  getAlgorithmBySlug(slug) {
    return this.getAlgorithmsData().find(a => a.slug === slug) || null;
  }

  getCategories() {
    const cats = new Set(this.getAlgorithmsData().map(a => a.category).filter(Boolean));
    return Array.from(cats);
  }

  getLanguages() {
    return this.getLanguagesData();
  }
}

const dsaService = new DsaService();

module.exports = {
  dsaService,
  get DSA_DATA() { return dsaService.getAlgorithmsData(); },
  get LANGUAGES() { return dsaService.getLanguagesData(); },
};
