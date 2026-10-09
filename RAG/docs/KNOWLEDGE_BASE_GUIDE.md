# Knowledge Base Management Guide

The flowCTRL RAG system is designed with a completely decoupled data layer. You can add, update, or remove topics, domains, and career tracks without modifying any application code.

---

## 1. Directory Structure

```
RAG/knowledge_base/
├── career_paths.json          # Overall career tracks & progression levels
├── company_profiles.json      # Company-type interview and roadmap priorities
├── skills_taxonomy.json       # Prerequisite graph and category hierarchy
├── curated_resources.json     # Verified learning links and practical projects
└── domains/                   # Domain-specific multi-stage curricula
    ├── backend_engineering.json
    ├── frontend_engineering.json
    ├── ai_machine_learning.json
    ├── cloud_devops.json
    └── cybersecurity.json
```

---

## 2. Adding a New Domain Curriculum

Create a new file in `RAG/knowledge_base/domains/<domain_slug>.json` conforming to this schema:

```json
{
  "domain": "Game Development",
  "careerPath": "Gameplay Programming",
  "targetRoles": ["Game Programmer", "Unity Developer"],
  "stages": [
    {
      "stageName": "Foundation",
      "stageDescription": "C# programming, vectors, and 2D physics foundations.",
      "items": [
        {
          "topic": "C# & Object-Oriented Game Loops",
          "whyRecommended": "Essential programming language used in Unity.",
          "difficulty": "Beginner",
          "prerequisites": [],
          "estimatedEffort": "15 hours (1-2 weeks)",
          "skills": ["C#", "OOP"],
          "recommendedResources": [
            {
              "title": "Microsoft C# Documentation",
              "type": "documentation",
              "url": "https://learn.microsoft.com/en-us/dotnet/csharp/"
            }
          ],
          "practiceTasks": ["Build a text-based turn-based combat game"],
          "projectApplication": "2D physics-based arcade clone",
          "completionCriteria": "Understand delegates, events, and component lifecycles",
          "nextRecommendedStep": "Unity Physics & Scene Graphs"
        }
      ]
    }
  ]
}
```

---

## 3. Adding or Updating Documents via CLI

Use the helper script in `RAG/scripts/updateDocs.js`:

```bash
# Append or update a document
node scripts/updateDocs.js --add path/to/document.json

# Remove an outdated document by topic ID
node scripts/updateDocs.js --remove topic_id_here
```

---

## 4. Rebuilding the Full Vector Index

Whenever substantial additions are made to `RAG/knowledge_base/`:

```bash
node scripts/reindex.js
```

This clears the old vectors and regenerates all embeddings into `RAG/data/vector_store.json`.
