-- ==============================================================================
-- flowCTRL PostgreSQL Database Initialization Script
-- Centralized in "flowCTRL data files/docker/init-db.sql"
-- ==============================================================================

-- Ensure standard extensions are available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set standard UTC timezone for all timestamp fields
SET TIME ZONE 'UTC';

-- Database verification notice
DO $$
BEGIN
  RAISE NOTICE 'flowCTRL database successfully initialized on PostgreSQL';
END $$;
