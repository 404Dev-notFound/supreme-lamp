-- Rollback Script: 20261102_enterprise_db_audit_optimization
-- Description: Reverts DECIMAL(10,2) to DOUBLE PRECISION (Float) and drops created indexes.

BEGIN;

-- 1. Drop Indexes
DROP INDEX IF EXISTS "Notification_userId_read_idx";
DROP INDEX IF EXISTS "User_createdAt_idx";
DROP INDEX IF EXISTS "User_status_idx";
DROP INDEX IF EXISTS "Project_isPinned_idx";
DROP INDEX IF EXISTS "Job_createdAt_idx";
DROP INDEX IF EXISTS "Job_isActive_idx";
DROP INDEX IF EXISTS "PremiumResource_categoryId_idx";
DROP INDEX IF EXISTS "MembershipTransaction_membershipId_idx";
DROP INDEX IF EXISTS "MembershipHistory_planId_idx";
DROP INDEX IF EXISTS "JobApplication_resumeId_idx";

-- 2. Revert Monetary Fields to DOUBLE PRECISION
ALTER TABLE "MentorProfile" ALTER COLUMN "hourlyRate" SET DATA TYPE DOUBLE PRECISION;
ALTER TABLE "MembershipTransaction" ALTER COLUMN "amount" SET DATA TYPE DOUBLE PRECISION;
ALTER TABLE "MembershipPlan" ALTER COLUMN "price" SET DATA TYPE DOUBLE PRECISION;

COMMIT;

