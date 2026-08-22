# Integration of Developer-Roadmap into FlowCTRL Monorepo

**Executive Summary:** We will import the _developer-roadmap_ content as read-only “roadmap” data within FlowCTRL’s Next.js/Turborepo codebase. All content files remain untouched; instead we **copy and transform** them into FlowCTRL’s data layer. We define new modules/packages (e.g. `roadmap-training-data`, `roadmap-backend`, `roadmap-frontend-components`) and rename all identifiers to avoid collisions (e.g. UI component `DevRoadmapButton` instead of generic “RoadmapButton”). The FlowCTRL build will use Next.js static generation (via `getStaticProps`/`getStaticPaths`) or equivalent to ingest markdown/JSON content. On the frontend we add a primary roadmap CTA button under the hero heading and custom React components (using [React Flow](https://reactflow.dev/) with Tailwind CSS) to visualize the roadmap nodes. Backend services expose REST APIs (e.g. `GET /api/roadmaps/{slug}`) backed by a new data store (could be JSON or a small DB) of roadmap topics. We include extensive unit/integration tests (using Jest/SuperTest or similar), Storybook demos for UI components, and CI caching (Turborepo remote cache) for fast builds. Licensing is a concern: the roadmap content license **only allows personal use**, so FlowCTRL must either link to the official site or obtain permission. A rollback plan and QA checklist (accessibility, logging, error handling, etc.) are included. The implementation is broken into milestones (data import, UI, backend, integration) with effort estimates for each. Official docs (Next.js, Turborepo, React Flow, Tailwind) are cited where relevant.

## Inventory (Developer-Roadmap Repo)

The **developer-roadmap** source (read-only) is primarily a content repo with the following structure (see [nilbuild/developer-roadmap README] and file tree):

- `roadmaps/` – dozens of subfolders (one per roadmap track, e.g. `frontend`, `backend`, `react`, etc.). Each has a `content/` directory with many `.md` files named `<topic-slug>@<node-id>.md`. _Example:_ `roadmaps/html/content/introduction@abcd1234.md`. Each markdown file is a single topic’s description.
- `scripts/` – TypeScript sync tools (`sync-content-to-repo.ts`, `sync-repo-to-database.ts`, `cleanup-orphaned-content.ts`) for pushing/pulling to a back-office database (not needed in FlowCTRL).
- `.github/` – workflow definitions.
- Repo metadata: `package.json`, `tsconfig.json`, `pnpm-workspace.yaml`, `LICENSE` (see below).
- **License file:** The content license states _“All content including text and images are protected by copyright… allowed for personal use but **not** for publishing or reuse”_.

In summary, the source repo contains **static Markdown data** (roadmaps and topics) and sync scripts. We will **not modify** these files. Instead, we will extract/transform them for FlowCTRL.

## Feature-to-Module Mapping

We map the roadmap features into new FlowCTRL modules as follows:

- **Roadmap Content:** All markdown topics → _roadmap-training-data_ package (static JSON or MD imported at build time). Each original topic (`<topic>@<id>.md`) becomes a record in a `RoadmapTopic` model (with fields like `id`, `title`, `body`, `slug`, `resources`, `children`, etc.).
- **Roadmap Categories:** Each roadmap track (e.g. “frontend”, “react”) → an entry in a `Roadmap` table or list. Example: original folder `roadmaps/react/content/` → FlowCTRL model `Roadmap { slug: "react", title: "React Roadmap", topics: RoadmapTopic[] }`.
- **UI Components:** Original implicit UI (roadmap diagrams on website) → FlowCTRL _frontend components_ (in `roadmap-frontend-components`). For example, a “View Roadmap” button in the hero → `<DevRoadmapButton>` component; a topic node → `<DevRoadmapNode>` React component.
- **Backend API:** No direct analog in source repo. We create new endpoints (e.g. `GET /api/roadmaps`, `GET /api/roadmaps/{slug}`) in `roadmap-backend` to serve the imported data.
- **Scripts/Sync Tools:** We will likely **not reuse** the original scripts (since content is static and license is restrictive). Instead, we may write a one-time import script or pipeline that reads markdown into JSON (using a Markdown parser like [unified/remark]).
- **Tests:** Original repo has no tests. We introduce new test suites (e.g. unit tests for parsers, snapshot tests for components) under `roadmap-test-data` and/or `__tests__` in each package.
- **Naming:** All identifiers get a `DevRoadmap` or similar prefix to avoid clashing. E.g. “RoadmapButton” → `DevRoadmapButton`, “RoadmapService” → `DevRoadmapApiService`, etc. (see mapping table below).

### Code/Rename Mapping Table

| Original Identifier / Concept       | New FlowCTRL Name (code-only)                         | Notes                                                              |
| ----------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------ |
| **Repo Content**                    |                                                       |                                                                    |
| Folder `roadmaps`                   | `roadmap-training-data` (package)                     | store static content (JSON/MD)                                     |
| Individual MD files `topic@node.md` | FlowCTRL model `RoadmapTopic`                         | fields: `id`, `slug`, `title`, `body`, `children[]`, `resources[]` |
| **UI Components**                   |                                                       |                                                                    |
| “Developer Roadmap” heading/label   | `DevRoadmap` (prefix in UI texts)                     | e.g. `title = "Dev Roadmaps"`                                      |
| Button to navigate to roadmap       | `DevRoadmapButton` (component)                        | Primary CTA in hero section                                        |
| Roadmap landing page                | `DevRoadmapPage` (component)                          | Next.js page under `/roadmap` route                                |
| Roadmap diagram container           | `DevRoadmapDiagram` or `DevRoadmapGraph` (component)  | Uses React Flow to render nodes/edges                              |
| Roadmap node card                   | `DevRoadmapNodeCard` (component)                      | Shows topic title/desc/resources                                   |
| **Backend/Models**                  |                                                       |                                                                    |
| (No existing API)                   | `RoadmapApiController`, `RoadmapService` (or similar) | Provides REST endpoints                                            |
| Data model `Roadmap`                | `Roadmap` (Entity)                                    | e.g. fields: `slug`, `title`, `topics[]`                           |
| Data model `Topic`                  | `RoadmapTopic` (Entity)                               | rename from “Topic” to avoid generic name                          |
| **Scripts/Pipelines**               |                                                       |                                                                    |
| `sync-content-to-repo.ts`           | _(not used)_ or `roadmapContentImport.ts`             | Custom import script if needed                                     |
| `sync-repo-to-database.ts`          | _(not used)_                                          | No roadmap.sh DB to sync to                                        |
| Variables like `roadmapSlug`        | `roadmapSlugId` or `flowRoadmapSlug`                  | to avoid collision                                                 |

_(This is an illustrative subset. All new code identifiers should consistently use the `DevRoadmap` or `roadmap` prefix. A full mapping table should be maintained for traceability.)_

## Proposed Architecture (Folders & Files)

We will add a new **roadmap feature sub-tree** inside FlowCTRL’s monorepo. An example layout (Turborepo workspace) is shown below:

| Folder/Package Name                                  | Contents & Purpose                                                                                                                                                                                                                              |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`packages/roadmap-training-data/`**                | Static content package containing converted roadmap data. E.g. JSON files or TS modules compiled from the original Markdown. (Example files: `frontendRoadmap.json`, `reactRoadmap.json`, etc.)                                                 |
| **`packages/roadmap-test-data/`**                    | Fixture data and sample JSON for unit/integration tests (roadmap topics and resources).                                                                                                                                                         |
| **`packages/roadmap-frontend-components/`**          | Reusable React components and styles for roadmap UI. Contains components like `DevRoadmapButton.tsx`, `DevRoadmapGraph.tsx`, `DevRoadmapNodeCard.tsx`, and a Storybook setup for them. Uses Tailwind CSS utility classes.                       |
| **`packages/roadmap-backend/`**                      | Backend (API) code: Next.js API routes or an Express/Koa microservice under FlowCTRL. Endpoints like `GET /api/roadmaps` and `GET /api/roadmaps/[slug]`. Includes data models (TypeScript interfaces) and database schema.                      |
| **`apps/flowctr-web/pages/roadmap/`**                | Next.js pages (or app routes) integrating the roadmap UI. For example, `/pages/roadmap/index.tsx` lists available roadmaps, and `/pages/roadmap/[slug].tsx` renders a specific roadmap using the components from `roadmap-frontend-components`. |
| **`apps/flowctr-web/pages/index.tsx`** (Hero update) | Modified to include the `DevRoadmapButton` under the main heading in the hero section, linking to `/roadmap`.                                                                                                                                   |
| **`tsconfig.json`** (root)                           | Update paths/aliases if needed for `roadmap-*` packages. Ensure `packages/*` are included in Turborepo workspace.                                                                                                                               |
| **CI/CD config** (`.github/workflows`)               | Update pipeline to run tests/build for `roadmap-*` packages. Use caching as per Turborepo docs.                                                                                                                                                 |

```mermaid
flowchart LR
  subgraph Developer-Roadmap (source repo, read-only)
    A[roadmaps/* (Markdown content)]
  end
  subgraph FlowCTRL_Monorepo
    direction LR
    B[roadmap-training-data<br/>(converted JSON/MD)]
    C[roadmap-backend<br/>(API + models)]
    D[roadmap-frontend-components<br/>(React + Tailwind UI)]
    E[FlowCTRL Frontend (Next.js app)]
  end
  A -->|"Ingest/Import pipeline"| B
  B --> C
  C --> E
  E --> D
  E --> User[User (Dev) Interface]
```

_Figure:_ High-level integration architecture: static roadmap content is imported into FlowCTRL (via a one-time or periodic pipeline) and stored in a new data layer. The backend service exposes it via APIs, and the frontend (Next.js) uses new React components to display it.

## Frontend Plan

### Components & Hierarchy

We design new React components (all prefixed with `DevRoadmap` to avoid naming conflicts) consistent with FlowCTRL’s design system (using Tailwind CSS for styling). Key components include:

- **`DevRoadmapButton`**: A primary CTA button to access roadmaps. Props: `onClick` or `href`, `className`. Rendered in the hero section below the main heading (e.g. `<button class="btn-primary" onClick={...}>View Dev Roadmaps</button>`).
- **`DevRoadmapPage`**: Page/container component for a specific roadmap. Pulls data (via props or a Next.js `getStaticProps`) and renders the roadmap diagram and details.
- **`DevRoadmapGraph`**: Renders the roadmap graph. Internally uses [React Flow](https://reactflow.dev/) (nodes and edges) to display topics. Props: `nodes: RoadmapNode[]`, `edges: RoadmapEdge[]`.
- **`DevRoadmapNodeCard`**: For each topic node, shows title and short description; may expand to show resources. Props: `node: RoadmapNode`. This could be used as a custom React Flow node renderer.
- **`DevRoadmapSidebar`** (optional): Lists all topics on the roadmap as a quick outline (for accessibility/navigation).
- **`DevRoadmapListPage`**: (Optional) If needed, a page listing all available roadmaps (slugs, titles, cover images).

Component hierarchy example:

- `HeroSection` (existing page)  
  └─ `DevRoadmapButton` (added below hero heading)
- `/pages/roadmap/[slug].tsx` (Next.js page)  
  └─ `DevRoadmapPage`  
  ├─ `DevRoadmapGraph` (contains multiple `DevRoadmapNodeCard` as nodes)  
  └─ `DevRoadmapSidebar`

### TypeScript Interfaces

Sample data interfaces (in `roadmap-backend` or shared package):

```ts
interface Resource {
  id: string;
  type: "article" | "video" | "book";
  title: string;
  url: string;
}

interface RoadmapNode {
  id: string; // e.g. node UUID or slug (mapped from @<node-id>.md)
  title: string; // extracted from file name or frontmatter
  description: string; // markdown content
  prerequisites: string[]; // ids of prerequisite nodes
  children: string[]; // ids of dependent nodes
  resources: Resource[]; // list of supplemental resources
}

interface RoadmapData {
  slug: string; // roadmap identifier (e.g. 'frontend')
  title: string; // e.g. "Frontend Developer Roadmap"
  nodes: RoadmapNode[];
}
```

These interfaces guide both frontend prop types and backend data models. We enforce non-null `title`/`id`, and use arrays for relationships. In a DB schema, `RoadmapNode` might become a table with columns `(id, title, description, roadmapSlug)`, plus join tables for prerequisites.

### Styling & Accessibility

We will use **Tailwind CSS** for styling (as FlowCTRL’s design system likely supports utility classes). Tailwind’s accessibility utilities (like `.sr-only`) help hide things from visual UI but keep them readable by screen readers. We will ensure:

- **Semantic HTML:** Use `<button>`, `<main>`, `<nav>`, headings (`<h1>`, `<h2>`), lists (`<ul>`), etc., correctly.
- **Unique/Descriptive Labels:** Button texts and `aria-labels` must be clear (e.g. avoid “click here”). For example, `<button aria-label="View developer roadmaps">Dev Roadmaps</button>`.
- **Keyboard Navigation:** All interactive components (button, graph nodes) must be focusable. Use React Flow’s built-in focus support or custom keyboard handlers.
- **Color Contrast:** Ensure text and background colors meet WCAG AA contrast ratios (Tailwind’s color palette and a11y plugin can assist).
- **Skip Links:** Consider a hidden “Skip to content” link (`<a href="#main" class="sr-only focus:not-sr-only">Skip to content</a>`).
- **ARIA Roles:** For custom diagram (SVG/Canvas), use proper `role="group"` or `aria-label`. If nodes are buttons, use `<button>` or add `tabIndex=0` and ARIA on `<div>`.
- **Images:** If any icons/images used, include `alt` text.

An accessibility checklist (based on the [A11Y Project checklist]) will be followed during QA:

- Each page has a unique `<title>` and `lang` attribute.
- All form controls and buttons have accessible labels.
- Use landmark regions (`<main>`, `<nav>`) for page structure.
- Verify with a tool (e.g. Lighthouse or axe) for keyboard/touch support.

## Backend Plan

### API Endpoints

We define new REST endpoints under `/api/roadmaps`. Example list:

| Method | Endpoint                                  | Description                                             |
| ------ | ----------------------------------------- | ------------------------------------------------------- |
| GET    | `/api/roadmaps`                           | List all available roadmaps (slug, title, etc.).        |
| GET    | `/api/roadmaps/{slug}`                    | Get data for a single roadmap: nodes, edges, resources. |
| GET    | `/api/roadmaps/{slug}/topics/{id}` (opt.) | Get details for a single topic/node (if needed).        |

Each response will be JSON. For performance, these can be cached in-memory (Node.js cache or Redis) since data is mostly static. Rate limiting is not critical for static content, but standard API rate limiting can be applied (e.g. 100 req/min) to avoid abuse. We may also enable HTTP caching headers (ETag/Cache-Control) since content seldom changes.

### Data Models / DB Schema

If using a relational DB, the schema could be (simplified):

- **`Roadmaps` table**:
  - `slug` (PK, string),
  - `title` (string),
  - `description` (text).
- **`Topics` table**:
  - `id` (PK, string),
  - `roadmap_slug` (FK),
  - `title` (string),
  - `description` (text),
  - _(maybe `parent_id` or store prerequisites differently)_.
- **`TopicDependencies` table** (many-to-many self-join for prerequisites):
  - `topic_id`, `depends_on_id`.
- **`Resources` table**:
  - `id` (PK),
  - `topic_id` (FK),
  - `type` (enum),
  - `title`, `url`.

A summary DB schema table:

| Table            | Columns/Fields                                       |
| ---------------- | ---------------------------------------------------- |
| **Roadmaps**     | `slug (pk), title, description`                      |
| **Topics**       | `id (pk), roadmap_slug (fk), title, description`     |
| **Dependencies** | `topic_id (fk), prerequisite_id (fk)` (composite PK) |
| **Resources**    | `id (pk), topic_id (fk), type, title, url`           |

_(In a NoSQL setup, we could store each roadmap as a document with an array of topics.)_

Data validation rules (backend):

- Required fields: `title`, `description`.
- Validate `slug` format (alphanumeric-dash).
- Resource `url` must be a valid URL.
- Rate-limit: use middleware (e.g. `express-rate-limit`) to cap requests if needed.

### Background Jobs / Sync

Since we treat the source as read-only, the initial import can be done via a one-time script (using [unified/remark-parse] to parse each `.md`). For ongoing updates, we could schedule a periodic job (e.g. nightly GitHub Action or CI job) that pulls the latest content from the _developer-roadmap_ repo and regenerates our data files or database. However, given license, we likely do only at deploy time (manually or CI-triggered) with permission.

### Test Datasets and Location

Under `packages/roadmap-test-data/`, include sample JSON (or markdown) fixtures. For instance:

- `frontend-example.json`
- `react-example.json`

These mimic API responses. Unit tests (Jest) will load these to assert the backend logic (e.g. “parsing markdown -> JSON”). Frontend snapshot tests (Storybook or Jest with React Testing Library) can use them to render components. Integration tests (e.g. using SuperTest) can hit the API endpoints against a test server initialized with this data.

## Data Pipelines & Testing

**Data Import Pipeline:** Use a Markdown parser to transform the cloned `.md` files into our data format. For example, Node.js with [`unified` + `remark-parse`](https://github.com/unifiedjs/unified) can read each file. Example snippet:

```js
import { unified } from "unified";
import remarkParse from "remark-parse";

// Read file content (e.g. using fs.readFile)
const fileContent = "# HTML (Hypertext Markup Language) is the standard...";
// Parse to AST:
const tree = unified().use(remarkParse).parse(fileContent);
// Extract AST nodes into our model...
```

This AST approach (shown in official docs) makes it easy to extract headings, text, and links. We can traverse `tree` to build our `RoadmapNode` objects.

**Data Transformation:** During import, we should:

- Combine topic files into a single JSON per roadmap (group by slug).
- Extract resources: lines in markdown with a prefix (e.g. `@article@`, `@video@`) can be parsed into the `Resource` list.
- Ensure each node’s `children` array is filled by following the file references in the original roadmap structure (the site’s graph info is implicit via node IDs).

**Unit Tests:** For each pipeline function (e.g. `parseTopicMd(mdString) → RoadmapTopic`), write Jest tests using sample markdown in `roadmap-test-data`. Assert correct parsing of title, body, resources.

**Integration Tests (E2E):** Use Jest/SuperTest (or Next.js built-in testing) to spin up the API and verify:

- `GET /api/roadmaps` returns an array of slugs (matching imported data).
- `GET /api/roadmaps/react` returns all React nodes with expected fields.
- 404 on invalid slugs.
  Also test failure cases: malformed data should produce descriptive errors. Coverage of edge cases (empty resources, circular dependencies).

**CI Configuration:**

- Run `pnpm test` or `npm test` for all `roadmap-*` packages.
- Use Turborepo’s caching to skip unchanged jobs.
- Possibly lint (`eslint`) and build (`pnpm build`).

### Logging & Monitoring

In the backend service, include logging (e.g. via Winston or Pino) for API requests, errors, and data sync events. For example, log each time data import runs (timestamps, success/fail). Monitor endpoint latencies and error rates (could integrate with tools like Sentry).

### Security/Privacy

- **Content License:** The dev-roadmap license explicitly prohibits reuse of its content outside personal use. We must **not copy-paste content** into FlowCTRL’s public UI without permission. Options:
  - Link out to the official [roadmap.sh](https://roadmap.sh) site for full content.
  - Or request permission from the author.
    We should highlight this in documentation and possibly implement disclaimers (e.g. “Roadmap content © roadmap.sh”). Failure to comply risks copyright infringement.
- **Data Privacy:** The roadmap content is public/shared; it contains no personal data. There are no user privacy issues since it’s read-only educational content.
- **API Security:** Only expose read (GET) endpoints; no user-auth. Still, implement basic API hardening (validate inputs, use HTTPS, etc.). If we store data in our DB, secure it as per FlowCTRL’s data policies.
- **License Compliance:** Since content is “not allowed for other purpose”, we should treat FlowCTRL’s usage as “internal learning tool” only. Legal should advise.

## CI/CD & Turborepo Build

We will integrate the new packages into the existing Turborepo configuration:

- **Build Pipelines:** Add tasks in `turbo.json` (or `package.json`) for the new packages. For example, `"build": "turbo run build"`, `"lint": "turbo run lint"`, `"test": "turbo run test"`.
- **Remote Caching:** Enable Turborepo’s remote cache (e.g. Vercel/Turborepo Cloud). This reuses cached outputs (node_modules, build artifacts) across machines and CI.
- **CI Steps:** In GitHub Actions (or other CI), run steps: `pnpm install` → `turbo run lint` → `turbo run test` → `turbo run build --filter=apps/web` (to build production Next.js). Because of Turborepo, unchanged packages (like `roadmap-training-data`) will skip rebuild.
- **Turborepo Filtering:** Use `--filter` flags to isolate tasks if needed. E.g. deploy only frontend with `--filter=apps/web`.
- **Continuous Integration:** Integrate with Vercel (if used) or another host to automatically deploy the Next.js app including the new roadmap pages.
- **Testing in CI:** Include visual regression testing (e.g. Chromatic for Storybook) to catch UI changes in roadmap components.

## Security & Licensing

- **License Review:** The roadmap content’s license (see [license file]) forbids republishing the content. We must not include actual markdown text in our UI unless allowed. One strategy is to link to the original or paraphrase. Another is to obtain a usage license. Document this risk for legal review.
- **Attribution:** If using any content, provide attribution (link to roadmap.sh). If using just the _structure_ (like topic sequence), it’s safer than copying text, but still gray.
- **Privacy:** No user data involved here. Ensure that any logging or telemetry doesn’t accidentally log content (unlikely).
- **Dependencies:** Verify that libraries (React Flow is MIT, Tailwind is open-source) are permitted under FlowCTRL’s policy. They are widely used and compatible with commercial use.
- **Cache and Secrets:** When setting up any sync pipeline (if we had one), use secure storage for tokens. But since we’re not syncing to developer-roadmap’s private DB, no secrets needed.
- **Security Testing:** Run `npm audit` on new packages. Use tools like Snyk. Ensure no vulnerabilities in turborpo/Tailwind/React Flow versions.

## Implementation Roadmap

A phased plan with estimates (assume a small team, ~1-2 developers):

1. **Setup & Inventory (Low effort):** (1 day)
   - Create new Turborepo packages and folders (`roadmap-training-data`, `roadmap-backend`, etc.).
   - Configure TS aliases, add to `turbo.json`.
   - Populate `roadmap-training-data` with initial parsed JSON or copies of some MD files.  
     _Effort:_ Low.
2. **Data Ingestion Pipeline (Medium):** (2–3 days)
   - Write a Node.js script to walk `roadmaps/` MD files and convert them to our JSON format (using `unified + remark`).
   - Handle multi-topic linking. Generate final JSON per roadmap slug.
   - Add tests for parser using `roadmap-test-data`.  
     _Effort:_ Medium.
3. **Backend API (Medium):** (2 days)
   - Implement routes in `roadmap-backend`: `/api/roadmaps` and `/api/roadmaps/[slug]`.
   - Connect to the data layer (import JSON or query DB).
   - Write unit tests (Jest + SuperTest).  
     _Effort:_ Medium.
4. **Frontend Components (High):** (4–6 days)
   - Build `DevRoadmapButton` and integrate into home page (hero section).
   - Build `DevRoadmapGraph` using React Flow (installed and configured). Design custom node style (e.g. using Tailwind classes).
   - Build page at `/roadmap/[slug]` to fetch data (with `getStaticProps`) and render graph.
   - Write Storybook stories for each component.  
     _Effort:_ High.
5. **Styling & Theming (Medium):** (2 days)
   - Ensure styling matches FlowCTRL design system. Write or copy CSS/Tailwind configs.
   - Implement responsive layout.  
     _Effort:_ Medium.
6. **Testing & QA (Medium):** (2 days)
   - Write end-to-end tests (Cypress or similar) to navigate from homepage to roadmap page and verify content appears.
   - Accessibility audit (Lighthouse, axe). Fix issues (ARIA labels, contrasts, etc.).  
     _Effort:_ Medium.
7. **CI/CD & Documentation (Medium):** (1–2 days)
   - Update CI pipeline (as above). Ensure Turborepo caching works.
   - Document the new packages, data format, and usage in dev docs.
   - Review code and write a changelog note about the roadmap feature.  
     _Effort:_ Medium.

**Timeline:** Approximately 2–3 weeks total.

## Rollback & QA Checklist

- **Rollback Plan:** Since changes are scoped to a new feature directory, a rollback can be a single PR revert. On detection of major issues (e.g. performance, broken build), revert the merge commit. Keep database migrations backward-compatible (or ensure rollback scripts for any schema changes). For static JSON, simply revert the committed data files if needed.

- **QA Checklist:**
  - [ ] **Build/CI:** All CI checks (lint/test/build) must pass after merge.
  - [ ] **Functional:**
    - Hero section shows the new “Dev Roadmaps” button under the main heading. Clicking it navigates to `/roadmap`.
    - `/roadmap/[slug]` correctly displays the roadmap graph for each `slug` from data.
    - Node details appear (title, description, link to resources).
  - [ ] **API:** Test endpoints with tools (Postman) for valid and invalid slugs.
  - [ ] **Accessibility:** Verify: unique page titles; `<main>` landmark; alt text for images; keyboard navigation (can tab to nodes); color contrast.
  - [ ] **Performance:** Page load time acceptable. The graph renders smoothly.
  - [ ] **Security:** No console errors or warnings. Content linking to external resources should have `rel="noopener noreferrer"`.
  - [ ] **Logging:** In production, check logs for any new errors from roadmap feature.
  - [ ] **License Compliance:** Confirm that no copyrighted content is displayed verbatim.
  - [ ] **Cross-Browser:** Test on major browsers (Chrome, Firefox, Edge) and mobile.

**Effort Estimates:**

- Low: configuration, inventory, minor changes.
- Medium: backend/API, data pipeline, CI config.
- High: frontend component development (diagram UI), thorough testing.

**Sources:** Official docs and references were used wherever possible (Next.js/Turborepo guides, React Flow docs, Tailwind CSS guides, and the developer-roadmap repo itself). All data processing relies on established libraries (e.g. `unified`/`remark`).
