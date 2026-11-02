# flowCTRL: Project-Building Tutorials Feature Documentation

## 1. Executive Summary & Purpose

The **Project-Building Tutorials** module is an independent, flagship feature within the `flowCTRL` Career Operating System. Inspired by the philosophy of Richard Feynman (*"What I cannot create, I do not understand"*), the feature bridges the gap between passive theoretical tutorials and production-grade software engineering.

Users discover, explore, and build real technologies from first principles:
- Relational Databases (SQLite clone with B-Trees)
- In-Memory Key-Value Caches (Redis clone with RESP protocol)
- Version Control Systems (Git clone with content-addressable storage)
- Linux Containers (Docker clone using Linux namespaces & cgroups)
- UI Engines & Virtual DOMs (React Fiber clone with concurrent work loops)
- Raw Socket HTTP Web Servers (HTTP/1.1 from TCP streams)
- Large Language Models & Neural Networks (Transformer architecture with self-attention)
- Bare-Metal Systems & Text Editors (VT100 Kilo editor in C)

The feature is fully integrated with PostgreSQL for progress persistence, Redis for high-throughput stampede-proof caching, and Next.js App Router for a responsive, interactive step-by-step developer workspace.

---

## 2. Directory Structure

```text
flowCTRL/
├── project tutorials documentation/
│   ├── README.md                               # Feature index & architecture overview
│   ├── CONTENT_EXTRACTION_AND_PROVENANCE.md    # Build Your Own X analysis, CC0 license, expansion
│   ├── DATABASE_AND_API_SPECIFICATION.md       # Prisma schema, relationships, REST API endpoints
│   └── REDIS_CACHE_AND_SECURITY.md             # Redis caching, TTLs, and security hardening
│
├── apps/backend/
│   ├── prisma/schema.prisma                    # ProjectTutorial, Category, Step, Progress models
│   ├── src/seeds/seedProjectTutorials.js       # Idempotent database seeder
│   ├── src/validators/projectTutorials.validator.js # Zod query and payload schemas
│   ├── src/services/projectTutorials.service.js# Business logic, Redis cache, DB queries
│   ├── src/controllers/projectTutorials.controller.js # HTTP request/response handlers
│   ├── src/routes/projectTutorials.routes.js   # Route definitions and middleware binding
│   └── src/projectTutorials.test.js            # Automated test suite (10/10 tests passing)
│
└── apps/frontend/
    ├── src/services/projectTutorials.service.js # Client API service
    ├── src/components/tutorials/
    │   ├── ProjectTutorialCard.jsx             # Grid card with badges, progress bar, bookmark
    │   ├── ProjectOverviewTab.jsx              # Blueprint, why build, outcomes, verified links
    │   └── ProjectStepWorkspace.jsx            # Interactive timeline, code viewer, step completion
    └── src/app/
        ├── project-tutorials/page.jsx          # Feature landing page with search and filters
        └── project-tutorials/[slug]/page.jsx   # Project detail & interactive step workspace
```

---

## 3. Core Architectural Highlights

1. **Standalone Top-Level Feature**: Integrated directly into navigation across all pages (Home, Roadmaps, Dashboard Mission Control, Ecosystem, and Footer) with a dedicated hammer icon (`Hammer`).
2. **PostgreSQL as Authoritative Source of Truth**: User progress (steps completed, percentage, active step) is persisted in the PostgreSQL database under `UserProjectProgress` and `UserProjectStepProgress`.
3. **Multi-Tenant / User Data Isolation**: Public catalog data is cached in Redis with high TTLs, while user-specific progress is queried directly and merged in-memory. User progress is never stored in public shared Redis keys.
4. **Interactive Step-by-Step Workspace**: Learners can navigate through ordered implementation stages, copy code snippets, review expected output, and toggle step completion with instant persistence across devices and refreshes.
5. **Full Legal Provenance & Attribution**: All tutorials are curated from the public domain `build-your-own-x` repository (CC0-1.0 Universal) with clear author attribution and verified source links.
