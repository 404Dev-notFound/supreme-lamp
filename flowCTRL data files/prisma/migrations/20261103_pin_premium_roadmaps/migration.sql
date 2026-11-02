-- Migration: 20261103_pin_premium_roadmaps
-- Description: Add isPinned column and index to PremiumResource table for pinning premium roadmaps

ALTER TABLE "PremiumResource" ADD COLUMN IF NOT EXISTS "isPinned" BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS "PremiumResource_isPinned_idx" ON "PremiumResource"("isPinned");
