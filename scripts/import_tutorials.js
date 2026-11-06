/**
 * Idempotent import pipeline for unified_projects.json → ProjectTutorial table.
 * 
 * Usage: node scripts/import_tutorials.js
 * 
 * - Reads data/unified_projects.json
 * - Upserts each project into ProjectTutorial via Prisma (keyed on slug)
 * - Creates ProjectTutorialCategory records as needed
 * - Logs stats (created/updated/skipped/errors)
 * - Safe to re-run without duplicating data
 */

const fs = require('fs');
const path = require('path');

// Bootstrap Prisma using the same adapter setup as the backend
const { PrismaPg } = require(path.resolve(__dirname, '..', 'node_modules', '@prisma', 'adapter-pg'));
const { Pool } = require('pg');
const { PrismaClient } = require(path.resolve(__dirname, '..', 'node_modules', '@prisma', 'client'));

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword9555@localhost:5432/flowCTRL';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter, log: ['warn', 'error'] });

const DATA_FILE = path.resolve(__dirname, '..', 'data', 'unified_projects.json');

const BATCH_SIZE = 50;

// Map raw difficulty strings to schema enum values
function normalizeDifficulty(raw) {
  if (!raw) return 'Intermediate';
  const lower = raw.toLowerCase().trim();
  if (lower.includes('beginner') || lower.includes('easy')) return 'Beginner';
  if (lower.includes('advanced') || lower.includes('hard') || lower.includes('expert')) return 'Advanced';
  return 'Intermediate';
}

// Map projectType to a category slug
function toCategorySlug(projectType) {
  if (!projectType) return 'general';
  return projectType
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    || 'general';
}

// Map source repo names to full GitHub URLs
const SOURCE_REPO_URLS = {
  'build-your-own-x': 'https://github.com/codecrafters-io/build-your-own-x',
  'project-based-learning': 'https://github.com/practical-tutorials/project-based-learning',
  'projectlearn-project-based-learning': 'https://github.com/Xtremilicious/projectlearn-project-based-learning',
  'Projects-from-Scratch': 'https://github.com/AlgoryL/Projects-from-Scratch',
  'mrigankad-project-learning': 'https://github.com/mrigankad/project-learning',
};

async function ensureCategory(slug, name) {
  try {
    return await prisma.projectTutorialCategory.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        name: name || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        description: `Projects related to ${name || slug}`,
        icon: 'FolderGit2',
        sortOrder: 999,
      },
    });
  } catch (err) {
    // If category model doesn't exist or other issue, skip
    console.warn(`  Warning: could not upsert category "${slug}": ${err.message}`);
    return null;
  }
}

async function importProjects() {
  if (!fs.existsSync(DATA_FILE)) {
    console.error(`Data file not found: ${DATA_FILE}`);
    console.error('Run: node scripts/generate_unified_projects.js first');
    process.exit(1);
  }

  const projects = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  console.log(`Loaded ${projects.length} projects from ${DATA_FILE}\n`);

  const stats = { created: 0, updated: 0, skipped: 0, errors: 0 };
  const categoryCache = new Map();

  // Process in batches
  for (let i = 0; i < projects.length; i += BATCH_SIZE) {
    const batch = projects.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(projects.length / BATCH_SIZE);

    console.log(`Processing batch ${batchNum}/${totalBatches} (${batch.length} projects)...`);

    for (const project of batch) {
      try {
        const slug = project.slug;
        if (!slug) {
          stats.skipped++;
          continue;
        }

        const catSlug = toCategorySlug(project.projectType);
        
        // Ensure category exists
        if (!categoryCache.has(catSlug)) {
          const cat = await ensureCategory(catSlug, project.projectType);
          categoryCache.set(catSlug, cat);
        }

        const category = categoryCache.get(catSlug);
        const difficulty = normalizeDifficulty(project.difficulty);
        const language = project.language || '';
        const languages = language ? [language] : [];

        // Map sourceRepositories to full URLs
        const sourceRepos = (project.sourceRepositories || []).map(
          name => SOURCE_REPO_URLS[name] || name
        );

        const data = {
          title: project.title || slug,
          description: project.description || `Project tutorial: ${project.title}`,
          categorySlug: catSlug,
          categoryId: category?.id || null,
          language,
          languages,
          difficulty,
          projectType: 'TUTORIAL',
          tutorialUrl: project.tutorialUrl || null,
          githubUrl: project.githubUrl || null,
          sourceRepositories: sourceRepos,
          sourceRepo: sourceRepos[0] || null,
          sourceAuthor: project.sourceAuthor || null,
          whatYouWillBuild: project.whatYouWillBuild || null,
          whyBuildThis: project.whyBuildThis || null,
          realWorldApplications: project.realWorldApplications || null,
          expectedOutcome: project.expectedOutcome || null,
          prerequisites: project.prerequisites || [],
          technologies: project.technologies || [],
          toolsRequired: project.toolsRequired || [],
          learningOutcomes: project.learningOutcomes || [],
          isPublished: true,
          isFeatured: project.isFeatured || false,
        };

        const existing = await prisma.projectTutorial.findUnique({
          where: { slug },
          select: { id: true },
        });

        let targetId = null;
        if (existing) {
          const updatedRecord = await prisma.projectTutorial.update({
            where: { slug },
            data: {
              ...data,
              updatedAt: new Date(),
            },
          });
          targetId = updatedRecord.id;
          stats.updated++;
        } else {
          const createdRecord = await prisma.projectTutorial.create({
            data: {
              slug,
              ...data,
            },
          });
          targetId = createdRecord.id;
          stats.created++;
        }

        // Import Steps if present
        if (targetId && project.steps && project.steps.length > 0) {
          await prisma.projectStep.deleteMany({
            where: { projectTutorialId: targetId },
          });
          await prisma.projectStep.createMany({
            data: project.steps.map((s) => ({
              projectTutorialId: targetId,
              stepNumber: s.stepNumber,
              title: s.title,
              objective: s.objective || null,
              whyNecessary: s.whyNecessary || null,
              content: s.content,
              codeSnippet: s.codeSnippet || null,
              codeLanguage: s.codeLanguage || (language || '').toLowerCase() || null,
              concepts: s.concepts || [],
              referenceUrls: s.referenceUrls || [],
              expectedResult: s.expectedResult || null,
            })),
          });
        }

        // Import Resources if present
        if (targetId && project.resources && project.resources.length > 0) {
          await prisma.projectResource.deleteMany({
            where: { projectTutorialId: targetId },
          });
          await prisma.projectResource.createMany({
            data: project.resources.map((r, idx) => ({
              projectTutorialId: targetId,
              title: r.title,
              url: r.url,
              resourceType: r.resourceType || "ORIGINAL_TUTORIAL",
              description: r.description || null,
              author: r.author || null,
              isVerified: true,
              sortOrder: idx + 1,
            })),
          });
        }
      } catch (err) {
        stats.errors++;
        if (stats.errors <= 10) {
          console.error(`  Error importing "${project.slug}": ${err.message}`);
        }
      }
    }
  }

  console.log('\n--- Import Complete ---');
  console.log(`  Created:  ${stats.created}`);
  console.log(`  Updated:  ${stats.updated}`);
  console.log(`  Skipped:  ${stats.skipped}`);
  console.log(`  Errors:   ${stats.errors}`);
  console.log(`  Total:    ${stats.created + stats.updated + stats.skipped + stats.errors}`);
}

async function main() {
  try {
    await importProjects();
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
