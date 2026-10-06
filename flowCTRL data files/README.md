# flowCTRL Data Files Architecture

Centralized storage and configuration hub for **flowCTRL** authentication, PostgreSQL database structures, Prisma schemas, seeds, and audit logs.

---

## Directory Organization

```text
flowCTRL data files/
├── prisma/
│   ├── schema.prisma              # Centralized Prisma schema (Users, Sessions, Projects, Issues, Roadmaps)
│   └── migrations/                # Database versioned migrations
├── seeds/
│   ├── users.seed.json            # Seed accounts (Admin, standard users, mentors, recruiters)
│   ├── projects.seed.json         # Curated starter projects and task issues
│   ├── roles.json                 # Role hierarchy and permission definitions
│   ├── categories.json            # Career & domain catalog
│   ├── skills.json                # Verified skills catalog
│   └── roadmaps.json              # Curated learning tracks & paths
├── docker/
│   └── init-db.sql                # PostgreSQL container initialization SQL script
├── exports/
│   ├── users.export.json          # Sanitized user snapshots (excluding passwords/hashes)
│   ├── projects.export.json       # Exported projects and tasks snapshot
│   └── security_logs.export.json  # Exported security events & session audit trail
├── scripts/
│   ├── seed.js                    # Database seeder (idempotent upsert via Prisma into PostgreSQL)
│   └── export-data.js             # Automated safe data export utility
└── README.md                      # Architecture & persistence documentation
```

---

## How Components Connect

1. **Prisma ORM (`prisma.config.js`)**:
   Points to `flowCTRL data files/prisma/schema.prisma` across the entire workspace.
   ```bash
   npx prisma db push
   npx prisma generate
   ```

2. **Database Seeding**:
   Populates PostgreSQL with default users and roles from `seeds/users.seed.json`:
   ```bash
   node "flowCTRL data files/scripts/seed.js"
   ```

3. **Data Export & Backup**:
   Snapshots live accounts and session logs safely into `exports/`:
   ```bash
   node "flowCTRL data files/scripts/export-data.js"
   ```

4. **Docker Integration (`docker-compose.yml`)**:
   Mounts `flowCTRL data files/docker/init-db.sql` into `/docker-entrypoint-initdb.d/init-db.sql` and pushes the centralized schema on container boot.
