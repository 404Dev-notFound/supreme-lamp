# flowCTRL RAG API Specification

All endpoints are mounted under `/api/rag` in the Express backend and require an active authenticated user session.

---

### Authentication & Authorization

All endpoints require:
- **Cookie**: `flowctrl_session=<session_token>` OR
- **Header**: `Authorization: Bearer <jwt_token>`

Unauthenticated requests receive `401 Unauthorized`:
```json
{
  "success": false,
  "code": "UNAUTHORIZED",
  "error": "Authentication required. Please sign in to access this resource."
}
```

---

## 1. User Career Profile & Questionnaire

### `GET /api/rag/profile`
Retrieves the authenticated user's current career preferences and skill profile.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "targetRole": "Backend Developer",
    "targetDomain": "Software Development",
    "targetCompanyType": "Product-based company",
    "careerGoals": ["Product-based company", "Software Development"],
    "experienceLevel": "Beginner",
    "currentSkills": [
      { "name": "JavaScript", "proficiency": 3 }
    ],
    "desiredTechnologies": ["PostgreSQL", "Docker", "Redis"],
    "preferredDirection": "Hands-on projects with deep fundamentals",
    "updatedAt": "2026-10-09T03:30:00.000Z"
  }
}
```

---

### `POST /api/rag/profile`
Creates or updates the authenticated user's career questionnaire and skill profile.

**Request Body:**
```json
{
  "targetRole": "Backend Developer",
  "targetDomain": "Software Development",
  "targetCompanyType": "Product-based company",
  "careerGoals": ["Product-based company", "Startup"],
  "experienceLevel": "Beginner",
  "currentSkills": [
    { "name": "JavaScript", "proficiency": 3 }
  ],
  "desiredTechnologies": ["PostgreSQL", "Docker"]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Career profile saved successfully.",
  "data": { ... }
}
```

---

## 2. Skill Assessment & Gaps

### `POST /api/rag/skill-assessment`
Calculates `Current Skills → Required Skills → Skill Gaps → Learning Path`.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "masteredSkills": [
      { "name": "javascript", "level": 4 }
    ],
    "inProgressSkills": [
      { "name": "node.js", "level": 2 }
    ],
    "skillGaps": [
      {
        "name": "PostgreSQL & Relational Database Design",
        "currentLevel": 0,
        "targetLevel": 4,
        "priority": "HIGH",
        "reason": "Missing core competency for target role Backend Developer.",
        "difficulty": "Intermediate"
      }
    ],
    "totalGapsCount": 5
  }
}
```

---

## 3. Personalized Roadmap Generation

### `POST /api/rag/generate`
Generates a structured, prerequisite-aware roadmap grounded strictly in the RAG knowledge base.

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Personalized roadmap generated successfully.",
  "data": {
    "id": "rm_1728444600000_backend_developer",
    "roadmapTitle": "Personalized Backend Developer Roadmap (Product-based company)",
    "summary": "Tailored curriculum designed for Backend Developer targeting Product-based company...",
    "estimatedTotalWeeks": 14,
    "totalTopicsCount": 10,
    "stages": [
      {
        "stageId": "stage_1",
        "stageName": "Foundation",
        "items": [
          {
            "id": "topic_1_relational-databases",
            "topic": "Relational Databases & SQL Fundamentals",
            "whyRecommended": "Primary data persistence layer required for transactional integrity.",
            "difficulty": "Beginner",
            "estimatedEffort": "15 hours (1-2 weeks)",
            "recommendedResources": [
              {
                "title": "PostgreSQL Tutorial for Beginners",
                "type": "documentation",
                "url": "https://www.postgresqltutorial.com/"
              }
            ],
            "practiceTasks": ["Write complex JOIN queries, GROUP BY aggregations"],
            "projectApplication": "Design an e-commerce normalized database schema",
            "completionCriteria": "Produce correct SQL schemas with indexing",
            "nextRecommendedStep": "PostgreSQL & Prisma ORM Integration",
            "status": "Not Started"
          }
        ]
      }
    ]
  }
}
```

---

### `GET /api/rag/roadmap`
Retrieves the user's active personalized roadmap.

---

## 4. Adaptive Recommendations & Progress

### `GET /api/rag/recommendations`
Returns dynamic recommendations with human-readable explainability.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "targetRole": "Backend Developer",
    "recommendations": [
      {
        "id": "rec_1_postgresql",
        "topic": "PostgreSQL & Database Indexing",
        "reason": "Recommended because you want to become a Backend Developer and currently know JavaScript but lack database skills.",
        "priority": "HIGH",
        "estimatedEffort": "15 hours",
        "practiceMilestone": "Demonstrate verified competency in PostgreSQL"
      }
    ]
  }
}
```

---

### `POST /api/rag/progress/toggle`
Toggles completion for a topic ID, updates database progress, and returns recalculated dashboard metrics.

**Request Body:**
```json
{
  "topicId": "topic_1_relational-databases"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Topic progress updated successfully.",
  "data": {
    "completedTopicIds": ["topic_1_relational-databases"],
    "dashboardMetrics": {
      "overallProgress": 10,
      "completedCount": 1,
      "totalTopics": 10,
      "remainingCount": 9,
      "currentStage": "Core Skills",
      "recommendedNextTopic": {
        "id": "topic_2_express",
        "topic": "RESTful API Design & Express.js"
      }
    }
  }
}
```

---

### `GET /api/rag/dashboard`
Returns overall dashboard analytics including completion percentage, milestones, and next topic.
