const fs = require('fs');
const path = require('path');
const slugify = require('slugify');

// Curated tutorials with deep learning steps & resources
let curatedTutorials = [];
try {
  const seedModule = require(path.resolve(__dirname, '..', 'scratch', 'extracted_seed_tutorials.js'));
  if (seedModule && seedModule.tutorialsData) {
    curatedTutorials = seedModule.tutorialsData;
  }
} catch (e) {
  console.warn('Note: Could not load curated seed tutorials:', e.message);
}

// Reference repo base path with safe internal fallback
const externalRepoPath = path.resolve(__dirname, '..', '..', 'reference-repositories');
const REPO_ROOT = fs.existsSync(externalRepoPath) ? externalRepoPath : path.resolve(__dirname, '..', 'data');

// Repos to process
const REPOS = [
  'build-your-own-x',
  'project-based-learning',
  'projectlearn-project-based-learning',
  'Projects-from-Scratch',
  'mrigankad-project-learning',
];

/**
 * Parse build-your-own-x format:
 *   #### Build your own `Category`
 *   * [**Language**: _Title_](URL)
 */
function parseBuildYourOwnX(content, source) {
  const projects = [];
  let currentCategory = '';
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    // Category heading: #### Build your own `Something`
    const catMatch = line.match(/^#{1,5}\s+Build your own\s+`?(.+?)`?\s*$/i);
    if (catMatch) {
      currentCategory = catMatch[1].trim();
      continue;
    }
    // Project entry: * [**Language**: _Title_](URL)
    const projMatch = line.match(/^\s*\*\s+\[\*\*(.+?)\*\*:\s*_(.+?)_\]\((.+?)\)/);
    if (projMatch) {
      const language = projMatch[1].trim();
      const title = projMatch[2].trim();
      const tutorialUrl = projMatch[3].trim();
      projects.push({
        title,
        description: `Build your own ${currentCategory} using ${language}`,
        projectType: currentCategory || 'tutorial',
        language,
        tutorialUrl,
        githubUrl: tutorialUrl.includes('github.com') ? tutorialUrl : '',
        source,
        difficulty: '',
      });
    }
  }
  return projects;
}

/**
 * Parse project-based-learning format:
 *   ## Language:
 *   - [Title](URL)
 *   - Sub-items with [Title](URL)
 */
function parseProjectBasedLearning(content, source) {
  const projects = [];
  let currentLanguage = '';
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    // Language heading: ## C/C++:  or  ## JavaScript:
    const langMatch = line.match(/^#{2,4}\s+(.+?):?\s*$/);
    if (langMatch && !line.includes('Table of Contents') && !line.includes('Additional')) {
      currentLanguage = langMatch[1].trim();
      continue;
    }
    // Project entry: - [Title](URL)  or  - [Title](URL) additional text
    const projMatch = line.match(/^\s*[-*]\s+\[(.+?)\]\((.+?)\)/);
    if (projMatch) {
      const title = projMatch[1].trim();
      const tutorialUrl = projMatch[2].trim();
      // Skip TOC links (internal anchors only)
      if (tutorialUrl.startsWith('#')) continue;
      // Skip badges, images
      if (title.startsWith('!') || tutorialUrl.includes('badge') || tutorialUrl.includes('img.shields')) continue;
      projects.push({
        title,
        description: currentLanguage ? `${currentLanguage} project tutorial` : 'Project tutorial',
        projectType: 'tutorial',
        language: currentLanguage,
        tutorialUrl,
        githubUrl: tutorialUrl.includes('github.com') ? tutorialUrl : '',
        source,
        difficulty: '',
      });
    }
  }
  return projects;
}

/**
 * Parse projectlearn format (markdown tables):
 *   | Project | Technologies | Link |
 *   | ChatBot That Talks Like a Pirate | React, TypeScript | [Link](URL) |
 */
function parseProjectLearn(content, source) {
  const projects = [];
  let currentCategory = '';
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    // Category heading: ### Web Development:
    const catMatch = line.match(/^#{2,4}\s+(.+?):?\s*$/);
    if (catMatch) {
      const cat = catMatch[1].trim();
      if (!cat.includes('Table') && !cat.includes('List of')) {
        currentCategory = cat;
      }
      continue;
    }
    // Table row: | Project Name | Technologies | [Link](URL) |
    const tableMatch = line.match(/^\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*\[(?:Link|link)\]\((.+?)\)\s*\|/);
    if (tableMatch) {
      const title = tableMatch[1].trim();
      const technologies = tableMatch[2].trim();
      const tutorialUrl = tableMatch[3].trim();
      // Skip header rows
      if (title === 'Project' || title.startsWith(':--') || title.startsWith('---')) continue;
      projects.push({
        title,
        description: `${currentCategory}: ${technologies}`,
        projectType: currentCategory || 'tutorial',
        language: technologies.split(',')[0]?.trim() || '',
        tutorialUrl,
        githubUrl: '',
        source,
        difficulty: '',
      });
    }
  }
  return projects;
}

/**
 * Parse Projects-from-Scratch format:
 *   * Topic
 *      * [Title](URL), Author
 */
function parseProjectsFromScratch(content, source) {
  const projects = [];
  let currentCategory = '';
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    // Category: * Topic (non-link bullet)
    const catMatch = line.match(/^\s*\*\s+([^[]+)$/);
    if (catMatch && !line.includes('http')) {
      currentCategory = catMatch[1].trim();
      continue;
    }
    // Project entry: * [Title](URL)
    const projMatch = line.match(/^\s*\*\s+\[(.+?)\]\((.+?)\)/);
    if (projMatch) {
      const title = projMatch[1].trim();
      const tutorialUrl = projMatch[2].trim();
      // Skip anchor links
      if (tutorialUrl.startsWith('#')) continue;
      projects.push({
        title,
        description: currentCategory ? `${currentCategory} project` : 'Project from scratch',
        projectType: currentCategory || 'tutorial',
        language: '',
        tutorialUrl,
        githubUrl: tutorialUrl.includes('github.com') ? tutorialUrl : '',
        source,
        difficulty: '',
      });
    }
  }
  return projects;
}

/**
 * Parse mrigankad format (tables with difficulty):
 *   | Difficulty | Project | What You'll Learn |
 *   | 🟡 | [Title](URL) | Description |
 *   Also handles: | Order | Project | Domain | Difficulty |
 */
function parseMrigankad(content, source) {
  const projects = [];
  let currentCategory = '';
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    // Category heading: ### C / C++  or  ## 💻 Programming Languages
    const catMatch = line.match(/^#{2,4}\s+(.+?)\s*$/);
    if (catMatch) {
      const cat = catMatch[1].replace(/[🟢🟡🔴💻🤖🌐📱☁️🔒⛓️📊🎮🥽🔌🗄️🏗️🧪🎨✍️🏆📚📌🗺️🚀]/gu, '').trim();
      if (cat && !cat.includes('Table') && !cat.includes('Legend') && !cat.includes('What Is') && !cat.includes('Who Is') && !cat.includes('What Makes')) {
        currentCategory = cat;
      }
      continue;
    }
    // Table row with link: | emoji | [Title](URL) | Description |
    const tableMatch = line.match(/\|\s*(?:🟢|🟡|🔴|\d+)?\s*\|\s*\[(.+?)\]\((.+?)\)\s*\|\s*(.+?)\s*\|/);
    if (tableMatch) {
      const title = tableMatch[1].trim();
      const tutorialUrl = tableMatch[2].trim();
      const learnDesc = tableMatch[3].trim();
      // Skip headers
      if (title === 'Project' || title.startsWith(':--') || title.startsWith('---')) continue;
      if (tutorialUrl.startsWith('#')) continue;
      // Extract difficulty
      let difficulty = '';
      if (line.includes('🟢')) difficulty = 'beginner';
      else if (line.includes('🟡')) difficulty = 'intermediate';
      else if (line.includes('🔴')) difficulty = 'advanced';
      projects.push({
        title,
        description: learnDesc || `${currentCategory} project`,
        projectType: currentCategory || 'tutorial',
        language: '',
        tutorialUrl,
        githubUrl: tutorialUrl.includes('github.com') ? tutorialUrl : '',
        source,
        difficulty,
      });
      continue;
    }
    // Also handle simple bullet links in this repo
    const bulletMatch = line.match(/^\s*[-*]\s+\[(.+?)\]\((.+?)\)/);
    if (bulletMatch) {
      const title = bulletMatch[1].trim();
      const url = bulletMatch[2].trim();
      if (url.startsWith('#')) continue;
      if (title.startsWith('!') || url.includes('badge') || url.includes('img.shields')) continue;
      // Skip navigation links (very short titles that are just anchors)
      if (title.length < 3) continue;
      projects.push({
        title,
        description: currentCategory ? `${currentCategory} project` : 'Project tutorial',
        projectType: currentCategory || 'tutorial',
        language: '',
        tutorialUrl: url,
        githubUrl: url.includes('github.com') ? url : '',
        source,
        difficulty: '',
      });
    }
  }
  return projects;
}

/**
 * Select the right parser for a given repo
 */
function getParser(repoName) {
  switch (repoName) {
    case 'build-your-own-x':
      return parseBuildYourOwnX;
    case 'project-based-learning':
      return parseProjectBasedLearning;
    case 'projectlearn-project-based-learning':
      return parseProjectLearn;
    case 'Projects-from-Scratch':
      return parseProjectsFromScratch;
    case 'mrigankad-project-learning':
      return parseMrigankad;
    default:
      return parseProjectBasedLearning; // fallback
  }
}

function collectProjects() {
  const allProjects = [];
  for (const repoName of REPOS) {
    const repoDir = path.join(REPO_ROOT, repoName);
    if (!fs.existsSync(repoDir)) {
      console.warn(`Repository not found: ${repoDir}`);
      continue;
    }
    const readmePath = path.join(repoDir, 'README.md');
    if (!fs.existsSync(readmePath)) {
      console.warn(`README.md not found in: ${repoDir}`);
      continue;
    }
    const content = fs.readFileSync(readmePath, 'utf8');
    const parser = getParser(repoName);
    const projects = parser(content, repoName);
    console.log(`  ${repoName}: extracted ${projects.length} projects`);
    allProjects.push(...projects);
  }
  return allProjects;
}

function deduplicate(projects) {
  const map = new Map();
  for (const p of projects) {
    const slug = p.slug || slugify(p.title || 'untitled', { lower: true, strict: true });
    if (!slug) continue;
    if (!map.has(slug)) {
      map.set(slug, { ...p, slug, sourceRepositories: p.sourceRepositories || [p.source] });
    } else {
      const existing = map.get(slug);
      const sourceList = p.sourceRepositories || (p.source ? [p.source] : []);
      for (const s of sourceList) {
        if (!existing.sourceRepositories.includes(s)) {
          existing.sourceRepositories.push(s);
        }
      }
      // Merge missing fields
      if (!existing.difficulty && p.difficulty) existing.difficulty = p.difficulty;
      if (!existing.githubUrl && p.githubUrl) existing.githubUrl = p.githubUrl;
      if (existing.description.length < p.description.length) existing.description = p.description;
      if (!existing.steps && p.steps) existing.steps = p.steps;
      if (!existing.resources && p.resources) existing.resources = p.resources;
      if (!existing.whatYouWillBuild && p.whatYouWillBuild) existing.whatYouWillBuild = p.whatYouWillBuild;
      if (!existing.learningOutcomes && p.learningOutcomes) existing.learningOutcomes = p.learningOutcomes;
    }
  }

  // Merge curated tutorials that have non-empty learning steps
  for (const cur of curatedTutorials) {
    if (map.has(cur.slug)) {
      const existing = map.get(cur.slug);
      existing.steps = cur.steps;
      existing.resources = cur.resources;
      existing.whatYouWillBuild = cur.whatYouWillBuild;
      existing.whyBuildThis = cur.whyBuildThis;
      existing.realWorldApplications = cur.realWorldApplications;
      existing.expectedOutcome = cur.expectedOutcome;
      existing.prerequisites = cur.prerequisites;
      existing.technologies = cur.technologies;
      existing.toolsRequired = cur.toolsRequired;
      existing.learningOutcomes = cur.learningOutcomes;
      existing.sourceAuthor = cur.sourceAuthor;
    } else {
      map.set(cur.slug, {
        slug: cur.slug,
        title: cur.title,
        description: cur.description,
        projectType: cur.categorySlug || 'tutorial',
        language: cur.language || '',
        difficulty: cur.difficulty || 'Intermediate',
        tutorialUrl: cur.resources?.[0]?.url || '',
        githubUrl: cur.resources?.find(r => r.resourceType === 'GITHUB_REPO')?.url || '',
        sourceRepositories: [cur.sourceRepo || 'build-your-own-x'],
        steps: cur.steps,
        resources: cur.resources,
        whatYouWillBuild: cur.whatYouWillBuild,
        whyBuildThis: cur.whyBuildThis,
        realWorldApplications: cur.realWorldApplications,
        expectedOutcome: cur.expectedOutcome,
        prerequisites: cur.prerequisites,
        technologies: cur.technologies,
        toolsRequired: cur.toolsRequired,
        learningOutcomes: cur.learningOutcomes,
        sourceAuthor: cur.sourceAuthor,
      });
    }
  }

  return Array.from(map.values());
}

function main() {
  console.log('Starting project extraction...\n');
  const raw = collectProjects();
  console.log(`\nTotal raw projects: ${raw.length}`);

  const unique = deduplicate(raw);
  unique.sort((a, b) => a.title.localeCompare(b.title));

  // Clean up output – remove internal 'source' field, keep sourceRepositories
  const output = unique.map(p => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    projectType: p.projectType,
    language: p.language || '',
    difficulty: p.difficulty || '',
    tutorialUrl: p.tutorialUrl,
    githubUrl: p.githubUrl || '',
    sourceRepositories: p.sourceRepositories,
    ...(p.steps && p.steps.length > 0 ? { steps: p.steps } : {}),
    ...(p.resources && p.resources.length > 0 ? { resources: p.resources } : {}),
    ...(p.whatYouWillBuild ? { whatYouWillBuild: p.whatYouWillBuild } : {}),
    ...(p.whyBuildThis ? { whyBuildThis: p.whyBuildThis } : {}),
    ...(p.realWorldApplications ? { realWorldApplications: p.realWorldApplications } : {}),
    ...(p.expectedOutcome ? { expectedOutcome: p.expectedOutcome } : {}),
    ...(p.prerequisites ? { prerequisites: p.prerequisites } : {}),
    ...(p.technologies ? { technologies: p.technologies } : {}),
    ...(p.toolsRequired ? { toolsRequired: p.toolsRequired } : {}),
    ...(p.learningOutcomes ? { learningOutcomes: p.learningOutcomes } : {}),
    ...(p.sourceAuthor ? { sourceAuthor: p.sourceAuthor } : {}),
  }));

  const outPath = path.resolve(__dirname, '..', 'data', 'unified_projects.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8');

  const withStepsCount = output.filter(p => p.steps && p.steps.length > 0).length;
  console.log(`\nUnique projects: ${unique.length}`);
  console.log(`Projects with non-empty learning steps: ${withStepsCount}`);
  console.log(`Wrote to: ${outPath}`);
}

main();
