-- CreateTable
CREATE TABLE IF NOT EXISTS "PersonalizedRoadmap" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userGoal" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetRole" TEXT,
    "estimatedTotalWeeks" INTEGER DEFAULT 12,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "modelMetadata" JSONB DEFAULT '{}',
    "originalRagOutput" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalizedRoadmap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PersonalizedRoadmapLevel" (
    "id" TEXT NOT NULL,
    "roadmapId" TEXT NOT NULL,
    "levelIndex" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalizedRoadmapLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PersonalizedRoadmapNode" (
    "id" TEXT NOT NULL,
    "roadmapId" TEXT NOT NULL,
    "levelId" TEXT,
    "nodeKey" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "nodeType" TEXT NOT NULL DEFAULT 'TOPIC',
    "levelIndex" INTEGER NOT NULL DEFAULT 0,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "difficulty" TEXT NOT NULL DEFAULT 'Beginner',
    "estimatedEffort" TEXT,
    "whyItMatters" TEXT,
    "whatYouWillLearn" TEXT,
    "practicalApplication" TEXT,
    "completionCriteria" TEXT,
    "nextStep" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "completedAt" TIMESTAMP(3),
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalizedRoadmapNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PersonalizedRoadmapEdge" (
    "id" TEXT NOT NULL,
    "roadmapId" TEXT NOT NULL,
    "sourceNodeId" TEXT NOT NULL,
    "targetNodeId" TEXT NOT NULL,
    "label" TEXT,
    "edgeType" TEXT NOT NULL DEFAULT 'PREREQUISITE',
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalizedRoadmapEdge_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE INDEX IF NOT EXISTS "PersonalizedRoadmap_userId_idx" ON "PersonalizedRoadmap"("userId");
CREATE INDEX IF NOT EXISTS "PersonalizedRoadmap_status_idx" ON "PersonalizedRoadmap"("status");
CREATE INDEX IF NOT EXISTS "PersonalizedRoadmap_createdAt_idx" ON "PersonalizedRoadmap"("createdAt");

CREATE INDEX IF NOT EXISTS "PersonalizedRoadmapLevel_roadmapId_idx" ON "PersonalizedRoadmapLevel"("roadmapId");
CREATE UNIQUE INDEX IF NOT EXISTS "PersonalizedRoadmapLevel_roadmapId_levelIndex_key" ON "PersonalizedRoadmapLevel"("roadmapId", "levelIndex");

CREATE INDEX IF NOT EXISTS "PersonalizedRoadmapNode_roadmapId_idx" ON "PersonalizedRoadmapNode"("roadmapId");
CREATE INDEX IF NOT EXISTS "PersonalizedRoadmapNode_levelId_idx" ON "PersonalizedRoadmapNode"("levelId");
CREATE INDEX IF NOT EXISTS "PersonalizedRoadmapNode_status_idx" ON "PersonalizedRoadmapNode"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "PersonalizedRoadmapNode_roadmapId_nodeKey_key" ON "PersonalizedRoadmapNode"("roadmapId", "nodeKey");

CREATE INDEX IF NOT EXISTS "PersonalizedRoadmapEdge_roadmapId_idx" ON "PersonalizedRoadmapEdge"("roadmapId");
CREATE INDEX IF NOT EXISTS "PersonalizedRoadmapEdge_sourceNodeId_idx" ON "PersonalizedRoadmapEdge"("sourceNodeId");
CREATE INDEX IF NOT EXISTS "PersonalizedRoadmapEdge_targetNodeId_idx" ON "PersonalizedRoadmapEdge"("targetNodeId");
CREATE UNIQUE INDEX IF NOT EXISTS "PersonalizedRoadmapEdge_roadmapId_sourceNodeId_targetNodeId_key" ON "PersonalizedRoadmapEdge"("roadmapId", "sourceNodeId", "targetNodeId");

-- AddForeignKey
ALTER TABLE "PersonalizedRoadmap" ADD CONSTRAINT "PersonalizedRoadmap_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalizedRoadmapLevel" ADD CONSTRAINT "PersonalizedRoadmapLevel_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "PersonalizedRoadmap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalizedRoadmapNode" ADD CONSTRAINT "PersonalizedRoadmapNode_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "PersonalizedRoadmap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalizedRoadmapNode" ADD CONSTRAINT "PersonalizedRoadmapNode_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "PersonalizedRoadmapLevel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalizedRoadmapEdge" ADD CONSTRAINT "PersonalizedRoadmapEdge_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "PersonalizedRoadmap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalizedRoadmapEdge" ADD CONSTRAINT "PersonalizedRoadmapEdge_sourceNodeId_fkey" FOREIGN KEY ("sourceNodeId") REFERENCES "PersonalizedRoadmapNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalizedRoadmapEdge" ADD CONSTRAINT "PersonalizedRoadmapEdge_targetNodeId_fkey" FOREIGN KEY ("targetNodeId") REFERENCES "PersonalizedRoadmapNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

