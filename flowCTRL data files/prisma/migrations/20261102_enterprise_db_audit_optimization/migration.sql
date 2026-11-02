-- Migration: 20261102_enterprise_db_audit_optimization
-- Description: Enforce DECIMAL(10,2) monetary precision on MembershipPlan.price, MembershipTransaction.amount,
--              MentorProfile.hourlyRate, and create missing foreign key and query performance indexes.

BEGIN;

-- 1. Precision Optimization for Financial and Rate Fields
ALTER TABLE "MembershipPlan" ALTER COLUMN "price" SET DATA TYPE DECIMAL(10,2);
ALTER TABLE "MembershipTransaction" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(10,2);
ALTER TABLE "MentorProfile" ALTER COLUMN "hourlyRate" SET DATA TYPE DECIMAL(10,2);

-- 2. Foreign Key Indexes (Eliminate sequential scans on joins and cascades)
CREATE INDEX IF NOT EXISTS "JobApplication_resumeId_idx" ON "JobApplication"("resumeId");
CREATE INDEX IF NOT EXISTS "MembershipHistory_planId_idx" ON "MembershipHistory"("planId");
CREATE INDEX IF NOT EXISTS "MembershipTransaction_membershipId_idx" ON "MembershipTransaction"("membershipId");
CREATE INDEX IF NOT EXISTS "PremiumResource_categoryId_idx" ON "PremiumResource"("categoryId");

-- 3. High-Traffic Query and Composite Performance Indexes
CREATE INDEX IF NOT EXISTS "Job_isActive_idx" ON "Job"("isActive");
CREATE INDEX IF NOT EXISTS "Job_createdAt_idx" ON "Job"("createdAt");
CREATE INDEX IF NOT EXISTS "Project_isPinned_idx" ON "Project"("isPinned");
CREATE INDEX IF NOT EXISTS "User_status_idx" ON "User"("status");
CREATE INDEX IF NOT EXISTS "User_createdAt_idx" ON "User"("createdAt");
CREATE INDEX IF NOT EXISTS "Notification_userId_read_idx" ON "Notification"("userId", "read");

COMMIT;

