# Database Models & REST API Specification

## 1. Database Schema (`schema.prisma`)

```prisma
model ProjectTutorialCategory {
  id          String   @id @default(cuid())
  slug        String   @unique
  name        String
  description String?  @db.Text
  icon        String?  @default("FolderGit2")
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  tutorials   ProjectTutorial[]

  @@index([slug])
}

model ProjectTutorial {
  id                    String   @id @default(cuid())
  slug                  String   @unique
  title                 String
  description           String   @db.Text
  categorySlug          String
  categoryId            String?
  language              String
  languages             String[]
  difficulty            String   @default("Intermediate")
  estimatedHours        Int?     @default(15)
  whatYouWillBuild      String?  @db.Text
  whyBuildThis          String?  @db.Text
  realWorldApplications String?  @db.Text
  expectedOutcome       String?  @db.Text
  prerequisites         String[]
  technologies          String[]
  toolsRequired         String[]
  learningOutcomes      String[]
  sourceRepo            String?  @default("https://github.com/codecrafters-io/build-your-own-x")
  sourceAuthor          String?
  sourceLicense         String?  @default("CC0-1.0")
  isPublished           Boolean  @default(true)
  isFeatured            Boolean  @default(false)
  sortOrder             Int      @default(0)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  category              ProjectTutorialCategory? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  steps                 ProjectStep[]
  resources             ProjectResource[]
  userProgress          UserProjectProgress[]
  bookmarks             ProjectBookmark[]

  @@index([slug])
  @@index([categorySlug])
  @@index([language])
  @@index([difficulty])
  @@index([isPublished])
  @@index([isFeatured])
}

model ProjectStep {
  id                String   @id @default(cuid())
  projectTutorialId String
  stepNumber        Int
  title             String
  objective         String?  @db.Text
  whyNecessary      String?  @db.Text
  content           String   @db.Text
  codeSnippet       String?  @db.Text
  codeLanguage      String?
  concepts          String[]
  referenceUrls     String[]
  expectedResult    String?  @db.Text
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  project           ProjectTutorial           @relation(fields: [projectTutorialId], references: [id], onDelete: Cascade)
  stepProgress      UserProjectStepProgress[]

  @@unique([projectTutorialId, stepNumber])
  @@index([projectTutorialId])
  @@index([stepNumber])
}

model ProjectResource {
  id                String   @id @default(cuid())
  projectTutorialId String
  title             String
  url               String
  resourceType      String   @default("ORIGINAL_TUTORIAL")
  description       String?  @db.Text
  author            String?
  isVerified        Boolean  @default(true)
  sortOrder         Int      @default(0)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  project           ProjectTutorial @relation(fields: [projectTutorialId], references: [id], onDelete: Cascade)

  @@index([projectTutorialId])
  @@index([resourceType])
}

model UserProjectProgress {
  id                 String    @id @default(cuid())
  userId             String
  projectTutorialId  String
  status             String    @default("IN_PROGRESS") // NOT_STARTED, IN_PROGRESS, COMPLETED
  currentStepNumber  Int       @default(1)
  completedStepCount Int       @default(0)
  totalStepCount     Int       @default(0)
  progressPercent    Int       @default(0)
  startedAt          DateTime  @default(now())
  completedAt        DateTime?
  lastActivityAt     DateTime  @default(now())
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  user               User                      @relation(fields: [userId], references: [id], onDelete: Cascade)
  project            ProjectTutorial           @relation(fields: [projectTutorialId], references: [id], onDelete: Cascade)
  stepProgress       UserProjectStepProgress[]

  @@unique([userId, projectTutorialId])
  @@index([userId])
  @@index([projectTutorialId])
  @@index([status])
}

model UserProjectStepProgress {
  id             String    @id @default(cuid())
  userProgressId String
  projectStepId  String
  isCompleted    Boolean   @default(false)
  completedAt    DateTime?
  notes          String?   @db.Text
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  userProgress   UserProjectProgress @relation(fields: [userProgressId], references: [id], onDelete: Cascade)
  step           ProjectStep         @relation(fields: [projectStepId], references: [id], onDelete: Cascade)

  @@unique([userProgressId, projectStepId])
  @@index([userProgressId])
  @@index([projectStepId])
  @@index([isCompleted])
}

model ProjectBookmark {
  id                String   @id @default(cuid())
  userId            String
  projectTutorialId String
  createdAt         DateTime @default(now())

  user              User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  project           ProjectTutorial @relation(fields: [projectTutorialId], references: [id], onDelete: Cascade)

  @@unique([userId, projectTutorialId])
  @@index([userId])
  @@index([projectTutorialId])
}
```

---

## 2. REST API Endpoints

All endpoints are mounted on `/api/project-tutorials`.

### 1. `GET /api/project-tutorials`
- **Access**: Public (Optional Auth to augment with user progress)
- **Query Parameters**:
  - `search`: string (keyword search over titles, descriptions, tech stack, learning outcomes)
  - `category`: string (category slug)
  - `language`: string (programming language)
  - `difficulty`: enum (`Beginner`, `Intermediate`, `Advanced`)
  - `sort`: enum (`recommended`, `newest`, `difficulty_asc`, `difficulty_desc`, `duration_asc`, `duration_desc`)
  - `page`: integer (default: 1)
  - `limit`: integer (default: 12)
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "cuid...",
        "slug": "build-your-own-sqlite-database",
        "title": "Build Your Own SQLite Database from Scratch",
        "categorySlug": "databases",
        "language": "C",
        "difficulty": "Intermediate",
        "estimatedHours": 20,
        "totalSteps": 6,
        "totalResources": 3,
        "userProgress": {
          "status": "IN_PROGRESS",
          "completedStepCount": 2,
          "progressPercent": 33
        },
        "isBookmarked": false
      }
    ],
    "pagination": {
      "total": 8,
      "page": 1,
      "limit": 12,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
  ```

### 2. `GET /api/project-tutorials/categories`
- **Access**: Public
- **Response**: Array of categories with counts.

### 3. `GET /api/project-tutorials/languages`
- **Access**: Public
- **Response**: Array of unique programming languages.

### 4. `GET /api/project-tutorials/:slug`
- **Access**: Public (Optional Auth)
- **Response**: Complete project details, ordered steps, and verified resources.

### 5. `POST /api/project-tutorials/:id/start`
- **Access**: Authenticated (`requireAuth`)
- **Response**: Created `UserProjectProgress` object.

### 6. `POST /api/project-tutorials/:id/steps/:stepNumber`
- **Access**: Authenticated (`requireAuth`)
- **Body**: `{ "isCompleted": true, "notes": "Optional notes" }`
- **Response**: Updated progress with recalculated completion percentage.

### 7. `POST /api/project-tutorials/:id/complete`
- **Access**: Authenticated (`requireAuth`)
- **Response**: 100% completed project progress record.

### 8. `GET /api/project-tutorials/user/my-progress`
- **Access**: Authenticated (`requireAuth`)
- **Response**: All started/completed projects for current user.

### 9. `POST /api/project-tutorials/:id/bookmark`
- **Access**: Authenticated (`requireAuth`)
- **Response**: `{ "success": true, "data": { "bookmarked": true } }`

