# flowCTRL (supreme-lamp)

An end-to-end full-stack platform and intelligent career/recruitment workflow monorepo powered by Turborepo, Next.js, Express, Prisma, and OpenTelemetry.

---

## 🏗 Project Architecture

This monorepo is structured as follows:

```
flowCTRL/
├── apps/
│   ├── frontend/                 # Next.js (Turbopack, Tailwind CSS) web application
│   ├── backend/                  # Node.js / Express API with OpenTelemetry & Prisma
│   ├── mental-health-backend/    # Specialized mental-health services
│   └── resume-screener-backend/  # AI resume screening and evaluation service
├── packages/
│   └── types/                    # Shared TypeScript interfaces and type definitions
├── JobRadar/                     # Job intelligence, radar & resume copilot engine
├── flowCTRL DATA/                # Seed data, roles, skills, and roadmap datasets
├── todo for project/             # Architecture references, schema, and notes
├── docker-compose.yml            # Container orchestration for databases and services
├── turbo.json                    # Turborepo build pipeline configuration
└── package.json                  # Root monorepo workspace configuration
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: v18+ (Node 20+ recommended)
- **npm**: v9+ (or Yarn / pnpm)
- **Docker**: For running PostgreSQL database container (optional for local dev with external DB)

---

### 1. Install Dependencies

Install all root and workspace dependencies:

```bash
npm install
```

---

### 2. Environment Configuration

Copy the example environment configuration or configure `.env` in the root and app directories:

**Root / Backend (`.env`):**

```env
PORT=5000
NEXT_PUBLIC_API_URL=http://localhost:5000
# Database connection string
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/flowctrl
```

---

### 3. Run Development Servers

Run all workspace applications simultaneously using Turborepo:

```bash
npm run dev
```

Or run individual apps:

**Frontend (Next.js):**

```bash
cd apps/frontend
npm run dev
# Running on http://localhost:3000
```

**Backend (Express API):**

```bash
cd apps/backend
npm run dev
# Running on http://localhost:5000 (Healthcheck: http://localhost:5000/api/health)
```

---

### 4. Build for Production

```bash
npm run build
```

---

### 5. Running with Docker Compose

To spin up services and the database with Docker:

```bash
# Build & start containers in detached mode
docker compose up -d --build

# View logs
docker compose logs -f

# Stop containers
docker compose down
```

---

## 🔒 Security & Version Control

- Environment variables (`.env`), secrets, database files, and private keys are strictly excluded from version control via `.gitignore`.
- Build caches (`.turbo`, `.next`, `dist`, `build`, `out`) and dependency directories (`node_modules`) are excluded.
